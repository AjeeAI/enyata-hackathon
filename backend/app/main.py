from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import engine, Base

# Import routers
from app.api.routes_chat import router as chat_router
from app.api.routes_admin import router as admin_router
from app.api.routes_webhook import router as webhook_router

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="EduIntellect API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Update to specific origins for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "healthy"}

# Include Routers
app.include_router(chat_router, prefix="/api/chat", tags=["Chat"])
app.include_router(admin_router, prefix="/api/admin", tags=["Admin"])
app.include_router(webhook_router, prefix="/api/webhooks", tags=["Webhooks"])