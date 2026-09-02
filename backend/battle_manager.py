import asyncio
import json
import logging
import random
import time
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List, Set
from fastapi import WebSocket

from database import (
    users_collection,
    battles_collection,
    problems_collection,
    activity_collection
)
from execution_engine import execution_engine
from gamification import calculate_elo_rating, calculate_level_and_progress, check_and_award_badges, XP_REWARDS

logger = logging.getLogger(__name__)

class MatchmakingQueue:
    def __init__(self):
        self._lock = asyncio.Lock()
        self.queue: List[Dict[str, Any]] = []

    async def add_player(self, user_id: str, username: str, avatar: str, rating: int, concept: Optional[str], websocket: WebSocket):
        async with self._lock:
            # Remove if already in queue
            self.queue = [p for p in self.queue if p["user_id"] != user_id]
            player = {
                "user_id": user_id,
                "username": username,
                "avatar": avatar,
                "rating": rating,
                "concept": concept or "all",
                "websocket": websocket,
                "queued_at": time.time()
            }
            self.queue.append(player)
            logger.info(f"Player {username} ({user_id}) joined matchmaking queue. Total in queue: {len(self.queue)}")

    async def remove_player(self, user_id: str):
        async with self._lock:
            self.queue = [p for p in self.queue if p["user_id"] != user_id]

    async def find_match(self, user_id: str) -> Optional[Tuple_Match]:
        async with self._lock:
            current_player = next((p for p in self.queue if p["user_id"] == user_id), None)
            if not current_player:
                return None

            # Find opponent (closest rating, matching concept if specified)
            candidates = [p for p in self.queue if p["user_id"] != user_id]
            if not candidates:
                return None

            # Sort by rating difference
            candidates.sort(key=lambda p: abs(p["rating"] - current_player["rating"]))
            matched_opponent = candidates[0]

            # Remove both from queue
            self.queue = [p for p in self.queue if p["user_id"] not in (user_id, matched_opponent["user_id"])]

            return current_player, matched_opponent

Tuple_Match = Any

matchmaking_queue = MatchmakingQueue()

class BattleRoom:
    def __init__(self, battle_id: str, p1_data: Dict[str, Any], p2_data: Dict[str, Any], problem_id: str, duration_seconds: int = 1800):
        self.battle_id = battle_id
        self.problem_id = problem_id
        self.duration_seconds = duration_seconds
        self.start_time = time.time()
        self.status = "active"  # active, completed, timeout
        self.winner_id: Optional[str] = None
        self.loser_id: Optional[str] = None
        self.is_draw = False
        self.bot_tasks: List[asyncio.Task] = []

        self.players = {
            p1_data["user_id"]: {
                **p1_data,
                "connected": False,
                "passed_test_cases": 0,
                "total_test_cases": 0,
                "solved": False,
                "solved_time": None
            },
            p2_data["user_id"]: {
                **p2_data,
                "connected": False,
                "passed_test_cases": 0,
                "total_test_cases": 0,
                "solved": False,
                "solved_time": None
            }
        }
        self.connections: Dict[str, WebSocket] = {}

    def get_remaining_time(self) -> int:
        elapsed = int(time.time() - self.start_time)
        return max(0, self.duration_seconds - elapsed)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "battle_id": self.battle_id,
            "problem_id": self.problem_id,
            "status": self.status,
            "start_time": self.start_time,
            "duration_seconds": self.duration_seconds,
            "remaining_seconds": self.get_remaining_time(),
            "winner_id": self.winner_id,
            "is_draw": self.is_draw,
            "players": {
                uid: {
                    "user_id": p["user_id"],
                    "username": p["username"],
                    "avatar": p.get("avatar"),
                    "rating": p.get("rating", 1000),
                    "connected": p["connected"],
                    "passed_test_cases": p["passed_test_cases"],
                    "total_test_cases": p["total_test_cases"],
                    "progress_percentage": round((p["passed_test_cases"] / max(1, p["total_test_cases"])) * 100.0, 1) if p["total_test_cases"] > 0 else 0.0
                }
                for uid, p in self.players.items()
            }
        }


class BattleManager:
    def __init__(self):
        self.rooms: Dict[str, BattleRoom] = {}
        self._lock = asyncio.Lock()

    def create_battle(
        self,
        p1: Dict[str, Any],
        p2: Dict[str, Any],
        problem_id: Optional[str] = None
    ) -> BattleRoom:
        battle_id = str(uuid.uuid4())
        
        # If problem_id not provided, pick random problem
        if not problem_id:
            all_problems = list(problems_collection.find({}))
            if all_problems:
                problem_id = random.choice(all_problems).get("problem_id")
            else:
                problem_id = "two-sum"

        room = BattleRoom(battle_id, p1, p2, problem_id)
        self.rooms[battle_id] = room

        # Persist to database
        now_iso = datetime.now(timezone.utc).isoformat()
        battles_collection.insert_one({
            "battle_id": battle_id,
            "problem_id": problem_id,
            "start_time": now_iso,
            "duration_seconds": 1800,
            "status": "active",
            "player1_id": p1["user_id"],
            "player2_id": p2["user_id"],
            "player1_username": p1["username"],
            "player2_username": p2["username"],
            "winner_id": None
        })

        # Start bot background simulation if any participant is a bot
        for uid, pdata in [ (p1["user_id"], p1), (p2["user_id"], p2) ]:
            if self._is_bot_player(uid):
                bot_task = asyncio.create_task(self._simulate_bot(room, uid))
                room.bot_tasks.append(bot_task)

        return room

    def _is_bot_player(self, user_id: str) -> bool:
        if not user_id:
            return False
        return str(user_id).startswith("bot_") or user_id in ("bot_arena_ai", "Nexus_AI_Bot", "opponent")

    async def _simulate_bot(self, room: BattleRoom, bot_id: str):
        """
        Simulates realistic coding duel behavior for AI bots:
        Progressively solves test cases with realistic delay intervals.
        """
        try:
            # Initial thinking and coding startup delay
            await asyncio.sleep(random.uniform(4.0, 7.0))
            if room.status != "active":
                return

            problem = problems_collection.find_one({"problem_id": room.problem_id}) or {}
            test_cases = problem.get("testCases", [])
            total_cases = len(test_cases) if test_cases else 4
            
            bot_rating = room.players.get(bot_id, {}).get("rating", 1000)

            for step in range(1, total_cases + 1):
                # Calculate interval per test case based on bot rating
                base_delay = 8.0 if bot_rating >= 1100 else 12.0
                delay = random.uniform(base_delay - 2.0, base_delay + 5.0)
                await asyncio.sleep(delay)

                if room.status != "active":
                    break

                # Update bot player progress
                if bot_id in room.players:
                    room.players[bot_id]["passed_test_cases"] = step
                    room.players[bot_id]["total_test_cases"] = total_cases
                    room.players[bot_id]["connected"] = True

                pct = round((step / max(1, total_cases)) * 100.0, 1)

                # Broadcast live opponent progress
                await self.broadcast(room.battle_id, {
                    "type": "opponent_progress",
                    "user_id": bot_id,
                    "passed_test_cases": step,
                    "total_test_cases": total_cases,
                    "progress_percentage": pct
                })

                # If all test cases solved by bot and match is still active
                if step == total_cases and room.status == "active":
                    await asyncio.sleep(1.0)
                    if room.status == "active":
                        await self.finish_battle(room.battle_id, winner_id=bot_id, reason="solved")
                    break

        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.warning(f"Error in bot simulation for battle {room.battle_id}: {e}")

    def get_room(self, battle_id: str) -> Optional[BattleRoom]:
        if battle_id in self.rooms:
            return self.rooms[battle_id]
        
        # Attempt to reconstruct from DB if server restarted
        db_battle = battles_collection.find_one({"battle_id": battle_id})
        if db_battle and db_battle.get("status") == "active":
            p1_id = db_battle.get("player1_id")
            p2_id = db_battle.get("player2_id")
            u1 = users_collection.find_one({"_id": p1_id}) or {"_id": p1_id, "username": "Player 1", "rating": 1000}
            u2 = users_collection.find_one({"_id": p2_id}) or {"_id": p2_id, "username": "Player 2", "rating": 1000}
            
            p1_data = {"user_id": u1["_id"], "username": u1["username"], "rating": u1.get("rating", 1000), "avatar": u1.get("avatar")}
            p2_data = {"user_id": u2["_id"], "username": u2["username"], "rating": u2.get("rating", 1000), "avatar": u2.get("avatar")}
            
            room = BattleRoom(battle_id, p1_data, p2_data, db_battle.get("problem_id", "two-sum"))
            self.rooms[battle_id] = room
            return room
        return None

    async def register_connection(self, battle_id: str, user_id: str, websocket: WebSocket):
        room = self.get_room(battle_id)
        if not room:
            return
        
        room.connections[user_id] = websocket
        if user_id in room.players:
            room.players[user_id]["connected"] = True

        # Broadcast state update to both players
        await self.broadcast(battle_id, {
            "type": "player_connected",
            "user_id": user_id,
            "battle": room.to_dict()
        })

    async def unregister_connection(self, battle_id: str, user_id: str):
        room = self.get_room(battle_id)
        if not room:
            return
        
        if user_id in room.connections:
            del room.connections[user_id]
        if user_id in room.players:
            room.players[user_id]["connected"] = False

        # Broadcast state update
        await self.broadcast(battle_id, {
            "type": "player_disconnected",
            "user_id": user_id,
            "battle": room.to_dict()
        })

    async def broadcast(self, battle_id: str, message: Dict[str, Any]):
        room = self.get_room(battle_id)
        if not room:
            return
        
        text = json.dumps(message)
        dead_connections = []
        for uid, ws in room.connections.items():
            try:
                await ws.send_text(text)
            except Exception as e:
                logger.warning(f"Error sending message to {uid} in battle {battle_id}: {e}")
                dead_connections.append(uid)

        for uid in dead_connections:
            if uid in room.connections:
                del room.connections[uid]

    async def handle_submit(
        self,
        battle_id: str,
        user_id: str,
        code: str,
        language: str
    ) -> Dict[str, Any]:
        room = self.get_room(battle_id)
        if not room or room.status != "active":
            return {"success": False, "message": "Battle is not active"}

        # Get problem test cases
        problem = problems_collection.find_one({"problem_id": room.problem_id})
        if not problem:
            return {"success": False, "message": "Problem not found"}

        test_cases = problem.get("testCases", [])
        exec_result = execution_engine.execute(
            language=language,
            code=code,
            test_cases=test_cases,
            entry_point=problem.get("entry_point")
        )

        passed = exec_result.get("passed_test_cases", 0)
        total = exec_result.get("total_test_cases", len(test_cases))
        all_passed = exec_result.get("success", False)

        # Update player progress in room
        if user_id in room.players:
            room.players[user_id]["passed_test_cases"] = passed
            room.players[user_id]["total_test_cases"] = total

        # Broadcast opponent progress without showing code
        await self.broadcast(battle_id, {
            "type": "opponent_progress",
            "user_id": user_id,
            "passed_test_cases": passed,
            "total_test_cases": total,
            "progress_percentage": round((passed / max(1, total)) * 100.0, 1)
        })

        if all_passed:
            # Winner found!
            await self.finish_battle(battle_id, winner_id=user_id, reason="solved")

        return {
            "success": all_passed,
            "execution": exec_result,
            "battle_finished": room.status != "active"
        }

    async def finish_battle(
        self,
        battle_id: str,
        winner_id: Optional[str] = None,
        reason: str = "solved"
    ):
        room = self.get_room(battle_id)
        if not room or room.status != "active":
            return

        room.status = "completed" if winner_id else "timeout"
        room.winner_id = winner_id

        # Cancel any running bot simulation tasks
        for task in room.bot_tasks:
            if not task.done():
                task.cancel()

        player_ids = list(room.players.keys())
        if len(player_ids) < 2:
            return

        p1_id, p2_id = player_ids[0], player_ids[1]
        u1 = users_collection.find_one({"_id": p1_id}) or {}
        u2 = users_collection.find_one({"_id": p2_id}) or {}

        r1 = u1.get("rating", 1000)
        r2 = u2.get("rating", 1000)

        if winner_id == p1_id:
            score1 = 1.0
            loser_id = p2_id
        elif winner_id == p2_id:
            score1 = 0.0
            loser_id = p1_id
        else:
            # Tie / Draw
            score1 = 0.5
            loser_id = None
            room.is_draw = True

        new_r1, new_r2, delta1, delta2 = calculate_elo_rating(r1, r2, score1)

        # Update User 1 stats
        xp1_gain = (XP_REWARDS["battle_win"] + XP_REWARDS["battle_participation"]) if winner_id == p1_id else (XP_REWARDS["battle_participation"])
        coins1_gain = XP_REWARDS["coins_battle_win"] if winner_id == p1_id else 5
        users_collection.update_one(
            {"_id": p1_id},
            {
                "$set": {"rating": new_r1},
                "$inc": {
                    "total_points": xp1_gain,
                    "coins": coins1_gain,
                    "wins": 1 if winner_id == p1_id else 0,
                    "losses": 1 if winner_id == p2_id else 0,
                    "battles_count": 1
                }
            }
        )

        # Update User 2 stats
        xp2_gain = (XP_REWARDS["battle_win"] + XP_REWARDS["battle_participation"]) if winner_id == p2_id else (XP_REWARDS["battle_participation"])
        coins2_gain = XP_REWARDS["coins_battle_win"] if winner_id == p2_id else 5
        users_collection.update_one(
            {"_id": p2_id},
            {
                "$set": {"rating": new_r2},
                "$inc": {
                    "total_points": xp2_gain,
                    "coins": coins2_gain,
                    "wins": 1 if winner_id == p2_id else 0,
                    "losses": 1 if winner_id == p1_id else 0,
                    "battles_count": 1
                }
            }
        )

        # Check badges for both users
        check_and_award_badges(p1_id)
        check_and_award_badges(p2_id)

        # Update DB battle doc
        now_iso = datetime.now(timezone.utc).isoformat()
        battles_collection.update_one(
            {"battle_id": battle_id},
            {"$set": {
                "status": room.status,
                "winner_id": winner_id,
                "end_time": now_iso,
                "reason": reason,
                "rating_delta": {p1_id: delta1, p2_id: delta2},
                "new_ratings": {p1_id: new_r1, p2_id: new_r2},
                "xp_awarded": {p1_id: xp1_gain, p2_id: xp2_gain}
            }}
        )

        # Record activity
        for uid, uname, is_win, delta_r, xp_g in [
            (p1_id, u1.get("username", "Player 1"), winner_id == p1_id, delta1, xp1_gain),
            (p2_id, u2.get("username", "Player 2"), winner_id == p2_id, delta2, xp2_gain)
        ]:
            activity_collection.insert_one({
                "user_id": uid,
                "type": "battle_completed",
                "title": f"Battle {'Victory' if is_win else 'Draw' if room.is_draw else 'Defeat'}",
                "description": f"Rating change: {delta_r:+d}, XP: +{xp_g}",
                "battle_id": battle_id,
                "created_at": now_iso
            })

        # Broadcast finish event to both players
        await self.broadcast(battle_id, {
            "type": "battle_finished",
            "winner_id": winner_id,
            "is_draw": room.is_draw,
            "reason": reason,
            "results": {
                p1_id: {
                    "username": u1.get("username", "Player 1"),
                    "rating_before": r1,
                    "rating_after": new_r1,
                    "delta": delta1,
                    "xp_gained": xp1_gain,
                    "coins_gained": coins1_gain,
                    "is_winner": winner_id == p1_id
                },
                p2_id: {
                    "username": u2.get("username", "Player 2"),
                    "rating_before": r2,
                    "rating_after": new_r2,
                    "delta": delta2,
                    "xp_gained": xp2_gain,
                    "coins_gained": coins2_gain,
                    "is_winner": winner_id == p2_id
                }
            }
        })

battle_manager = BattleManager()
