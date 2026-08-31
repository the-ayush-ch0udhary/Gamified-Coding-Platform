import os
import json
import logging
import threading
from typing import Dict, Any, List, Optional
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

MONGO_URL = os.getenv("MONGO_URI") or os.getenv("MONGO_URL", "mongodb://localhost:27017")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "codeclash_db")

class JSONCollection:
    """
    A lightweight, thread-safe, JSON-backed collection implementing common PyMongo methods.
    Ensures zero downtime and complete persistence even when local MongoDB daemon is not running.
    """
    def __init__(self, db_dir: str, name: str):
        self.name = name
        self.file_path = os.path.join(db_dir, f"{name}.json")
        self._lock = threading.RLock()
        self._data: List[Dict[str, Any]] = []
        self._load()

    def _load(self):
        with self._lock:
            if os.path.exists(self.file_path):
                try:
                    with open(self.file_path, "r", encoding="utf-8") as f:
                        self._data = json.load(f)
                except Exception as e:
                    logger.error(f"Error loading {self.file_path}: {e}")
                    self._data = []
            else:
                self._data = []

    def _save(self):
        with self._lock:
            os.makedirs(os.path.dirname(self.file_path), exist_ok=True)
            temp_path = self.file_path + ".tmp"
            with open(temp_path, "w", encoding="utf-8") as f:
                json.dump(self._data, f, indent=2, default=str)
            if os.path.exists(self.file_path):
                os.remove(self.file_path)
            os.rename(temp_path, self.file_path)

    def _matches_filter(self, doc: Dict[str, Any], query: Dict[str, Any]) -> bool:
        if not query:
            return True
        for key, val in query.items():
            if key == "$or":
                sub_matched = any(self._matches_filter(doc, sub_q) for sub_q in val)
                if not sub_matched:
                    return False
                continue
            if key == "$and":
                sub_matched = all(self._matches_filter(doc, sub_q) for sub_q in val)
                if not sub_matched:
                    return False
                continue
            if isinstance(val, dict):
                doc_val = doc.get(key)
                if "$in" in val:
                    if doc_val not in val["$in"]:
                        return False
                if "$nin" in val:
                    if doc_val in val["$nin"]:
                        return False
                if "$gt" in val:
                    if doc_val is None or not (doc_val > val["$gt"]):
                        return False
                if "$gte" in val:
                    if doc_val is None or not (doc_val >= val["$gte"]):
                        return False
                if "$lt" in val:
                    if doc_val is None or not (doc_val < val["$lt"]):
                        return False
                if "$lte" in val:
                    if doc_val is None or not (doc_val <= val["$lte"]):
                        return False
                if "$ne" in val:
                    if doc_val == val["$ne"]:
                        return False
                if "$regex" in val:
                    pattern = val["$regex"]
                    options = val.get("$options", "")
                    import re
                    flags = re.IGNORECASE if "i" in options else 0
                    if not doc_val or not re.search(pattern, str(doc_val), flags):
                        return False
            else:
                if doc.get(key) != val:
                    return False
        return True

    def find_one(self, filter: Optional[Dict[str, Any]] = None, sort: Optional[List] = None) -> Optional[Dict[str, Any]]:
        with self._lock:
            docs = self.find(filter, sort=sort)
            return docs[0].copy() if docs else None

    def find(self, filter: Optional[Dict[str, Any]] = None, sort: Optional[List] = None) -> List[Dict[str, Any]]:
        with self._lock:
            filter = filter or {}
            results = []
            for doc in self._data:
                if self._matches_filter(doc, filter):
                    results.append(doc.copy())
            if sort:
                for field, order in reversed(sort):
                    results.sort(key=lambda d: d.get(field, 0) if d.get(field) is not None else 0, reverse=(order < 0))
            return results

    def insert_one(self, document: Dict[str, Any]):
        with self._lock:
            doc = document.copy()
            if "_id" not in doc:
                import uuid
                doc["_id"] = str(uuid.uuid4())
            self._data.append(doc)
            self._save()
            return type("InsertOneResult", (), {"inserted_id": doc["_id"]})()

    def insert_many(self, documents: List[Dict[str, Any]]):
        with self._lock:
            for d in documents:
                doc = d.copy()
                if "_id" not in doc:
                    import uuid
                    doc["_id"] = str(uuid.uuid4())
                self._data.append(doc)
            self._save()

    def update_one(self, filter: Dict[str, Any], update: Dict[str, Any], upsert: bool = False):
        with self._lock:
            matched_idx = -1
            for idx, doc in enumerate(self._data):
                if self._matches_filter(doc, filter):
                    matched_idx = idx
                    break
            
            if matched_idx >= 0:
                doc = self._data[matched_idx]
                if "$set" in update:
                    doc.update(update["$set"])
                if "$inc" in update:
                    for k, v in update["$inc"].items():
                        doc[k] = doc.get(k, 0) + v
                if "$addToSet" in update:
                    for k, v in update["$addToSet"].items():
                        current_list = doc.get(k, [])
                        if not isinstance(current_list, list):
                            current_list = [current_list]
                        if v not in current_list:
                            current_list.append(v)
                        doc[k] = current_list
                if "$push" in update:
                    for k, v in update["$push"].items():
                        current_list = doc.get(k, [])
                        if not isinstance(current_list, list):
                            current_list = [current_list]
                        current_list.append(v)
                        doc[k] = current_list
                self._save()
                return type("UpdateResult", (), {"matched_count": 1, "modified_count": 1})()
            elif upsert:
                new_doc = filter.copy()
                if "$set" in update:
                    new_doc.update(update["$set"])
                if "$inc" in update:
                    for k, v in update["$inc"].items():
                        new_doc[k] = v
                self.insert_one(new_doc)
                return type("UpdateResult", (), {"matched_count": 0, "modified_count": 1, "upserted_id": new_doc.get("_id")})()
            return type("UpdateResult", (), {"matched_count": 0, "modified_count": 0})()

    def update_many(self, filter: Dict[str, Any], update: Dict[str, Any]):
        with self._lock:
            modified = 0
            for doc in self._data:
                if self._matches_filter(doc, filter):
                    if "$set" in update:
                        doc.update(update["$set"])
                    if "$inc" in update:
                        for k, v in update["$inc"].items():
                            doc[k] = doc.get(k, 0) + v
                    modified += 1
            if modified > 0:
                self._save()
            return type("UpdateResult", (), {"matched_count": modified, "modified_count": modified})()

    def delete_one(self, filter: Dict[str, Any]):
        with self._lock:
            for idx, doc in enumerate(self._data):
                if self._matches_filter(doc, filter):
                    del self._data[idx]
                    self._save()
                    return type("DeleteResult", (), {"deleted_count": 1})()
            return type("DeleteResult", (), {"deleted_count": 0})()

    def delete_many(self, filter: Dict[str, Any]):
        with self._lock:
            initial_len = len(self._data)
            if not filter:
                self._data = []
            else:
                self._data = [doc for doc in self._data if not self._matches_filter(doc, filter)]
            deleted = initial_len - len(self._data)
            if deleted > 0 or not filter:
                self._save()
            return type("DeleteResult", (), {"deleted_count": deleted})()

    def count_documents(self, filter: Dict[str, Any]) -> int:
        with self._lock:
            return len(self.find(filter))

    def create_index(self, key_or_list, **kwargs):
        pass


class DatabaseProvider:
    def __init__(self):
        self.use_mongo = False
        self.db = None
        self.client = None
        self._collections: Dict[str, Any] = {}
        self._init_db()

    def _init_db(self):
        try:
            self.client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=1500)
            self.client.server_info()  # Test connection
            self.db = self.client[MONGO_DB_NAME]
            self.use_mongo = True
            logger.info(f"Connected to MongoDB at {MONGO_URL}")
        except Exception as e:
            logger.warning(f"MongoDB not reachable at {MONGO_URL} ({e}). Using persistent JSON storage fallback.")
            self.use_mongo = False
            base_dir = os.path.join(os.path.dirname(__file__), "data_store")
            os.makedirs(base_dir, exist_ok=True)
            self.base_dir = base_dir

    def get_collection(self, name: str):
        if self.use_mongo and self.db is not None:
            return self.db[name]
        if name not in self._collections:
            self._collections[name] = JSONCollection(self.base_dir, name)
        return self._collections[name]


db_provider = DatabaseProvider()
db = db_provider.db if db_provider.use_mongo else db_provider

# Collections
users_collection = db_provider.get_collection("users")
battles_collection = db_provider.get_collection("battles")
problems_collection = db_provider.get_collection("problems")
dsa_concepts_collection = db_provider.get_collection("dsa_concepts")
dsa_levels_collection = db_provider.get_collection("dsa_levels")
user_concept_progress_collection = db_provider.get_collection("user_concept_progress")
user_level_progress_collection = db_provider.get_collection("user_level_progress")
user_problem_progress_collection = db_provider.get_collection("user_problem_progress")
submissions_collection = db_provider.get_collection("submissions")
daily_challenges_collection = db_provider.get_collection("daily_challenges")
badges_collection = db_provider.get_collection("badges")
user_badges_collection = db_provider.get_collection("user_badges")
activity_collection = db_provider.get_collection("activity")