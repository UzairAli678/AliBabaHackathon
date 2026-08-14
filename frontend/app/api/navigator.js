import { API_BASE_URL } from "./config";

export async function getSmartCareNavigator(payload) {
  return fetch(`${API_BASE_URL}/smart-care-navigator`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}
