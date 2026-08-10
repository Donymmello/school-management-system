import apiClient from "./client.js";

export async function listClassrooms() {
  const { data } = await apiClient.get("/classrooms");
  return data;
}

export async function createClassroom(payload) {
  const { data } = await apiClient.post("/classrooms", payload);
  return data;
}

export async function updateClassroom(id, payload) {
  const { data } = await apiClient.patch(`/classrooms/${id}`, payload);
  return data;
}

export async function deleteClassroom(id) {
  const { data } = await apiClient.delete(`/classrooms/${id}`);
  return data;
}
