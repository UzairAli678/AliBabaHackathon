from __future__ import annotations

import os
import re

from google import genai
from google.genai import types
from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix='/ai-chat', tags=['ai-chat'])

SYSTEM_INSTRUCTION = (
    "You are the CareLedger AI assistant, a friendly and knowledgeable guide inside the CareLedger AI healthcare app. "
    "You help patients understand symptoms, medications, lab reports, and general health questions in clear, simple language. "
    "You are supportive and calm, never alarming. You are NOT a doctor and must never provide a definitive diagnosis or prescribe treatment "
    "always recommend consulting a licensed doctor for anything serious, and suggest using the app's Health Assessment or Disease Prediction features "
    "for a more structured evaluation. If a user describes symptoms that sound like a medical emergency (chest pain, difficulty breathing, severe bleeding, "
    "loss of consciousness, stroke symptoms), immediately and clearly tell them to seek emergency care right away or use the app's Emergency Mode, before saying anything else."
)

EMERGENCY_PATTERNS = [
    re.compile(r'\b(chest pain|chest tightness|pressure in chest)\b', re.IGNORECASE),
    re.compile(r'\b(difficulty breathing|shortness of breath|cannot breathe|breathing trouble)\b', re.IGNORECASE),
    re.compile(r'\b(severe bleeding|bleeding heavily|uncontrolled bleeding)\b', re.IGNORECASE),
    re.compile(r'\b(loss of consciousness|passed out|fainted|unconscious)\b', re.IGNORECASE),
    re.compile(r'\b(stroke|slurred speech|face drooping|one-sided weakness|weakness on one side)\b', re.IGNORECASE),
]


class ConversationTurn(BaseModel):
    role: str = Field(..., description='One of: user, assistant, model, system')
    content: str = Field(..., min_length=1)


class ChatMessageRequest(BaseModel):
    message: str = Field(..., min_length=1)
    conversation_history: list[ConversationTurn] = Field(default_factory=list)


class ChatMessageResponse(BaseModel):
    reply: str
    emergency_detected: bool


def detect_emergency(text: str) -> bool:
    return any(pattern.search(text) for pattern in EMERGENCY_PATTERNS)


def build_contents(request: ChatMessageRequest) -> list[types.Content]:
    contents: list[types.Content] = []

    for turn in request.conversation_history:
        cleaned_content = turn.content.strip()
        if not cleaned_content:
            continue

        normalized_role = turn.role.strip().lower()
        if normalized_role == 'system':
            continue

        role = 'model' if normalized_role in {'assistant', 'model'} else 'user'
        contents.append(
            types.Content(
                role=role,
                parts=[types.Part.from_text(text=cleaned_content)],
            )
        )

    contents.append(
        types.Content(
            role='user',
            parts=[types.Part.from_text(text=request.message.strip())],
        )
    )
    return contents


def extract_reply_text(response: object) -> str:
    text = getattr(response, 'text', None)
    if isinstance(text, str) and text.strip():
        return text.strip()

    candidates = getattr(response, 'candidates', None) or []
    for candidate in candidates:
        content = getattr(candidate, 'content', None)
        parts = getattr(content, 'parts', None) or []
        chunk_text = ''.join(getattr(part, 'text', '') for part in parts).strip()
        if chunk_text:
            return chunk_text

    raise RuntimeError('Gemini returned an empty response.')


def build_fallback_reply(emergency_detected: bool) -> str:
    prefix = (
        'Emergency warning: your symptoms may require urgent care. Please seek emergency care right away or use Emergency Mode in the app. '
        if emergency_detected
        else ''
    )
    return (
        f"{prefix}I'm sorry, I can't answer that in full right now. "
        "Please try again shortly, or use Health Assessment or Disease Prediction for a more structured check in the meantime. "
        "If the symptoms feel serious, please consult a licensed doctor."
    )


@router.post('/message', response_model=ChatMessageResponse)
def send_message(request: ChatMessageRequest) -> ChatMessageResponse:
    emergency_detected = detect_emergency(request.message)
    api_key = os.getenv('GEMINI_API_KEY', '').strip()
    if not api_key:
        return ChatMessageResponse(
            reply=build_fallback_reply(emergency_detected),
            emergency_detected=emergency_detected,
        )

    try:
        model_name = os.getenv('GEMINI_MODEL', 'gemini-2.5-flash')
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model=model_name,
            contents=build_contents(request),
            config=types.GenerateContentConfig(system_instruction=SYSTEM_INSTRUCTION),
        )
        reply = extract_reply_text(response)
        return ChatMessageResponse(reply=reply, emergency_detected=emergency_detected)
    except Exception as error:
        return ChatMessageResponse(
            reply=build_fallback_reply(emergency_detected),
            emergency_detected=emergency_detected,
        )
