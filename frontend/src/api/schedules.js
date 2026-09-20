import apiClient from "./client.js";

// GET /schedules não filtra por courseOfferingSubjectId no backend (devolve
// tudo da escola) — filtragem é feita aqui no cliente.
export async function listSchedules() {
  const { data } = await apiClient.get("/schedules");
  return data;
}

export async function createSchedule(payload) {
  const { data } = await apiClient.post("/schedules", payload);
  return data.schedule;
}

export async function updateSchedule(id, payload) {
  const { data } = await apiClient.put(`/schedules/${id}`, payload);
  return data.schedule;
}

export async function deleteSchedule(id) {
  const { data } = await apiClient.delete(`/schedules/${id}`);
  return data;
}
