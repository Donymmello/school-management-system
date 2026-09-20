import apiClient from "./client.js";

// GET /turma-schedules filtra por turmaSubjectId no backend quando passado
// (ver backend/controllers/turmaSchedule.controller.js) — diferente do
// /schedules (HIGHER_ED), que não filtra e depende do cliente.
export async function listTurmaSchedules(turmaSubjectId) {
  const { data } = await apiClient.get("/turma-schedules", {
    params: turmaSubjectId ? { turmaSubjectId } : undefined,
  });
  return data;
}

export async function createTurmaSchedule(payload) {
  const { data } = await apiClient.post("/turma-schedules", payload);
  return data.schedule;
}

export async function updateTurmaSchedule(id, payload) {
  const { data } = await apiClient.put(`/turma-schedules/${id}`, payload);
  return data.schedule;
}

export async function deleteTurmaSchedule(id) {
  const { data } = await apiClient.delete(`/turma-schedules/${id}`);
  return data;
}
