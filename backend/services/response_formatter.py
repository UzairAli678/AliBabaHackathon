from __future__ import annotations

from typing import Any

from .aggregator import AggregatedPrediction
from .emergency_service import EmergencyResult


class ResponseFormatter:
    def format_emergency(self, emergency_result: EmergencyResult) -> dict[str, Any]:
        return {
            'emergency': True,
            'message': emergency_result.message or 'Seek immediate medical attention.',
        }

    def build_follow_up_questions(self, selected_symptoms: list[str]) -> list[dict[str, Any]]:
        follow_up_questions: list[dict[str, Any]] = [
            {
                'id': 'duration',
                'question': 'How long have these symptoms been present?',
                'options': ['Less than 1 day', '1 to 3 days', 'More than 3 days', 'NA', 'Other'],
                'allow_other': True,
            },
            {
                'id': 'trend',
                'question': 'Are the symptoms getting worse or staying the same?',
                'options': ['Getting worse', 'Staying the same', 'Getting better', 'NA', 'Other'],
                'allow_other': True,
            },
            {
                'id': 'fever',
                'question': 'Do you have any fever, chills, or night sweats?',
                'options': ['Yes', 'No', 'NA', 'Other'],
                'allow_other': True,
            },
            {
                'id': 'breathing',
                'question': 'Are you experiencing any breathing difficulty or chest discomfort?',
                'options': ['Yes', 'No', 'NA', 'Other'],
                'allow_other': True,
            },
            {
                'id': 'digestive',
                'question': 'Is there any nausea, vomiting, or trouble keeping fluids down?',
                'options': ['Yes', 'No', 'NA', 'Other'],
                'allow_other': True,
            },
        ]

        if len(selected_symptoms) >= 3:
            follow_up_questions.append(
                {
                    'id': 'severity_detail',
                    'question': 'Which symptom is the most severe right now?',
                    'options': ['Pain', 'Fever', 'Breathing issue', 'Skin change', 'NA', 'Other'],
                    'allow_other': True,
                }
            )

        return follow_up_questions

    def format_prediction_response(
        self,
        selected_symptoms: list[str],
        predictions: list[AggregatedPrediction],
        follow_up_questions: list[dict[str, Any]] | None = None,
    ) -> dict[str, Any]:
        top_predictions = predictions[:5]
        response_predictions: list[dict[str, Any]] = []

        for prediction in top_predictions:
            confidence_percent = round(prediction.final_score * 100)
            response_predictions.append(
                {
                    'disease': prediction.disease,
                    'ml_probability': round(prediction.ml_probability, 4),
                    'rule_score': round(prediction.rule_score, 4),
                    'final_score': round(prediction.final_score, 4),
                    'probability': round(prediction.final_score, 4),
                    'confidence': confidence_percent,
                    'matched_symptoms': prediction.matched_symptoms,
                    'missing_symptoms': prediction.missing_symptoms,
                    'recommended_specialist': prediction.recommended_specialist,
                    'specialist': prediction.recommended_specialist,
                    'severity': prediction.severity,
                    'reason': prediction.reason,
                }
            )

        primary = response_predictions[0] if response_predictions else None

        return {
            'selected_symptoms': selected_symptoms,
            'predictions': response_predictions,
            'best_prediction': primary,
            'follow_up_questions': follow_up_questions or [],
        }
