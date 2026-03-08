"""
MedAI Backend — FastAPI + LangChain + LangGraph + RAG + OpenAI
Complete healthcare AI backend with:
- OpenAI GPT-4o powered medical chat
- LangChain for structured medical analysis
- LangGraph for multi-step reasoning workflows
- RAG with FAISS for PDF medical report analysis
- PDF upload and parsing
- User auth (signup/login/logout) with JWT
- Search & chat logging to SQLite
- Admin dashboard API for user/session/search stats
"""

from fastapi import FastAPI, UploadFile, File, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from contextlib import asynccontextmanager
import os
import json
import time

from dotenv import load_dotenv
load_dotenv()

from rag_engine import RAGEngine
from medical_agent import MedicalAgent
import database as db
import auth

# Initialize database on startup
db.init_db()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create default admin if no users exist
    if db.get_user_count() == 0:
        pw_hash = auth.hash_password("admin123")
        db.create_user(email="admin@medai.com", name="MedAI Admin", password_hash=pw_hash, role="admin")
        print("🔑 Default admin created: admin@medai.com / admin123")
    yield
    # Shutdown: nothing to clean up

app = FastAPI(title="MedAI Healthcare API", version="3.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global instances — initialized lazily per API key
_agents: dict[str, MedicalAgent] = {}
_rag_engines: dict[str, RAGEngine] = {}


def get_api_key(api_key: Optional[str] = None) -> str:
    """Get the OpenAI API key — use the provided key, or fall back to server .env key."""
    key = api_key or os.getenv("OPENAI_API_KEY", "")
    if not key or key.strip() == "" or key == "your-openai-api-key-here":
        raise HTTPException(
            status_code=400,
            detail="OpenAI API key not configured. Set OPENAI_API_KEY in server/.env or add your key in Settings.",
        )
    return key.strip()


def get_agent(api_key: str) -> MedicalAgent:
    if api_key not in _agents:
        _agents[api_key] = MedicalAgent(api_key)
    return _agents[api_key]


def get_rag(api_key: str) -> RAGEngine:
    if api_key not in _rag_engines:
        _rag_engines[api_key] = RAGEngine(api_key)
    return _rag_engines[api_key]


# --- Request / Response models ---

class ChatRequest(BaseModel):
    message: str
    api_key: Optional[str] = None
    conversation_history: list[dict] = []
    location: Optional[str] = None

class ChatResponse(BaseModel):
    reply: str
    analysis: Optional[dict] = None
    sources: list[str] = []

class AnalyzeReportRequest(BaseModel):
    api_key: Optional[str] = None

class APIKeyRequest(BaseModel):
    api_key: str

class PreferencesRequest(BaseModel):
    preferences: dict

class VitalsRequest(BaseModel):
    heart_rate: Optional[float] = None
    blood_pressure_sys: Optional[float] = None
    blood_pressure_dia: Optional[float] = None
    temperature: Optional[float] = None
    spo2: Optional[float] = None
    blood_sugar: Optional[float] = None
    weight: Optional[float] = None
    notes: Optional[str] = None


# =====================================================
# AUTH ENDPOINTS
# =====================================================

@app.post("/api/auth/signup")
async def signup(req: auth.SignupRequest):
    """Register a new user account."""
    return auth.signup(req)


@app.post("/api/auth/login")
async def login(req: auth.LoginRequest, request: Request):
    """Log in and get a JWT token."""
    ip = request.client.host if request.client else None
    ua = request.headers.get("user-agent")
    return auth.login(req, ip_address=ip, user_agent=ua)


@app.post("/api/auth/logout")
async def logout(user: dict = Depends(auth.require_auth)):
    """Log out the current user (deactivate session)."""
    return auth.logout(user["token"])


@app.get("/api/auth/me")
async def get_me(user: dict = Depends(auth.require_auth)):
    """Get the currently authenticated user's info."""
    return {"id": user["id"], "email": user["email"], "name": user["name"], "role": user["role"]}


# =====================================================
# CORE ENDPOINTS
# =====================================================

@app.get("/")
async def root():
    return {"status": "ok", "service": "MedAI Healthcare API v3.0"}


@app.post("/api/validate-key")
async def validate_key(req: APIKeyRequest):
    """Validate an OpenAI API key."""
    try:
        from openai import OpenAI
        client = OpenAI(api_key=req.api_key)
        client.models.list()
        return {"valid": True}
    except Exception as e:
        return {"valid": False, "error": str(e)}


@app.post("/api/chat", response_model=ChatResponse)
async def chat(req: ChatRequest, user: dict | None = Depends(auth.get_current_user)):
    """Main chat endpoint — uses LangGraph medical agent. Logs queries to database."""
    api_key = get_api_key(req.api_key)
    agent = get_agent(api_key)
    rag = get_rag(api_key)

    start_time = time.time()
    user_id = user["id"] if user else None

    # Log the user message to chat history
    db.log_chat_message(user_id=user_id, role="user", content=req.message)

    # Check if RAG has documents and retrieve context
    rag_context = ""
    sources: list[str] = []
    if rag.has_documents():
        results = rag.query(req.message)
        if results:
            rag_context = "\n\n".join([doc.page_content for doc in results])
            sources = list(set([doc.metadata.get("source", "uploaded document") for doc in results]))

    # Run the LangGraph medical agent
    result = await agent.run(
        message=req.message,
        conversation_history=req.conversation_history,
        rag_context=rag_context,
        location=req.location or "",
    )

    elapsed_ms = int((time.time() - start_time) * 1000)

    # Log the AI response to chat history
    analysis_json = json.dumps(result.get("analysis")) if result.get("analysis") else None
    db.log_chat_message(user_id=user_id, role="assistant", content=result["reply"], analysis_json=analysis_json)

    # Log the search/query
    risk_level = result.get("analysis", {}).get("riskLevel") if result.get("analysis") else None
    db.log_search(
        user_id=user_id,
        query=req.message,
        response_preview=result["reply"][:200],
        sources=", ".join(sources) if sources else None,
        risk_level=risk_level,
        duration_ms=elapsed_ms,
    )

    return ChatResponse(
        reply=result["reply"],
        analysis=result.get("analysis"),
        sources=sources,
    )


@app.post("/api/upload-report")
async def upload_report(
    file: UploadFile = File(...),
    api_key: Optional[str] = None,
    user: dict | None = Depends(auth.get_current_user),
):
    """Upload a PDF medical report for RAG indexing and analysis."""
    key = get_api_key(api_key)

    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Max 10MB.")

    rag = get_rag(key)
    num_chunks = rag.ingest_pdf(contents, file.filename)

    # Log the upload
    user_id = user["id"] if user else None
    db.log_report_upload(user_id=user_id, filename=file.filename, chunks_indexed=num_chunks)

    # Also run analysis on the report
    agent = get_agent(key)
    report_text = rag.get_last_ingested_text()
    analysis = await agent.analyze_report(report_text)

    return {
        "message": f"Report '{file.filename}' processed successfully.",
        "chunks_indexed": num_chunks,
        "analysis": analysis,
    }


@app.post("/api/analyze-symptoms")
async def analyze_symptoms(req: ChatRequest, user: dict | None = Depends(auth.get_current_user)):
    """Dedicated symptom analysis endpoint with structured output."""
    api_key = get_api_key(req.api_key)
    agent = get_agent(api_key)

    user_id = user["id"] if user else None
    db.log_search(user_id=user_id, query=f"[Symptom Analysis] {req.message}", response_preview="Symptom analysis requested")

    result = await agent.analyze_symptoms(req.message)
    return result


@app.get("/api/health-summary")
async def health_summary(api_key: Optional[str] = None):
    """Get an AI-generated health summary based on uploaded reports."""
    key = get_api_key(api_key)
    rag = get_rag(key)

    if not rag.has_documents():
        return {
            "summary": "No medical reports uploaded yet. Upload a report to get your AI-powered health summary.",
            "score": None,
        }

    agent = get_agent(key)
    all_text = rag.get_all_text()
    summary = await agent.generate_health_summary(all_text)
    return summary


# =====================================================
# USER ENDPOINTS (authenticated)
# =====================================================

@app.get("/api/user/chat-history")
async def user_chat_history(user: dict = Depends(auth.require_auth), limit: int = 50):
    """Get the authenticated user's chat history."""
    return db.get_chat_history(user_id=user["id"], limit=limit)


@app.get("/api/user/search-logs")
async def user_search_logs(user: dict = Depends(auth.require_auth), limit: int = 50):
    """Get the authenticated user's search logs."""
    return db.get_search_logs(user_id=user["id"], limit=limit)


@app.get("/api/user/reports")
async def user_reports(user: dict = Depends(auth.require_auth), limit: int = 50):
    """Get the authenticated user's uploaded reports."""
    return db.get_report_uploads(user_id=user["id"], limit=limit)


@app.get("/api/user/sessions")
async def user_sessions(user: dict = Depends(auth.require_auth)):
    """Get the authenticated user's active sessions."""
    return db.get_active_sessions(user_id=user["id"])


# =====================================================
# USER PREFERENCES ENDPOINTS
# =====================================================

@app.get("/api/user/preferences")
async def get_preferences(user: dict = Depends(auth.require_auth)):
    """Get the authenticated user's preferences."""
    return db.get_user_preferences(user["id"])


@app.put("/api/user/preferences")
async def save_preferences(req: PreferencesRequest, user: dict = Depends(auth.require_auth)):
    """Save (replace) the authenticated user's preferences."""
    return db.save_user_preferences(user["id"], req.preferences)


# =====================================================
# VITALS ENDPOINTS
# =====================================================

@app.post("/api/user/vitals")
async def add_vitals(req: VitalsRequest, user: dict = Depends(auth.require_auth)):
    """Log a new vitals entry for the authenticated user."""
    return db.log_vitals(
        user_id=user["id"],
        heart_rate=req.heart_rate,
        blood_pressure_sys=req.blood_pressure_sys,
        blood_pressure_dia=req.blood_pressure_dia,
        temperature=req.temperature,
        spo2=req.spo2,
        blood_sugar=req.blood_sugar,
        weight=req.weight,
        notes=req.notes,
    )


@app.get("/api/user/vitals")
async def get_vitals(user: dict = Depends(auth.require_auth), limit: int = 50):
    """Get the authenticated user's vitals history."""
    return db.get_vitals(user_id=user["id"], limit=limit)


@app.get("/api/user/vitals/latest")
async def get_latest_vitals(user: dict = Depends(auth.require_auth)):
    """Get the authenticated user's latest vitals entry."""
    v = db.get_latest_vitals(user_id=user["id"])
    return v or {}


# =====================================================
# ADMIN ENDPOINTS (admin role required)
# =====================================================

@app.get("/api/admin/overview")
async def admin_overview(admin: dict = Depends(auth.require_admin)):
    """Get the full admin dashboard overview — stats, recent users, recent searches."""
    return db.get_admin_overview()


@app.get("/api/admin/users")
async def admin_users(admin: dict = Depends(auth.require_admin)):
    """Get all registered users."""
    return db.get_all_users()


@app.get("/api/admin/sessions")
async def admin_sessions(admin: dict = Depends(auth.require_admin), limit: int = 100):
    """Get all sessions (active and inactive)."""
    return db.get_all_sessions(limit=limit)


@app.get("/api/admin/search-logs")
async def admin_search_logs(admin: dict = Depends(auth.require_admin), limit: int = 100):
    """Get all search/query logs."""
    return db.get_search_logs(limit=limit)


@app.get("/api/admin/search-stats")
async def admin_search_stats(admin: dict = Depends(auth.require_admin)):
    """Get aggregated search statistics."""
    return db.get_search_stats()


@app.get("/api/admin/chat-history")
async def admin_chat_history(admin: dict = Depends(auth.require_admin), limit: int = 100):
    """Get all chat messages."""
    return db.get_chat_history(limit=limit)


@app.get("/api/admin/reports")
async def admin_reports(admin: dict = Depends(auth.require_admin), limit: int = 100):
    """Get all report uploads."""
    return db.get_report_uploads(limit=limit)


@app.post("/api/admin/create-admin")
async def create_admin_user(req: auth.SignupRequest, admin: dict = Depends(auth.require_admin)):
    """Create a new admin user (only existing admins can do this)."""
    existing = db.get_user_by_email(req.email)
    if existing:
        raise HTTPException(status_code=409, detail="User already exists.")
    pw_hash = auth.hash_password(req.password)
    user = db.create_user(email=req.email, name=req.name, password_hash=pw_hash, role="admin")
    return user


class CreateUserRequest(BaseModel):
    email: str
    name: str
    password: str
    role: str = "user"


@app.post("/api/admin/create-user")
async def admin_create_user(req: CreateUserRequest, admin: dict = Depends(auth.require_admin)):
    """Create a new user (admin only)."""
    existing = db.get_user_by_email(req.email)
    if existing:
        raise HTTPException(status_code=409, detail="User already exists with this email.")
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")
    pw_hash = auth.hash_password(req.password)
    role = req.role if req.role in ("user", "admin") else "user"
    user = db.create_user(email=req.email, name=req.name, password_hash=pw_hash, role=role)
    return user


@app.delete("/api/admin/users/{user_id}")
async def admin_delete_user(user_id: str, admin: dict = Depends(auth.require_admin)):
    """Delete a user (admin only). Cannot delete yourself."""
    if user_id == admin["id"]:
        raise HTTPException(status_code=400, detail="You cannot delete your own admin account.")
    user = db.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    db.delete_user(user_id)
    return {"message": f"User '{user['name']}' deleted successfully."}


@app.patch("/api/admin/users/{user_id}/role")
async def admin_update_role(user_id: str, admin: dict = Depends(auth.require_admin)):
    """Toggle a user's role between 'user' and 'admin'."""
    if user_id == admin["id"]:
        raise HTTPException(status_code=400, detail="You cannot change your own role.")
    user = db.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    new_role = "admin" if user["role"] == "user" else "user"
    db.update_user_role(user_id, new_role)
    return {"message": f"User role changed to '{new_role}'.", "role": new_role}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
