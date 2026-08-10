import apiClient from "./client.js";

export async function listAttendance(params) {
  const { data } = await apiClient.get("/attendance", { params });
  return data;
}

export async function createAttendance(payload) {
  const { data } = await apiClient.post("/attendance", payload);
  return data;
}

export async function updateAttendance(id, payload) {
  const { data } = await apiClient.patch(`/attendance/${id}`, payload);
  return data;
}

export async function deleteAttendance(id) {
  const { data } = await apiClient.delete(`/attendance/${id}`);
  return data;
}
