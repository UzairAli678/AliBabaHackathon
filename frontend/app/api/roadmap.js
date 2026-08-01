export async function getHealthRoadmap(payload) {
  return fetch("http://localhost:8000/health-roadmap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}
