import apiClient from "./client.js";

export async function listSubjects() {
  const { data } = await apiClient.get("/subjects");
  return data;
}

export async function createSubject(payload) {
  const { data } = await apiClient.post("/subjects", payload);
  return data;
}

export async function updateSubject(id, payload) {
  const { data } = await apiClient.patch(`/subjects/${id}`, payload);
  return data;
}

export async function deleteSubject(id) {
  const { data } = await apiClient.delete(`/subjects/${id}`);
  return data;
}
