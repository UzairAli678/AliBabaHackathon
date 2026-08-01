export async function getSmartCareNavigator(payload) {
  return fetch("http://localhost:8000/smart-care-navigator", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}
