import os
import re
from datetime import datetime, timezone, timedelta
from typing import Optional, Tuple
from jose import JWTError, jwt
import bcrypt
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "codeclash-super-secret-key-2026-production-ready-jwt")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "10080"))  # 7 days

RESERVED_USERNAMES = {
    "admin", "administrator", "root", "system", "moderator", "mod", 
    "codeclash", "support", "help", "bot", "null", "undefined", "anonymous"
}

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")
USERNAME_REGEX = re.compile(r"^[a-zA-Z0-9_]{3,20}$")

def validate_signup_credentials(username: str, email: str, password: str) -> Tuple[bool, Optional[str]]:
    """Validate username, email, and password strength against strict security rules"""
    # 1. Validate Username
    clean_username = username.strip()
    if not clean_username:
        return False, "Username is required."
    if len(clean_username) < 3 or len(clean_username) > 20:
        return False, "Username must be between 3 and 20 characters."
    if not USERNAME_REGEX.match(clean_username):
        return False, "Username can only contain letters, numbers, and underscores (_)."
    if clean_username.lower() in RESERVED_USERNAMES:
        return False, f"Username '{clean_username}' is reserved. Please choose another."

    # 2. Validate Email
    clean_email = email.strip().lower()
    if not clean_email or not EMAIL_REGEX.match(clean_email):
        return False, "Please enter a valid email address."

    # 3. Validate Password Complexity
    if len(password) < 8:
        return False, "Password must be at least 8 characters long."
    if len(password) > 72:
        return False, "Password cannot exceed 72 characters."
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter (A-Z)."
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter (a-z)."
    if not re.search(r"[0-9]", password):
        return False, "Password must contain at least one number (0-9)."
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>_\-+=\[\]\\/`~]", password):
        return False, "Password must contain at least one special character (!@#$%^&*...)."

    return True, None

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its bcrypt hash"""
    try:
        return bcrypt.checkpw(plain_password[:72].encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt with salt"""
    pwd_bytes = password[:72].encode("utf-8")
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token with standard claims"""
    to_encode = data.copy()
    now_utc = datetime.now(timezone.utc)
    if expires_delta:
        expire = now_utc + expires_delta
    else:
        expire = now_utc + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({
        "iat": int(now_utc.timestamp()),
        "exp": int(expire.timestamp())
    })
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[dict]:
    """Verify and decode a JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None