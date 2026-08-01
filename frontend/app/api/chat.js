export async function getAiChat(payload) {
  return fetch("http://localhost:8000/ai-chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}
