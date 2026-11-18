import os
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt  # PyJWT
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

bearer = HTTPBearer()

def _secret():
    secret = os.getenv("JWT_SECRET")
    if not secret:
        raise RuntimeError("JWT_SECRET is missing from backend/.env")
    return secret


# ---- passwords ----

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode(), password_hash.encode())


# ---- tokens ----
def create_token(user_id: int) -> str:
    payload = {"sub": str(user_id), "exp": datetime.now(timezone.utc) + timedelta(days=7)}
    return jwt.encode(payload, _secret(), algorithm="HS256")


def get_current_user(creds: HTTPAuthorizationCredentials = Depends(bearer)) -> int:
    try:
        payload = jwt.decode(creds.credentials, _secret(), algorithms=["HS256"])
        return int(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid or expired token")
