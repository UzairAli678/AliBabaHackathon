from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class EmergencyResult:
    emergency: bool
    message: str | None = None


class EmergencyDetectionService:
    def detect(self, symptoms: list[str]) -> EmergencyResult:
        normalized = {symptom.strip().lower() for symptom in symptoms if symptom and symptom.strip()}

        if 'loss_of_consciousness' in normalized:
            return EmergencyResult(True, 'Seek immediate medical attention.')

        if 'paralysis' in normalized or 'weakness_of_one_body_side' in normalized or 'slurred_speech' in normalized:
            return EmergencyResult(True, 'Seek immediate medical attention.')

        if 'severe_bleeding' in normalized or 'blood_in_sputum' in normalized or 'bloody_stool' in normalized:
            return EmergencyResult(True, 'Seek immediate medical attention.')

        if 'severe_headache' in normalized and (
            'altered_sensorium' in normalized or 'slurred_speech' in normalized or 'loss_of_balance' in normalized
        ):
            return EmergencyResult(True, 'Seek immediate medical attention.')

        if 'chest_pain' in normalized and ('breathlessness' in normalized or 'shortness_of_breath' in normalized):
            return EmergencyResult(True, 'Seek immediate medical attention.')

        return EmergencyResult(False)
