import math
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Tuple
from database import (
    users_collection,
    badges_collection,
    user_badges_collection,
    activity_collection,
    problems_collection,
    dsa_concepts_collection,
    dsa_levels_collection,
    user_problem_progress_collection
)

XP_REWARDS = {
    "Easy": 10,
    "Medium": 20,
    "Hard": 40,
    "daily_challenge_bonus": 30,
    "battle_participation": 10,
    "battle_win": 50,
    "coins_per_problem": 5,
    "coins_battle_win": 20
}

def calculate_level_and_progress(xp: int) -> Dict[str, Any]:
    """
    Computes player level, XP needed for current/next level, and progress percentage.
    Formula: Level L requires 25 * (L - 1)^2 XP.
    """
    if xp < 0:
        xp = 0
    # Level = floor(sqrt(xp / 25)) + 1
    level = int(math.floor(math.sqrt(xp / 25.0))) + 1
    current_level_base_xp = 25 * ((level - 1) ** 2)
    next_level_base_xp = 25 * (level ** 2)
    xp_in_level = xp - current_level_base_xp
    xp_needed_for_level = next_level_base_xp - current_level_base_xp
    progress_pct = min(100.0, max(0.0, round((xp_in_level / float(xp_needed_for_level)) * 100.0, 1))) if xp_needed_for_level > 0 else 100.0

    return {
        "level": level,
        "xp": xp,
        "current_level_base_xp": current_level_base_xp,
        "next_level_base_xp": next_level_base_xp,
        "xp_in_level": xp_in_level,
        "xp_needed_for_level": xp_needed_for_level,
        "progress_percentage": progress_pct
    }

def update_user_streak(user_id: str) -> Dict[str, Any]:
    """
    Updates user daily streak based on UTC date.
    """
    user = users_collection.find_one({"_id": user_id})
    if not user:
        return {"current_streak": 1, "longest_streak": 1}

    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    last_active = user.get("last_active_date")
    current_streak = user.get("streak", 0)
    longest_streak = user.get("longest_streak", 0)

    if not last_active:
        current_streak = 1
    elif last_active == today_str:
        # Already active today, maintain streak
        pass
    else:
        try:
            last_date = datetime.strptime(last_active, "%Y-%m-%d").date()
            today_date = datetime.now(timezone.utc).date()
            diff_days = (today_date - last_date).days
            if diff_days == 1:
                current_streak += 1
            else:
                current_streak = 1
        except Exception:
            current_streak = 1

    longest_streak = max(longest_streak, current_streak)

    users_collection.update_one(
        {"_id": user_id},
        {"$set": {
            "streak": current_streak,
            "longest_streak": longest_streak,
            "last_active_date": today_str
        }}
    )

    return {"current_streak": current_streak, "longest_streak": longest_streak}

def calculate_elo_rating(rating_a: int, rating_b: int, score_a: float, k: int = 32) -> Tuple[int, int, int, int]:
    """
    Standard Elo rating calculation.
    score_a: 1.0 (win), 0.5 (draw), 0.0 (loss)
    Returns: (new_rating_a, new_rating_b, delta_a, delta_b)
    """
    expected_a = 1.0 / (1.0 + math.pow(10, (rating_b - rating_a) / 400.0))
    expected_b = 1.0 - expected_a
    score_b = 1.0 - score_a

    delta_a = int(round(k * (score_a - expected_a)))
    delta_b = int(round(k * (score_b - expected_b)))

    # Ensure reasonable bounds
    new_rating_a = max(100, rating_a + delta_a)
    new_rating_b = max(100, rating_b + delta_b)

    return new_rating_a, new_rating_b, delta_a, delta_b

def check_and_award_badges(user_id: str) -> List[Dict[str, Any]]:
    """
    Checks criteria for all badges and awards newly unlocked badges to user.
    """
    user = users_collection.find_one({"_id": user_id})
    if not user:
        return []

    unlocked_badges = []
    existing_user_badges = {b.get("badge_id") for b in user_badges_collection.find({"user_id": user_id})}
    all_badges = list(badges_collection.find({}))

    problems_solved = user.get("problems_solved", 0)
    wins = user.get("wins", 0)
    streak = user.get("streak", 0)
    longest_streak = user.get("longest_streak", 0)
    best_streak = max(streak, longest_streak)
    hard_solved = user.get("hard_problems_solved", 0)

    for badge in all_badges:
        b_id = badge.get("badge_id")
        if b_id in existing_user_badges:
            continue

        criteria = badge.get("criteria", {})
        c_type = criteria.get("type")
        c_val = criteria.get("value", 0)

        awarded = False
        if c_type == "problems_solved" and problems_solved >= c_val:
            awarded = True
        elif c_type == "battle_wins" and wins >= c_val:
            awarded = True
        elif c_type == "streak_days" and best_streak >= c_val:
            awarded = True
        elif c_type == "hard_problems" and hard_solved >= c_val:
            awarded = True

        if awarded:
            now_iso = datetime.now(timezone.utc).isoformat()
            user_badge_doc = {
                "user_id": user_id,
                "badge_id": b_id,
                "badge_name": badge.get("name"),
                "badge_description": badge.get("description"),
                "badge_icon": badge.get("icon"),
                "unlocked_at": now_iso
            }
            user_badges_collection.insert_one(user_badge_doc)
            unlocked_badges.append(user_badge_doc)

            # Record activity
            activity_collection.insert_one({
                "user_id": user_id,
                "type": "badge_unlocked",
                "title": f"Unlocked Badge: {badge.get('name')}",
                "description": badge.get("description"),
                "created_at": now_iso
            })

    return unlocked_badges

def get_dsa_concept_mastery(user_id: str) -> Dict[str, Any]:
    """
    Calculates independent concept progression, level statuses (Completed, Current, Locked),
    concept mastery percentages, and overall weighted DSA progress.
    """
    concepts = list(dsa_concepts_collection.find({}))
    solved_progress = list(user_problem_progress_collection.find({"user_id": user_id, "status": "solved"}))
    solved_problem_ids = {p.get("problem_id") for p in solved_progress}

    concept_stats = []
    total_mastery_sum = 0.0
    concept_count = len(concepts) if concepts else 1

    for concept in concepts:
        c_id = concept.get("concept_id")
        c_name = concept.get("name")
        c_icon = concept.get("icon", "Code")

        levels = list(dsa_levels_collection.find({"concept_id": c_id}))
        if not levels and "levels" in concept:
            levels = concept.get("levels", [])
        # Sort levels by level_number
        levels.sort(key=lambda l: l.get("level_number", 1))

        levels_data = []
        concept_total_problems = 0
        concept_solved_problems = 0
        current_level_num = 1
        previous_level_completed = True

        for idx, lvl in enumerate(levels):
            lvl_num = lvl.get("level_number", idx + 1)
            lvl_problems = lvl.get("problem_ids", [])
            concept_total_problems += len(lvl_problems)
            
            solved_in_lvl = [pid for pid in lvl_problems if pid in solved_problem_ids]
            solved_count = len(solved_in_lvl)
            concept_solved_problems += solved_count

            req_solves = lvl.get("required_solves", max(1, len(lvl_problems) - 1))
            is_completed = (solved_count >= req_solves) or (len(lvl_problems) > 0 and solved_count == len(lvl_problems))

            if previous_level_completed:
                if is_completed:
                    lvl_status = "completed"
                else:
                    lvl_status = "current"
                    current_level_num = lvl_num
                    previous_level_completed = False
            else:
                lvl_status = "locked"

            levels_data.append({
                "level_number": lvl_num,
                "name": lvl.get("name", f"Level {lvl_num}"),
                "description": lvl.get("description", ""),
                "status": lvl_status,
                "total_problems": len(lvl_problems),
                "solved_problems": solved_count,
                "progress_percentage": round((solved_count / max(1, len(lvl_problems))) * 100.0, 1),
                "problem_ids": lvl_problems
            })

        mastery_pct = round((concept_solved_problems / max(1, concept_total_problems)) * 100.0, 1) if concept_total_problems > 0 else 0.0
        total_mastery_sum += mastery_pct

        concept_stats.append({
            "concept_id": c_id,
            "name": c_name,
            "icon": c_icon,
            "current_level": current_level_num,
            "total_levels": len(levels_data),
            "mastery_percentage": mastery_pct,
            "total_problems": concept_total_problems,
            "solved_problems": concept_solved_problems,
            "levels": levels_data
        })

    overall_progress = round(total_mastery_sum / max(1, concept_count), 1)

    # Next recommended concept: lowest mastery with unlocked/unsolved problems
    sorted_by_mastery = sorted(concept_stats, key=lambda c: c["mastery_percentage"])
    next_recommended = sorted_by_mastery[0] if sorted_by_mastery else None

    return {
        "overall_dsa_progress": overall_progress,
        "concepts": concept_stats,
        "next_recommended_concept": next_recommended.get("name") if next_recommended else "Arrays"
    }
