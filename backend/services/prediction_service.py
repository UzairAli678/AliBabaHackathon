from __future__ import annotations

from typing import Any

from .aggregator import PredictionAggregator
from .emergency_service import EmergencyDetectionService
from .knowledge_base import load_disease_knowledge_base
from .ml_service import MLPredictionService
from .response_formatter import ResponseFormatter


class PredictionService:
    def __init__(self) -> None:
        self.ml_service = MLPredictionService()
        self.emergency_service = EmergencyDetectionService()
        self.aggregator = PredictionAggregator()
        self.formatter = ResponseFormatter()
        self.knowledge_base = load_disease_knowledge_base()

    def predict(self, symptoms: list[str], follow_up_answers: dict[str, str] | None = None) -> dict[str, Any]:
        enriched_symptoms = list(symptoms)
        follow_up_answers = follow_up_answers or {}

        other_text_fragments = [value.strip() for value in follow_up_answers.values() if value and value.strip()]
        if other_text_fragments:
            enriched_symptoms.extend(other_text_fragments)

        emergency_result = self.emergency_service.detect(symptoms)
        ml_predictions = self.ml_service.predict(enriched_symptoms)
        aggregated_predictions = self.aggregator.aggregate(ml_predictions, enriched_symptoms, self.knowledge_base)
        serialized_predictions = self.aggregator.to_serializable(aggregated_predictions)
        best_prediction = serialized_predictions[0] if serialized_predictions else None

        follow_up_questions = []
        if best_prediction and best_prediction['final_score'] < 0.75:
            follow_up_questions = self.formatter.build_follow_up_questions(enriched_symptoms)

        response = self.formatter.format_prediction_response(symptoms, aggregated_predictions, follow_up_questions)
        response['confidence_threshold_met'] = bool(best_prediction and best_prediction['final_score'] >= 0.75)
        response['follow_up_answers'] = follow_up_answers
        # Urgency is advisory metadata. It must never replace or short-circuit
        # the model prediction, so callers can display both outcomes together.
        response['emergency'] = emergency_result.emergency
        response['urgent_warning'] = emergency_result.message if emergency_result.emergency else None
        return response
