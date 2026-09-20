import apiClient from "./client.js";

export async function listTurmaSubjects(turmaId) {
  const { data } = await apiClient.get("/turma-subjects", { params: { turmaId } });
  return data;
}

export async function createTurmaSubject(payload) {
  const { data } = await apiClient.post("/turma-subjects", payload);
  return data.data;
}

export async function updateTurmaSubject(id, payload) {
  const { data } = await apiClient.put(`/turma-subjects/${id}`, payload);
  return data.data;
}

export async function deleteTurmaSubject(id) {
  const { data } = await apiClient.delete(`/turma-subjects/${id}`);
  return data;
}
