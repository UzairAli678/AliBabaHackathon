export async function getAppointments(payload) {
  return fetch("http://localhost:8000/appointments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}
