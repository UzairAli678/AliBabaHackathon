from __future__ import annotations

from functools import lru_cache
from typing import List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, field_validator

from services.prediction_service import PredictionService

router = APIRouter(prefix='/health-assessment', tags=['health-assessment'])


class SymptomPredictionRequest(BaseModel):
    symptoms: List[str] = Field(default_factory=list)
    follow_up_answers: dict[str, str] = Field(default_factory=dict)

    @field_validator('symptoms')
    @classmethod
    def require_two_distinct_symptoms(cls, symptoms: List[str]) -> List[str]:
        cleaned_symptoms = list(dict.fromkeys(symptom.strip() for symptom in symptoms if symptom and symptom.strip()))
        if len(cleaned_symptoms) < 2:
            raise ValueError('Select at least 2 distinct symptoms before requesting a prediction.')
        return cleaned_symptoms


@lru_cache(maxsize=1)
def get_prediction_service() -> PredictionService:
    return PredictionService()


@router.get('')
def get_health_assessment() -> dict:
    return {
        'risk_level': 'moderate',
        'likely_conditions': ['seasonal flu', 'allergic rhinitis'],
        'recommended_action': 'Consult a general physician within 24 hours.',
    }


@router.get('/symptoms-list')
def get_symptoms_list() -> dict:
    service = get_prediction_service()
    return {'symptoms': service.ml_service.symptoms}


@router.post('/predict-disease')
def predict_disease(request: SymptomPredictionRequest) -> dict:
    service = get_prediction_service()

    try:
        return service.predict(request.symptoms, request.follow_up_answers)
    except RuntimeError as error:
        raise HTTPException(status_code=500, detail=str(error)) from error
