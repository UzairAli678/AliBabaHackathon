import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Load repository-level configuration before importing routers or services.
load_dotenv(Path(__file__).resolve().parents[1] / ".env")

from routers.ai_chat import router as ai_chat_router
from routers.appointments import router as appointments_router
from routers.health_assessment import router as health_assessment_router
from routers.health_roadmap import router as health_roadmap_router
from routers.medical_cost_intelligence import router as medical_cost_intelligence_router
from routers.smart_care_navigator import router as smart_care_navigator_router

app = FastAPI(title="CareLedger AI Backend")

LOCAL_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]


def get_allowed_origins() -> list[str]:
    configured_origins = os.getenv("ALLOWED_ORIGINS", "")
    origins = [origin.strip().rstrip("/") for origin in configured_origins.split(",") if origin.strip()]
    return origins or LOCAL_ALLOWED_ORIGINS

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_assessment_router)
app.include_router(smart_care_navigator_router)
app.include_router(medical_cost_intelligence_router)
app.include_router(appointments_router)
app.include_router(ai_chat_router)
app.include_router(health_roadmap_router)


@app.get("/")
def root() -> dict:
    return {"service": "CareLedger AI backend", "status": "ok"}
