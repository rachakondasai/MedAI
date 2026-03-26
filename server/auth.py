"""
MedAI Auth — JWT-based authentication for user signup, login, and session management.
Supports email/password AND Google OAuth (ID token verification).
"""

import hashlib
import hmac
import json
import os
from datetime import datetime, timezone, timedelta
from base64 import urlsafe_b64encode, urlsafe_b64decode
from typing import Optional

import httpx
from fastapi import HTTPException, Request, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr

import database as db

# Google OAuth client ID — set GOOGLE_CLIENT_ID in .env
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")

# Secret key for JWT signing — MUST be stable across restarts.
# Set JWT_SECRET in your .env file for production use.
JWT_SECRET = os.getenv("JWT_SECRET", "medai-default-dev-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
TOKEN_EXPIRY_HOURS = 72

security = HTTPBearer(auto_error=False)


# --- Models ---

class SignupRequest(BaseModel):
    email: str
    name: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class GoogleAuthRequest(BaseModel):
    id_token: str
    name: Optional[str] = None  # provided on first-time signup when user sets username

class AuthResponse(BaseModel):
    token: str
    user: dict

class UserInfo(BaseModel):
    id: str
    email: str
    name: str
    role: str


# --- Password Hashing ---

def hash_password(password: str) -> str:
    salt = os.urandom(16).hex()
    hashed = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100000).hex()
    return f"{salt}:{hashed}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        salt, hashed = stored_hash.split(":")
        check = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100000).hex()
        return hmac.compare_digest(hashed, check)
    except Exception:
        return False


# --- Google OAuth ---

async def verify_google_token(id_token: str) -> dict:
    """Verify a Google ID token and return the payload (email, name, sub)."""
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            # Use Google's tokeninfo endpoint for verification
            resp = await client.get(
                "https://oauth2.googleapis.com/tokeninfo",
                params={"id_token": id_token},
            )
            if resp.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid Google token.")
            data = resp.json()
            # Verify audience if GOOGLE_CLIENT_ID is configured
            if GOOGLE_CLIENT_ID and data.get("aud") != GOOGLE_CLIENT_ID:
                raise HTTPException(status_code=401, detail="Google token audience mismatch.")
            if data.get("email_verified") != "true":
                raise HTTPException(status_code=401, detail="Google email not verified.")
            return data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Google token verification failed: {str(e)}")


def google_auth(req_data: dict, ip_address: str = None, user_agent: str = None) -> dict:
    """
    Sign in or sign up with a verified Google payload.
    Returns AuthResponse dict plus 'is_new_user' flag.
    If is_new_user=True and name was not provided, the client should prompt for a username.
    """
    email = req_data["email"]
    google_name = req_data.get("name") or req_data.get("given_name", "") + " " + req_data.get("family_name", "")
    google_name = google_name.strip() or email.split("@")[0]
    provided_name = req_data.get("provided_name")  # name sent from the username-prompt step

    existing = db.get_user_by_email(email)
    is_new_user = existing is None

    if is_new_user:
        # If no name provided yet, tell the client to prompt for a username
        if not provided_name:
            return {
                "needs_username": True,
                "email": email,
                "suggested_name": google_name,
            }
        # Create the user with the provided name
        final_name = provided_name.strip() or google_name
        # Use a random unusable password hash (Google users don't use password login)
        pw_hash = hash_password(os.urandom(32).hex())
        user = db.create_user(email=email, name=final_name, password_hash=pw_hash)
    else:
        user = existing

    # Create JWT
    expiry = datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRY_HOURS)
    token = create_jwt({
        "sub": user["id"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
        "exp": expiry.isoformat(),
    })
    db.create_session(user_id=user["id"], token=token, expires_at=expiry.isoformat(),
                      ip_address=ip_address, user_agent=user_agent)
    db.update_last_login(user["id"])

    return {
        "needs_username": False,
        "is_new_user": is_new_user,
        "token": token,
        "user": {"id": user["id"], "email": user["email"], "name": user["name"], "role": user["role"]},
    }


# --- JWT Token ---

def _b64_encode(data: bytes) -> str:
    return urlsafe_b64encode(data).rstrip(b"=").decode()


def _b64_decode(data: str) -> bytes:
    padding = 4 - len(data) % 4
    if padding != 4:
        data += "=" * padding
    return urlsafe_b64decode(data)


def create_jwt(payload: dict) -> str:
    """Create a simple JWT token (HS256)."""
    header = {"alg": JWT_ALGORITHM, "typ": "JWT"}
    header_b64 = _b64_encode(json.dumps(header).encode())
    payload_b64 = _b64_encode(json.dumps(payload).encode())
    signature_input = f"{header_b64}.{payload_b64}".encode()
    signature = hmac.new(JWT_SECRET.encode(), signature_input, hashlib.sha256).digest()
    sig_b64 = _b64_encode(signature)
    return f"{header_b64}.{payload_b64}.{sig_b64}"


def decode_jwt(token: str) -> dict | None:
    """Decode and verify a JWT token."""
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        header_b64, payload_b64, sig_b64 = parts
        # Verify signature
        signature_input = f"{header_b64}.{payload_b64}".encode()
        expected_sig = hmac.new(JWT_SECRET.encode(), signature_input, hashlib.sha256).digest()
        actual_sig = _b64_decode(sig_b64)
        if not hmac.compare_digest(expected_sig, actual_sig):
            return None
        payload = json.loads(_b64_decode(payload_b64))
        # Check expiry
        if "exp" in payload:
            exp = datetime.fromisoformat(payload["exp"])
            if exp < datetime.now(timezone.utc):
                return None
        return payload
    except Exception:
        return None


# --- Auth Functions ---

def signup(req: SignupRequest) -> AuthResponse:
    """Register a new user."""
    # Check if user already exists
    existing = db.get_user_by_email(req.email)
    if existing:
        raise HTTPException(status_code=409, detail="An account with this email already exists.")

    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")

    pw_hash = hash_password(req.password)
    user = db.create_user(email=req.email, name=req.name, password_hash=pw_hash)

    # Create JWT
    expiry = datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRY_HOURS)
    token = create_jwt({
        "sub": user["id"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
        "exp": expiry.isoformat(),
    })

    # Create session
    db.create_session(user_id=user["id"], token=token, expires_at=expiry.isoformat())
    db.update_last_login(user["id"])

    return AuthResponse(
        token=token,
        user={"id": user["id"], "email": user["email"], "name": user["name"], "role": user["role"]},
    )


def login(req: LoginRequest, ip_address: str = None, user_agent: str = None) -> AuthResponse:
    """Authenticate user and create session."""
    user = db.get_user_by_email(req.email)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    if not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    # Create JWT
    expiry = datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRY_HOURS)
    token = create_jwt({
        "sub": user["id"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
        "exp": expiry.isoformat(),
    })

    # Create session
    db.create_session(
        user_id=user["id"], token=token, expires_at=expiry.isoformat(),
        ip_address=ip_address, user_agent=user_agent,
    )
    db.update_last_login(user["id"])

    return AuthResponse(
        token=token,
        user={"id": user["id"], "email": user["email"], "name": user["name"], "role": user["role"]},
    )


def logout(token: str):
    """Deactivate a session."""
    db.deactivate_session(token)
    return {"message": "Logged out successfully."}


# --- Dependency: get current user from token ---

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict | None:
    """FastAPI dependency that extracts the current user from the Bearer token.
    Returns None if no auth is provided (for public endpoints)."""
    if not credentials:
        return None
    payload = decode_jwt(credentials.credentials)
    if not payload:
        return None
    return {
        "id": payload["sub"],
        "email": payload["email"],
        "name": payload["name"],
        "role": payload.get("role", "user"),
        "token": credentials.credentials,
    }


async def require_auth(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """FastAPI dependency that requires authentication."""
    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication required.")
    payload = decode_jwt(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")
    return {
        "id": payload["sub"],
        "email": payload["email"],
        "name": payload["name"],
        "role": payload.get("role", "user"),
        "token": credentials.credentials,
    }


async def require_admin(user: dict = Depends(require_auth)) -> dict:
    """FastAPI dependency that requires admin role."""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required.")
    return user
