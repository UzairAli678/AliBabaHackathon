import { API_BASE_URL } from "./config";

export async function getAppointments(payload) {
  return fetch(`${API_BASE_URL}/appointments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}
