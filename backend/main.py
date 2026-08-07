from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers.ai_chat import router as ai_chat_router
from routers.appointments import router as appointments_router
from routers.health_assessment import router as health_assessment_router
from routers.health_roadmap import router as health_roadmap_router
from routers.medical_cost_intelligence import router as medical_cost_intelligence_router
from routers.smart_care_navigator import router as smart_care_navigator_router
from routers.treatment_affordability_score import router as treatment_affordability_score_router

app = FastAPI(title="CareLedger AI Backend")

load_dotenv(Path(__file__).resolve().parents[1] / '.env')

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://localhost:5177",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
        "http://127.0.0.1:5176",
        "http://127.0.0.1:5177",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_assessment_router)
app.include_router(smart_care_navigator_router)
app.include_router(medical_cost_intelligence_router)
app.include_router(treatment_affordability_score_router)
app.include_router(appointments_router)
app.include_router(ai_chat_router)
app.include_router(health_roadmap_router)


@app.get("/")
def root() -> dict:
    return {"service": "CareLedger AI backend", "status": "ok"}
