export async function getHealthAssessment(payload) {
  return fetch("http://localhost:8000/health-assessment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}
