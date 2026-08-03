from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd

BASE_DIR = Path(__file__).resolve().parents[1] / 'ml'
MODEL_PATH = BASE_DIR / 'disease_model.pkl'
SYMPTOMS_PATH = BASE_DIR / 'symptoms_list.pkl'
DISEASES_PATH = BASE_DIR / 'diseases_list.pkl'


@lru_cache(maxsize=1)
def load_assets() -> dict[str, Any]:
    return {
        'model': joblib.load(MODEL_PATH),
        'symptoms': joblib.load(SYMPTOMS_PATH),
        'diseases': joblib.load(DISEASES_PATH),
    }


class MLPredictionService:
    def __init__(self) -> None:
        assets = load_assets()
        self.model = assets['model']
        self.symptoms: list[str] = assets['symptoms']
        self.diseases: list[str] = assets['diseases']
        self.symptom_index = {symptom.lower(): index for index, symptom in enumerate(self.symptoms)}

    def predict(self, symptoms: list[str]) -> list[dict[str, Any]]:
        input_vector = np.zeros(len(self.symptoms), dtype=int)
        normalized_symptoms = {symptom.strip().lower() for symptom in symptoms if symptom and symptom.strip()}

        for symptom in normalized_symptoms:
            index = self.symptom_index.get(symptom)
            if index is not None:
                input_vector[index] = 1

        feature_frame = pd.DataFrame([input_vector], columns=self.symptoms)
        probabilities = self.model.predict_proba(feature_frame)[0]
        ranked_indices = np.argsort(probabilities)[::-1][:5]

        return [
            {
                'disease': self.model.classes_[index],
                'ml_probability': float(probabilities[index]),
            }
            for index in ranked_indices
        ]
