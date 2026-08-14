import { API_BASE_URL } from "./config";

export async function getTreatmentAffordabilityScore(payload) {
  return fetch(`${API_BASE_URL}/treatment-affordability-score`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}
