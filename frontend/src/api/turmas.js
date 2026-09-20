import apiClient from "./client.js";

export async function listTurmas() {
  const { data } = await apiClient.get("/turmas");
  return data;
}

export async function getTurma(id) {
  const { data } = await apiClient.get(`/turmas/${id}`);
  return data;
}

export async function createTurma(payload) {
  const { data } = await apiClient.post("/turmas", payload);
  return data.turma;
}

export async function updateTurma(id, payload) {
  const { data } = await apiClient.patch(`/turmas/${id}`, payload);
  return data.turma;
}

export async function deleteTurma(id) {
  const { data } = await apiClient.delete(`/turmas/${id}`);
  return data;
}
