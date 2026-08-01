export async function getTreatmentAffordabilityScore(payload) {
  return fetch("http://localhost:8000/treatment-affordability-score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}
