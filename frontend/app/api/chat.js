import { API_BASE_URL } from "./config";

export async function getAiChat(payload) {
  return fetch(`${API_BASE_URL}/ai-chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}
