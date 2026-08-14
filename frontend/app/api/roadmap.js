import { API_BASE_URL } from "./config";

export async function getHealthRoadmap(payload) {
  return fetch(`${API_BASE_URL}/health-roadmap`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}
