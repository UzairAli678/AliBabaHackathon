from fastapi import APIRouter

router = APIRouter(prefix="/ai-chat", tags=["ai-chat"])


@router.get("")
def get_ai_chat() -> dict:
    return {
        "reply": "Based on your symptoms, please stay hydrated and track your temperature.",
        "next_step": "Seek urgent care if fever exceeds 102°F for more than 24 hours.",
    }
