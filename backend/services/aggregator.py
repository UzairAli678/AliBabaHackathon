from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any

from .emergency_service import EmergencyResult
from .rule_engine import RuleEvaluation


@dataclass(frozen=True)
class AggregatedPrediction:
    disease: str
    ml_probability: float
    rule_score: float
    final_score: float
    matched_symptoms: list[str]
    missing_symptoms: list[str]
    recommended_specialist: str
    severity: str
    reason: str


class PredictionAggregator:
    def aggregate(
        self,
        ml_predictions: list[dict[str, Any]],
        selected_symptoms: list[str],
        knowledge_base: dict[str, dict[str, Any]],
    ) -> list[AggregatedPrediction]:
        from .rule_engine import RuleEngine

        rule_engine = RuleEngine()
        combined_predictions: list[AggregatedPrediction] = []

        for prediction in ml_predictions:
            disease = prediction['disease']
            ml_probability = float(prediction['ml_probability'])
            rule_evaluation: RuleEvaluation = rule_engine.evaluate(disease, selected_symptoms, knowledge_base)
            # Rules provide supporting evidence but must not dilute a confident
            # trained-model result merely because the compact knowledge base
            # lists fewer symptoms than the training dataset.
            final_score = round(ml_probability + ((1.0 - ml_probability) * 0.3 * rule_evaluation.rule_score), 4)

            combined_predictions.append(
                AggregatedPrediction(
                    disease=disease,
                    ml_probability=ml_probability,
                    rule_score=rule_evaluation.rule_score,
                    final_score=final_score,
                    matched_symptoms=rule_evaluation.matched_symptoms,
                    missing_symptoms=rule_evaluation.missing_symptoms,
                    recommended_specialist=rule_evaluation.recommended_specialist,
                    severity=rule_evaluation.severity,
                    reason=rule_evaluation.reason,
                )
            )

        return sorted(combined_predictions, key=lambda item: item.final_score, reverse=True)

    def to_serializable(self, predictions: list[AggregatedPrediction]) -> list[dict[str, Any]]:
        return [asdict(prediction) for prediction in predictions]
