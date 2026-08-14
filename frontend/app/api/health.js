import { API_BASE_URL } from "./config";

export async function getHealthAssessment(payload) {
  return fetch(`${API_BASE_URL}/health-assessment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}
