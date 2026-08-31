import os
import re
import json
import logging
import random
import time
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, HTTPException, Depends, status, WebSocket, WebSocketDisconnect, Query, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database and Utilities
from database import (
    users_collection,
    battles_collection,
    problems_collection,
    dsa_concepts_collection,
    dsa_levels_collection,
    user_problem_progress_collection,
    submissions_collection,
    badges_collection,
    user_badges_collection,
    activity_collection,
    daily_challenges_collection
)
from auth_utils import (
    verify_password, 
    get_password_hash, 
    create_access_token, 
    verify_token,
    validate_signup_credentials
)
from execution_engine import execution_engine
from gamification import (
    calculate_level_and_progress,
    update_user_streak,
    calculate_elo_rating,
    check_and_award_badges,
    get_dsa_concept_mastery,
    XP_REWARDS
)
from battle_manager import matchmaking_queue, battle_manager
from ai_service import ai_service

logger = logging.getLogger("codeclash")
logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title="CodeClash API",
    description="Competitive DSA Gamification & Real-Time 1v1 Battle Platform",
    version="2.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_origin_regex="https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.responses import JSONResponse
import traceback

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    err_str = "".join(traceback.format_exception(type(exc), exc, exc.__traceback__))
    logger.error(f"Unhandled error on {request.url.path}: {err_str}")
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "path": request.url.path}
    )

@app.on_event("startup")
async def startup_seed():
    try:
        from seed_problems import seed_all_data
        seed_all_data(force=False)
        logger.info("Database verified and auto-seeded successfully.")
    except Exception as e:
        logger.warning(f"Auto-seed error on startup: {e}")

security = HTTPBearer(auto_error=False)

# Pydantic Request Models
class SignupRequest(BaseModel):
    username: str
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    avatar: Optional[str] = None
    gemini_api_key: Optional[str] = None

class CodeExecutionRequest(BaseModel):
    language: str
    code: str
    problem_id: str

class CodeExplainerRequest(BaseModel):
    code_snippet: str
    language: Optional[str] = "python"
    problem_id: Optional[str] = None

class BattleTimeoutRequest(BaseModel):
    battle_id: str
    winner_id: Optional[str] = None

# Auth Dependencies
async def get_current_user_optional(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[Dict[str, Any]]:
    if not credentials:
        return None
    token = credentials.credentials
    payload = verify_token(token)
    if not payload:
        return None
    user_id = payload.get("sub")
    return users_collection.find_one({"_id": user_id})

async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Dict[str, Any]:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = credentials.credentials
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = payload.get("sub")
    user = users_collection.find_one({"_id": user_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    return user

# Root Health Check
@app.get("/")
async def root():
    return {
        "service": "CodeClash Competitive DSA Platform API",
        "status": "online",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

# ==================== 1. AUTHENTICATION ====================

@app.post("/api/auth/signup", status_code=status.HTTP_201_CREATED)
@app.post("/api/auth/register", status_code=status.HTTP_201_CREATED)
async def signup(request: SignupRequest):
    # Strict validation of username, email format, and password complexity
    is_valid, error_msg = validate_signup_credentials(
        username=request.username,
        email=request.email,
        password=request.password
    )
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_msg)

    clean_email = request.email.strip().lower()
    clean_username = request.username.strip()

    if users_collection.find_one({"email": clean_email}):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    if users_collection.find_one({"username": {"$regex": f"^{re.escape(clean_username)}$", "$options": "i"}}):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already taken")

    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(request.password)
    now_iso = datetime.now(timezone.utc).isoformat()

    avatar_seed = request.username.replace(" ", "")
    user_data = {
        "_id": user_id,
        "username": request.username,
        "email": request.email.lower(),
        "hashed_password": hashed_password,
        "avatar": f"https://api.dicebear.com/7.x/bottts/svg?seed={avatar_seed}",
        "name": request.username,
        "total_points": 0,
        "coins": 50,  # Starting coin bonus
        "rating": 1000,
        "wins": 0,
        "losses": 0,
        "battles_count": 0,
        "streak": 0,
        "longest_streak": 0,
        "problems_solved": 0,
        "hard_problems_solved": 0,
        "created_at": now_iso,
        "last_active_date": None,
        "gemini_api_key": None
    }

    users_collection.insert_one(user_data)
    access_token = create_access_token(data={"sub": user_id})
    level_info = calculate_level_and_progress(0)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "username": request.username,
            "email": request.email,
            "avatar": user_data["avatar"],
            "name": user_data["name"],
            "total_points": 0,
            "coins": 50,
            "rating": 1000,
            "wins": 0,
            "losses": 0,
            "streak": 0,
            "longest_streak": 0,
            "problems_solved": 0,
            "level_info": level_info
        }
    }

@app.post("/api/auth/login")
async def login(request: LoginRequest):
    user = users_collection.find_one({"email": request.email.lower()})
    if not user or not verify_password(request.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    access_token = create_access_token(data={"sub": user["_id"]})
    level_info = calculate_level_and_progress(user.get("total_points", 0))

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["_id"],
            "username": user["username"],
            "email": user["email"],
            "avatar": user.get("avatar", f"https://api.dicebear.com/7.x/bottts/svg?seed={user['username']}"),
            "name": user.get("name"),
            "total_points": user.get("total_points", 0),
            "coins": user.get("coins", 0),
            "rating": user.get("rating", 1000),
            "wins": user.get("wins", 0),
            "losses": user.get("losses", 0),
            "streak": user.get("streak", 0),
            "longest_streak": user.get("longest_streak", 0),
            "problems_solved": user.get("problems_solved", 0),
            "level_info": level_info
        }
    }

@app.get("/api/auth/me")
async def get_current_user_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    level_info = calculate_level_and_progress(current_user.get("total_points", 0))
    return {
        "id": current_user["_id"],
        "username": current_user["username"],
        "email": current_user["email"],
        "avatar": current_user.get("avatar", f"https://api.dicebear.com/7.x/bottts/svg?seed={current_user['username']}"),
        "name": current_user.get("name"),
        "total_points": current_user.get("total_points", 0),
        "coins": current_user.get("coins", 0),
        "rating": current_user.get("rating", 1000),
        "wins": current_user.get("wins", 0),
        "losses": current_user.get("losses", 0),
        "streak": current_user.get("streak", 0),
        "longest_streak": current_user.get("longest_streak", 0),
        "problems_solved": current_user.get("problems_solved", 0),
        "hard_problems_solved": current_user.get("hard_problems_solved", 0),
        "created_at": current_user.get("created_at"),
        "gemini_api_key": current_user.get("gemini_api_key"),
        "level_info": level_info
    }

# ==================== 2. DASHBOARD ====================

@app.get("/api/dashboard")
async def get_dashboard_data(current_user: Dict[str, Any] = Depends(get_current_user)):
    user_id = current_user["_id"]
    level_info = calculate_level_and_progress(current_user.get("total_points", 0))
    mastery_info = get_dsa_concept_mastery(user_id)

    # Calculate global rank
    all_users = list(users_collection.find({}, sort=[("rating", -1)]))
    user_rank = 1
    for idx, u in enumerate(all_users):
        if u.get("_id") == user_id:
            user_rank = idx + 1
            break

    # Solved difficulties breakdown
    solved_progress = list(user_problem_progress_collection.find({"user_id": user_id, "status": "solved"}))
    solved_pids = {p["problem_id"] for p in solved_progress}
    solved_problems_docs = list(problems_collection.find({"problem_id": {"$in": list(solved_pids)}}))
    
    easy_count = sum(1 for p in solved_problems_docs if p.get("difficulty") == "Easy")
    medium_count = sum(1 for p in solved_problems_docs if p.get("difficulty") == "Medium")
    hard_count = sum(1 for p in solved_problems_docs if p.get("difficulty") == "Hard")

    # Daily challenge
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    all_problems = list(problems_collection.find({}))
    daily_idx = int(hash(today_str)) % max(1, len(all_problems))
    daily_problem = all_problems[daily_idx] if all_problems else None
    daily_solved = (daily_problem.get("problem_id") in solved_pids) if daily_problem else False

    # Recommended problems (target weak concepts & unsolved)
    unsolved_problems = [p for p in all_problems if p.get("problem_id") not in solved_pids]
    # Prioritize lowest mastery concept
    recommended = []
    if mastery_info.get("concepts"):
        weakest_concept_id = mastery_info["concepts"][0]["concept_id"]
        weak_unsolved = [p for p in unsolved_problems if p.get("concept_id") == weakest_concept_id]
        recommended = weak_unsolved[:3] if weak_unsolved else unsolved_problems[:3]
    else:
        recommended = unsolved_problems[:3]

    for p in recommended:
        p["id"] = p.get("problem_id")
        p.pop("_id", None)
        p.pop("hiddenTestCases", None)

    # Recent activity
    recent_activity = list(activity_collection.find({"user_id": user_id}, sort=[("created_at", -1)]))[:6]
    for act in recent_activity:
        act.pop("_id", None)

    return {
        "user": {
            "id": user_id,
            "username": current_user["username"],
            "avatar": current_user.get("avatar"),
            "rating": current_user.get("rating", 1000),
            "global_rank": user_rank,
            "coins": current_user.get("coins", 0),
            "streak": current_user.get("streak", 0),
            "longest_streak": current_user.get("longest_streak", 0),
            "wins": current_user.get("wins", 0),
            "losses": current_user.get("losses", 0),
            "win_rate": round((current_user.get("wins", 0) / max(1, current_user.get("battles_count", 0))) * 100.0, 1),
            "level_info": level_info,
            "solved_breakdown": {
                "total": len(solved_pids),
                "easy": easy_count,
                "medium": medium_count,
                "hard": hard_count
            }
        },
        "overall_dsa_progress": mastery_info.get("overall_dsa_progress", 0.0),
        "concepts_mastery": mastery_info.get("concepts", []),
        "daily_challenge": {
            "problem": {
                "id": daily_problem.get("problem_id"),
                "title": daily_problem.get("title"),
                "difficulty": daily_problem.get("difficulty"),
                "category": daily_problem.get("category")
            } if daily_problem else None,
            "bonus_xp": XP_REWARDS["daily_challenge_bonus"],
            "is_solved": daily_solved,
            "date": today_str
        },
        "recommended_problems": recommended,
        "recent_activity": recent_activity
    }

# ==================== 3. DSA PRACTICE & ROADMAP ====================

@app.get("/api/dsa/roadmap")
async def get_dsa_roadmap(current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)):
    try:
        user_id = str(current_user["_id"]) if current_user and "_id" in current_user else "anonymous"
        mastery_data = get_dsa_concept_mastery(user_id)
        return mastery_data
    except Exception as e:
        logger.error(f"Error computing roadmap: {e}")
        return {
            "overall_dsa_progress": 0.0,
            "concepts": [],
            "next_recommended_concept": "Arrays & Hashing"
        }

@app.get("/api/dsa/concepts")
async def get_dsa_concepts():
    concepts = list(dsa_concepts_collection.find({}))
    for c in concepts:
        c.pop("_id", None)
    return {"concepts": concepts}

@app.get("/api/dsa/concepts/{concept_id}")
async def get_dsa_concept_detail(concept_id: str, current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)):
    concept = dsa_concepts_collection.find_one({"concept_id": concept_id})
    if not concept:
        raise HTTPException(status_code=404, detail="Concept not found")

    user_id = current_user["_id"] if current_user else "anonymous"
    solved_progress = list(user_problem_progress_collection.find({"user_id": user_id, "status": "solved"}))
    solved_pids = {p["problem_id"] for p in solved_progress}

    levels = list(dsa_levels_collection.find({"concept_id": concept_id}))
    if not levels and "levels" in concept:
        levels = concept.get("levels", [])
    levels.sort(key=lambda l: l.get("level_number", 1))

    levels_detail = []
    prev_unlocked = True
    for lvl in levels:
        lvl_pids = lvl.get("problem_ids", [])
        problems_in_level = list(problems_collection.find({"problem_id": {"$in": lvl_pids}}))
        problem_items = []
        solved_count = 0
        for p in problems_in_level:
            is_solved = p["problem_id"] in solved_pids
            if is_solved:
                solved_count += 1
            problem_items.append({
                "id": p["problem_id"],
                "title": p["title"],
                "difficulty": p["difficulty"],
                "xp_reward": p.get("xp_reward", 10),
                "is_solved": is_solved
            })

        req_solves = lvl.get("required_solves", max(1, len(lvl_pids) - 1))
        is_completed = (solved_count >= req_solves) or (len(lvl_pids) > 0 and solved_count == len(lvl_pids))
        status_str = "completed" if is_completed else ("current" if prev_unlocked else "locked")
        if not is_completed:
            prev_unlocked = False

        levels_detail.append({
            "level_id": lvl.get("level_id"),
            "level_number": lvl.get("level_number"),
            "name": lvl.get("name"),
            "description": lvl.get("description"),
            "status": status_str,
            "required_solves": req_solves,
            "solved_count": solved_count,
            "total_count": len(lvl_pids),
            "problems": problem_items
        })

    concept.pop("_id", None)
    return {
        "concept": concept,
        "levels": levels_detail
    }

# ==================== 4. PROBLEMS ====================

@app.get("/api/problems")
async def get_problems(
    difficulty: Optional[str] = None,
    category: Optional[str] = None,
    concept_id: Optional[str] = None,
    level_number: Optional[int] = None,
    search: Optional[str] = None,
    status_filter: Optional[str] = None,  # all, solved, unsolved
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    query = {}
    if difficulty and difficulty != "all":
        query["difficulty"] = difficulty
    if category and category != "all":
        query["category"] = category
    if concept_id and concept_id != "all":
        query["concept_id"] = concept_id
    if level_number:
        query["level_number"] = level_number

    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]

    problems = list(problems_collection.find(query))
    
    # Get solved list if user is authenticated
    solved_pids = set()
    if current_user:
        user_progress = user_problem_progress_collection.find({"user_id": current_user["_id"], "status": "solved"})
        solved_pids = {p["problem_id"] for p in user_progress}

    formatted_problems = []
    for problem in problems:
        pid = problem.get("problem_id", problem.get("id"))
        is_solved = pid in solved_pids

        if status_filter == "solved" and not is_solved:
            continue
        if status_filter == "unsolved" and is_solved:
            continue

        p_copy = dict(problem)
        p_copy["id"] = pid
        p_copy["is_solved"] = is_solved
        p_copy.pop("_id", None)
        p_copy.pop("hiddenTestCases", None)  # Protect hidden test cases
        formatted_problems.append(p_copy)

    return {"problems": formatted_problems, "count": len(formatted_problems)}

@app.get("/api/problems/recommended")
async def get_recommended_problems(current_user: Dict[str, Any] = Depends(get_current_user)):
    user_id = current_user["_id"]
    mastery_info = get_dsa_concept_mastery(user_id)
    all_problems = list(problems_collection.find({}))
    solved_progress = list(user_problem_progress_collection.find({"user_id": user_id, "status": "solved"}))
    solved_pids = {p["problem_id"] for p in solved_progress}

    unsolved = [p for p in all_problems if p["problem_id"] not in solved_pids]
    if not unsolved:
        unsolved = all_problems

    # Sort by weakest concept
    weakest_concepts = [c["concept_id"] for c in mastery_info.get("concepts", [])]
    def sort_score(p):
        cid = p.get("concept_id", "")
        rank = weakest_concepts.index(cid) if cid in weakest_concepts else 99
        return rank

    unsolved.sort(key=sort_score)
    recommended = unsolved[:5]
    for p in recommended:
        p["id"] = p.get("problem_id")
        p.pop("_id", None)
        p.pop("hiddenTestCases", None)

    return {"recommended": recommended}

@app.get("/api/problems/{problem_id}")
async def get_problem(problem_id: str, current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)):
    problem = problems_collection.find_one({"problem_id": problem_id}) or problems_collection.find_one({"id": problem_id})
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")

    is_solved = False
    if current_user:
        record = user_problem_progress_collection.find_one({
            "user_id": current_user["_id"],
            "problem_id": problem.get("problem_id", problem_id),
            "status": "solved"
        })
        is_solved = record is not None

    res_problem = dict(problem)
    res_problem["id"] = res_problem.get("problem_id", problem_id)
    res_problem["is_solved"] = is_solved
    res_problem.pop("_id", None)
    res_problem.pop("hiddenTestCases", None)  # Protect hidden test cases

    return res_problem

# ==================== 5. SUBMISSIONS & CODE EXECUTION ====================

@app.post("/api/submissions/run")
async def run_code(request: CodeExecutionRequest):
    """
    Executes user code against public test cases only without saving submission.
    """
    problem = problems_collection.find_one({"problem_id": request.problem_id})
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")

    public_test_cases = problem.get("testCases", [])
    exec_result = execution_engine.execute(
        language=request.language,
        code=request.code,
        test_cases=public_test_cases,
        entry_point=problem.get("entry_point")
    )

    return {
        "status": exec_result.get("status"),
        "success": exec_result.get("success"),
        "total_test_cases": exec_result.get("total_test_cases"),
        "passed_test_cases": exec_result.get("passed_test_cases"),
        "runtime_ms": exec_result.get("runtime_ms"),
        "test_results": exec_result.get("test_results", []),
        "error": exec_result.get("error")
    }

@app.post("/api/submissions/submit")
async def submit_code(request: CodeExecutionRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Executes code against both public and hidden test cases, computes XP, updates streak,
    unlocks badges, and records progression.
    """
    user_id = current_user["_id"]
    problem = problems_collection.find_one({"problem_id": request.problem_id})
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")

    all_test_cases = problem.get("testCases", []) + problem.get("hiddenTestCases", [])
    exec_result = execution_engine.execute(
        language=request.language,
        code=request.code,
        test_cases=all_test_cases,
        entry_point=problem.get("entry_point")
    )

    all_passed = exec_result.get("success", False)
    now_iso = datetime.now(timezone.utc).isoformat()
    submission_id = str(uuid.uuid4())

    # Create submission record
    sub_doc = {
        "submission_id": submission_id,
        "user_id": user_id,
        "problem_id": request.problem_id,
        "language": request.language,
        "code": request.code,
        "status": exec_result.get("status"),
        "passed": all_passed,
        "passed_test_cases": exec_result.get("passed_test_cases"),
        "total_test_cases": exec_result.get("total_test_cases"),
        "runtime_ms": exec_result.get("runtime_ms"),
        "submitted_at": now_iso
    }
    submissions_collection.insert_one(sub_doc)

    xp_gained = 0
    coins_gained = 0
    new_badges = []
    is_first_solve = False

    if all_passed:
        # Check if first time solving this problem
        existing_solve = user_problem_progress_collection.find_one({
            "user_id": user_id,
            "problem_id": request.problem_id,
            "status": "solved"
        })

        if not existing_solve:
            is_first_solve = True
            diff = problem.get("difficulty", "Easy")
            xp_gained = XP_REWARDS.get(diff, 10)
            coins_gained = XP_REWARDS["coins_per_problem"]

            # Record solve
            user_problem_progress_collection.update_one(
                {"user_id": user_id, "problem_id": request.problem_id},
                {"$set": {
                    "user_id": user_id,
                    "problem_id": request.problem_id,
                    "concept_id": problem.get("concept_id"),
                    "difficulty": diff,
                    "status": "solved",
                    "solved_at": now_iso
                }},
                upsert=True
            )

            # Update User stats
            is_hard = (diff == "Hard")
            users_collection.update_one(
                {"_id": user_id},
                {
                    "$inc": {
                        "total_points": xp_gained,
                        "coins": coins_gained,
                        "problems_solved": 1,
                        "hard_problems_solved": 1 if is_hard else 0
                    }
                }
            )

            # Update streak
            update_user_streak(user_id)

            # Check Badges
            new_badges = check_and_award_badges(user_id)

            # Record Activity
            activity_collection.insert_one({
                "user_id": user_id,
                "type": "problem_solved",
                "title": f"Solved {problem.get('title')}",
                "description": f"Earned +{xp_gained} XP and +{coins_gained} Coins ({diff})",
                "problem_id": request.problem_id,
                "created_at": now_iso
            })

    # Fetch updated user info
    updated_user = users_collection.find_one({"_id": user_id})
    level_info = calculate_level_and_progress(updated_user.get("total_points", 0))

    return {
        "submission_id": submission_id,
        "status": exec_result.get("status"),
        "success": all_passed,
        "total_test_cases": exec_result.get("total_test_cases"),
        "passed_test_cases": exec_result.get("passed_test_cases"),
        "runtime_ms": exec_result.get("runtime_ms"),
        "test_results": exec_result.get("test_results", [])[:3],  # Return public test case summaries
        "is_first_solve": is_first_solve,
        "xp_gained": xp_gained,
        "coins_gained": coins_gained,
        "new_badges": new_badges,
        "user_level_info": level_info,
        "streak": updated_user.get("streak", 0)
    }

# ==================== 6. 1v1 BATTLE ARENA ====================

@app.get("/api/battle/history")
async def get_battle_history(current_user: Dict[str, Any] = Depends(get_current_user)):
    user_id = current_user["_id"]
    battles = battles_collection.find({
        "$or": [{"player1_id": user_id}, {"player2_id": user_id}]
    })
    battles.sort(key=lambda b: b.get("start_time", ""), reverse=True)

    formatted_history = []
    for b in battles:
        is_p1 = b.get("player1_id") == user_id
        opponent_name = b.get("player2_username") if is_p1 else b.get("player1_username")
        winner_id = b.get("winner_id")
        
        result = "win" if winner_id == user_id else ("draw" if not winner_id and b.get("status") == "timeout" else "loss")
        delta = b.get("rating_delta", {}).get(user_id, 0)

        formatted_history.append({
            "battle_id": b.get("battle_id"),
            "problem_id": b.get("problem_id"),
            "opponent_name": opponent_name,
            "result": result,
            "status": b.get("status"),
            "rating_delta": delta,
            "start_time": b.get("start_time"),
            "end_time": b.get("end_time")
        })

    return {"battles": formatted_history}

@app.post("/api/battle/create")
async def create_battle_direct(
    data: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Creates a direct battle room between two players.
    """
    p1 = data.get("player1", {"user_id": current_user["_id"], "username": current_user.get("username", "Player 1"), "rating": current_user.get("rating", 1000)})
    p2 = data.get("player2", {"user_id": "opponent", "username": "Opponent", "rating": 1000})
    problem_id = data.get("problem_id", "two-sum")
    room = battle_manager.create_battle(p1, p2, problem_id)
    return {"battle_id": room.battle_id, "room": room.to_dict()}

@app.get("/api/battle/{match_id}")
async def get_battle_room_details(match_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    room = battle_manager.get_room(match_id)
    if not room:
        # Fallback to database record
        db_battle = battles_collection.find_one({"battle_id": match_id})
        if not db_battle:
            raise HTTPException(status_code=404, detail="Battle not found")
        return {"battle": db_battle}
    
    problem = problems_collection.find_one({"problem_id": room.problem_id})
    if problem:
        problem["id"] = problem.pop("problem_id")
        problem.pop("_id", None)
        problem.pop("hiddenTestCases", None)

    return {
        "battle": room.to_dict(),
        "problem": problem
    }

@app.post("/api/battle/{match_id}/submit")
async def submit_battle_solution(
    match_id: str,
    request: CodeExecutionRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    result = await battle_manager.handle_submit(
        battle_id=match_id,
        user_id=current_user["_id"],
        code=request.code,
        language=request.language
    )
    return result

@app.post("/api/battle/timeout")
async def handle_battle_timeout(request: BattleTimeoutRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    await battle_manager.finish_battle(request.battle_id, winner_id=request.winner_id, reason="timeout")
    return {"message": "Battle timeout handled"}

# ==================== 7. DAILY CHALLENGE ====================

@app.get("/api/daily-challenge")
async def get_daily_challenge(current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)):
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    all_problems = list(problems_collection.find({}))
    if not all_problems:
        raise HTTPException(status_code=404, detail="No problems available")

    daily_idx = int(hash(today_str)) % len(all_problems)
    daily_problem = all_problems[daily_idx]

    daily_pid = daily_problem.get("problem_id", daily_problem.get("id"))
    is_solved = False
    if current_user:
        solved_rec = user_problem_progress_collection.find_one({
            "user_id": current_user["_id"],
            "problem_id": daily_pid,
            "status": "solved"
        })
        is_solved = solved_rec is not None

    res_daily = dict(daily_problem)
    res_daily["id"] = daily_pid
    res_daily.pop("_id", None)
    res_daily.pop("hiddenTestCases", None)

    # Time until UTC midnight
    now_utc = datetime.now(timezone.utc)
    midnight_utc = (now_utc + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    seconds_remaining = int((midnight_utc - now_utc).total_seconds())

    return {
        "date": today_str,
        "bonus_xp": XP_REWARDS["daily_challenge_bonus"],
        "is_solved": is_solved,
        "seconds_remaining": seconds_remaining,
        "problem": res_daily
    }

# ==================== 8. BATTLE REST ENDPOINTS ====================

class CreateBattleRequest(BaseModel):
    player1: Optional[Dict[str, Any]] = None
    player2: Optional[Dict[str, Any]] = None
    problem_id: Optional[str] = None

@app.post("/api/battle/create")
@app.post("/api/battles/create")
async def create_battle_endpoint(request: CreateBattleRequest, current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)):
    p1 = request.player1
    if not p1 and current_user:
        p1 = {
            "user_id": current_user["_id"],
            "username": current_user["username"],
            "avatar": current_user.get("avatar"),
            "rating": current_user.get("rating", 1000)
        }
    if not p1:
        p1 = {"user_id": "player_1", "username": "Player 1", "rating": 1000}

    p2 = request.player2 or {
        "user_id": "bot_arena_ai",
        "username": "Nexus_AI_Bot",
        "rating": 1020,
        "avatar": "https://api.dicebear.com/7.x/bottts/svg?seed=NexusAI"
    }

    room = battle_manager.create_battle(p1, p2, request.problem_id)
    return {
        "battle_id": room.battle_id,
        "problem_id": room.problem_id,
        "battle": room.to_dict()
    }

@app.get("/api/battle/{battle_id}")
@app.get("/api/battles/{battle_id}")
async def get_battle_details(battle_id: str, current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)):
    room = battle_manager.get_room(battle_id)
    if not room:
        db_battle = battles_collection.find_one({"battle_id": battle_id})
        if not db_battle:
            raise HTTPException(status_code=404, detail="Battle not found")
        problem_id = db_battle.get("problem_id", "two-sum")
        problem = problems_collection.find_one({"problem_id": problem_id})
        if problem:
            problem["id"] = problem.get("problem_id")
            problem.pop("_id", None)
            problem.pop("hiddenTestCases", None)
        return {
            "battle": {
                "battle_id": battle_id,
                "problem_id": problem_id,
                "status": db_battle.get("status", "completed"),
                "winner_id": db_battle.get("winner_id"),
                "players": {
                    db_battle.get("player1_id", "p1"): {
                        "user_id": db_battle.get("player1_id"),
                        "username": db_battle.get("player1_username", "Player 1"),
                        "rating": 1000,
                        "connected": False
                    },
                    db_battle.get("player2_id", "p2"): {
                        "user_id": db_battle.get("player2_id"),
                        "username": db_battle.get("player2_username", "Player 2"),
                        "rating": 1000,
                        "connected": False
                    }
                }
            },
            "problem": problem
        }

    problem = problems_collection.find_one({"problem_id": room.problem_id})
    if problem:
        problem["id"] = problem.get("problem_id")
        problem.pop("_id", None)
        problem.pop("hiddenTestCases", None)

    return {
        "battle": room.to_dict(),
        "problem": problem
    }

@app.get("/api/battles/recent")
@app.get("/api/battle/recent")
async def get_recent_battles(current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)):
    query = {}
    if current_user:
        uid = current_user["_id"]
        query = {"$or": [{"player1_id": uid}, {"player2_id": uid}]}
    recent = list(battles_collection.find(query, sort=[("start_time", -1)]))[:10]
    for b in recent:
        b.pop("_id", None)
    return {"battles": recent}

# ==================== 9. LEADERBOARD ====================

@app.get("/api/leaderboard")
async def get_leaderboard(
    timeframe: str = Query("global", enum=["global", "weekly", "monthly"]),
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    users = list(users_collection.find({}, sort=[("rating", -1), ("total_points", -1)]))
    
    leaderboard = []
    user_rank = None
    curr_uid = current_user["_id"] if current_user else None

    for idx, u in enumerate(users):
        rank = idx + 1
        uid = u.get("_id")
        level_info = calculate_level_and_progress(u.get("total_points", 0))
        wins = u.get("wins", 0)
        losses = u.get("losses", 0)
        battles = wins + losses
        win_rate = round((wins / max(1, battles)) * 100.0, 1)

        entry = {
            "rank": rank,
            "id": uid,
            "username": u.get("username", "Anonymous"),
            "avatar": u.get("avatar", f"https://api.dicebear.com/7.x/bottts/svg?seed={u.get('username', 'user')}"),
            "level": level_info["level"],
            "rating": u.get("rating", 1000),
            "total_points": u.get("total_points", 0),
            "wins": wins,
            "losses": losses,
            "win_rate": win_rate,
            "is_current_user": (uid == curr_uid)
        }
        leaderboard.append(entry)
        if uid == curr_uid:
            user_rank = entry

    return {
        "timeframe": timeframe,
        "leaderboard": leaderboard[:50],
        "current_user_entry": user_rank
    }

# ==================== 9. PROFILE & SETTINGS ====================

@app.get("/api/profile")
async def get_full_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    user_id = current_user["_id"]
    level_info = calculate_level_and_progress(current_user.get("total_points", 0))
    mastery_info = get_dsa_concept_mastery(user_id)
    user_badges = list(user_badges_collection.find({"user_id": user_id}))
    for b in user_badges:
        b.pop("_id", None)

    return {
        "id": user_id,
        "username": current_user["username"],
        "email": current_user["email"],
        "name": current_user.get("name", current_user["username"]),
        "avatar": current_user.get("avatar"),
        "total_points": current_user.get("total_points", 0),
        "coins": current_user.get("coins", 0),
        "rating": current_user.get("rating", 1000),
        "wins": current_user.get("wins", 0),
        "losses": current_user.get("losses", 0),
        "streak": current_user.get("streak", 0),
        "longest_streak": current_user.get("longest_streak", 0),
        "problems_solved": current_user.get("problems_solved", 0),
        "hard_problems_solved": current_user.get("hard_problems_solved", 0),
        "created_at": current_user.get("created_at"),
        "level_info": level_info,
        "mastery_info": mastery_info,
        "badges": user_badges
    }

@app.put("/api/profile")
async def update_profile(request: ProfileUpdateRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    update_fields = {}
    if request.name is not None:
        update_fields["name"] = request.name
    if request.avatar is not None:
        update_fields["avatar"] = request.avatar
    if request.gemini_api_key is not None:
        update_fields["gemini_api_key"] = request.gemini_api_key

    if update_fields:
        users_collection.update_one({"_id": current_user["_id"]}, {"$set": update_fields})

    updated = users_collection.find_one({"_id": current_user["_id"]})
    return {"message": "Profile updated successfully", "user": updated}

@app.get("/api/profile/badges")
async def get_all_badges_status(current_user: Dict[str, Any] = Depends(get_current_user)):
    user_id = current_user["_id"]
    all_badges = badges_collection.find({})
    user_badge_map = {b["badge_id"]: b for b in user_badges_collection.find({"user_id": user_id})}

    badges_status = []
    for b in all_badges:
        b_id = b["badge_id"]
        is_unlocked = b_id in user_badge_map
        badges_status.append({
            "badge_id": b_id,
            "name": b["name"],
            "description": b["description"],
            "icon": b["icon"],
            "unlocked": is_unlocked,
            "unlocked_at": user_badge_map[b_id].get("unlocked_at") if is_unlocked else None
        })

    return {"badges": badges_status}

# ==================== 10. AI CODE EXPLAINER ====================

@app.post("/api/explainer/explain")
async def explain_code_endpoint(request: CodeExplainerRequest, current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)):
    if not request.code_snippet or len(request.code_snippet.strip()) < 5:
        raise HTTPException(status_code=400, detail="Please provide a valid code snippet")

    user_api_key = current_user.get("gemini_api_key") if current_user else None
    result = ai_service.explain_code(
        code_snippet=request.code_snippet,
        language=request.language or "python",
        user_api_key=user_api_key
    )
    return result

# ==================== 11. WEBSOCKETS ====================

@app.websocket("/ws/matchmaking")
async def ws_matchmaking(websocket: WebSocket, token: Optional[str] = Query(None)):
    await websocket.accept()
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    payload = verify_token(token)
    if not payload:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    user_id = payload.get("sub")
    user = users_collection.find_one({"_id": user_id})
    if not user:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    try:
        while True:
            data = await websocket.receive_json()
            action = data.get("action")

            if action == "join_queue":
                concept = data.get("concept")
                await matchmaking_queue.add_player(
                    user_id=user_id,
                    username=user["username"],
                    avatar=user.get("avatar", ""),
                    rating=user.get("rating", 1000),
                    concept=concept,
                    websocket=websocket
                )

                # Attempt match
                match = await matchmaking_queue.find_match(user_id)
                if match:
                    p1, p2 = match
                    # Create Battle Room
                    room = battle_manager.create_battle(p1, p2)
                    
                    match_payload = {
                        "type": "match_found",
                        "battle_id": room.battle_id,
                        "problem_id": room.problem_id
                    }

                    # Send to player 1
                    try:
                        await p1["websocket"].send_text(json.dumps({
                            **match_payload,
                            "opponent": {
                                "user_id": p2["user_id"],
                                "username": p2["username"],
                                "avatar": p2["avatar"],
                                "rating": p2["rating"]
                            }
                        }))
                    except Exception:
                        pass

                    # Send to player 2
                    try:
                        await p2["websocket"].send_text(json.dumps({
                            **match_payload,
                            "opponent": {
                                "user_id": p1["user_id"],
                                "username": p1["username"],
                                "avatar": p1["avatar"],
                                "rating": p1["rating"]
                            }
                        }))
                    except Exception:
                        pass

                else:
                    await websocket.send_text(json.dumps({
                        "type": "queue_joined",
                        "message": "Searching for an opponent..."
                    }))

            elif action == "leave_queue":
                await matchmaking_queue.remove_player(user_id)
                await websocket.send_text(json.dumps({"type": "queue_left"}))

    except WebSocketDisconnect:
        await matchmaking_queue.remove_player(user_id)
    except Exception as e:
        logger.warning(f"WebSocket Matchmaking Error: {e}")
        await matchmaking_queue.remove_player(user_id)


@app.websocket("/ws/battle/{match_id}")
async def ws_battle_room(websocket: WebSocket, match_id: str, token: Optional[str] = Query(None)):
    await websocket.accept()
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    payload = verify_token(token)
    if not payload:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    user_id = payload.get("sub")
    user = users_collection.find_one({"_id": user_id})
    if not user:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await battle_manager.register_connection(match_id, user_id, websocket)

    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")

            if msg_type == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
            elif msg_type == "submit":
                code = data.get("code", "")
                language = data.get("language", "python")
                await battle_manager.handle_submit(match_id, user_id, code, language)

    except WebSocketDisconnect:
        await battle_manager.unregister_connection(match_id, user_id)
    except Exception as e:
        logger.warning(f"Battle WebSocket Error: {e}")
        await battle_manager.unregister_connection(match_id, user_id)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
