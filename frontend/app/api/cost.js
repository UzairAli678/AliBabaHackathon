import { API_BASE_URL } from "./config";

export async function getMedicalCostIntelligence(payload) {
  return fetch(`${API_BASE_URL}/medical-cost-intelligence`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}
