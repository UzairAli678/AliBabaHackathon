export async function getMedicalCostIntelligence(payload) {
  return fetch("http://localhost:8000/medical-cost-intelligence", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}
