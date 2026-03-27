from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import engine, Base

# Import all routers
from app.api.routes_chat import router as chat_router
from app.api.routes_admin import router as admin_router
from app.api.routes_webhook import router as webhook_router
from app.api.routes_auth import router as auth_router # New auth router

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="EduIntellect API")

# --- CORS MIDDLEWARE ---

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    """Simple status check for the API."""
    return {"status": "healthy"}

# --- INCLUDE ROUTERS ---

# 1. Authentication: Login and Signup
app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])

# 2. Chat: AI Orchestrator and Parent Interaction
app.include_router(chat_router, prefix="/api/chat", tags=["Chat"])

# 3. Admin: Student Management, Knowledge Base, and Settings
app.include_router(admin_router, prefix="/api/admin", tags=["Admin"])

# 4. Webhooks: Interswitch Payment Notifications
app.include_router(webhook_router, prefix="/api/webhooks", tags=["Webhooks"])