from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class RuleEvaluation:
    matched_symptoms: list[str]
    missing_symptoms: list[str]
    rule_score: float
    recommended_specialist: str
    severity: str
    emergency: bool
    reason: str


class RuleEngine:
    def evaluate(self, disease: str, selected_symptoms: list[str], knowledge_base: dict[str, dict[str, Any]]) -> RuleEvaluation:
        disease_entry = knowledge_base.get(disease, {})
        expected_symptoms = disease_entry.get('symptoms', [])
        disease_specialist = disease_entry.get('specialist', 'General Physician')
        severity = disease_entry.get('severity', 'Moderate')
        emergency = bool(disease_entry.get('emergency', False))

        normalized_selected = {symptom.strip().lower() for symptom in selected_symptoms if symptom and symptom.strip()}
        matched_symptoms = [symptom for symptom in expected_symptoms if symptom.lower() in normalized_selected]
        missing_symptoms = [symptom for symptom in expected_symptoms if symptom.lower() not in normalized_selected]

        if expected_symptoms:
            coverage = len(matched_symptoms) / len(expected_symptoms)
        else:
            coverage = 0.0

        rule_score = round(min(1.0, coverage + (0.1 if matched_symptoms else 0.0)), 4)
        reason = (
            f"Matched {len(matched_symptoms)} of {len(expected_symptoms)} common symptoms for {disease}."
            if expected_symptoms
            else f"No rule profile available for {disease}; using model output with fallback specialist."
        )

        return RuleEvaluation(
            matched_symptoms=matched_symptoms,
            missing_symptoms=missing_symptoms,
            rule_score=rule_score,
            recommended_specialist=disease_specialist,
            severity=severity,
            emergency=emergency,
            reason=reason,
        )
