import apiClient from "./client.js";

export async function listGrades(params) {
  const { data } = await apiClient.get("/grades", { params });
  return data;
}

export async function createGrade(payload) {
  const { data } = await apiClient.post("/grades", payload);
  return data;
}

export async function updateGrade(id, payload) {
  const { data } = await apiClient.patch(`/grades/${id}`, payload);
  return data;
}

export async function deleteGrade(id) {
  const { data } = await apiClient.delete(`/grades/${id}`);
  return data;
}
