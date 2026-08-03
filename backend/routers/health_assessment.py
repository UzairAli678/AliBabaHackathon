from __future__ import annotations

from pathlib import Path
from typing import List

import joblib
import numpy as np
import pandas as pd
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field


router = APIRouter(prefix='/health-assessment', tags=['health-assessment'])

BASE_DIR = Path(__file__).resolve().parents[1] / 'ml'
MODEL_PATH = BASE_DIR / 'disease_model.pkl'
SYMPTOMS_PATH = BASE_DIR / 'symptoms_list.pkl'
DISEASES_PATH = BASE_DIR / 'diseases_list.pkl'

_model = None
_symptoms_list: list[str] | None = None
_diseases_list: list[str] | None = None


class SymptomPredictionRequest(BaseModel):
    symptoms: List[str] = Field(default_factory=list)


def load_assets() -> None:
    global _model, _symptoms_list, _diseases_list

    if _model is not None and _symptoms_list is not None and _diseases_list is not None:
        return

    if not MODEL_PATH.exists() or not SYMPTOMS_PATH.exists() or not DISEASES_PATH.exists():
        raise RuntimeError('ML assets are missing. Run backend/ml/train_model.py first.')

    _model = joblib.load(MODEL_PATH)
    _symptoms_list = joblib.load(SYMPTOMS_PATH)
    _diseases_list = joblib.load(DISEASES_PATH)


@router.on_event('startup')
def startup_load_assets() -> None:
    load_assets()


@router.get('')
def get_health_assessment() -> dict:
    return {
        'risk_level': 'moderate',
        'likely_conditions': ['seasonal flu', 'allergic rhinitis'],
        'recommended_action': 'Consult a general physician within 24 hours.',
    }


@router.get('/symptoms-list')
def get_symptoms_list() -> dict:
    load_assets()
    return {'symptoms': _symptoms_list}


@router.post('/predict-disease')
def predict_disease(request: SymptomPredictionRequest) -> dict:
    load_assets()

    if _model is None or _symptoms_list is None or _diseases_list is None:
        raise HTTPException(status_code=500, detail='Disease prediction model is not available.')

    input_vector = np.zeros(len(_symptoms_list), dtype=int)
    normalized_symptoms = {symptom.strip().lower() for symptom in request.symptoms if symptom.strip()}
    symptom_index = {symptom.lower(): index for index, symptom in enumerate(_symptoms_list)}

    for symptom in normalized_symptoms:
        index = symptom_index.get(symptom)
        if index is not None:
            input_vector[index] = 1

    feature_frame = pd.DataFrame([input_vector], columns=_symptoms_list)
    probabilities = _model.predict_proba(feature_frame)[0]
    ranked_indices = np.argsort(probabilities)[::-1][:3]

    top_predictions = [
        {
            'disease': _model.classes_[index],
            'probability': float(probabilities[index]),
        }
        for index in ranked_indices
    ]

    return {
        'selected_symptoms': request.symptoms,
        'predictions': top_predictions,
    }