import apiClient from "./client.js";

export async function listSchools() {
  const { data } = await apiClient.get("/schools");
  return data;
}

export async function createSchool(payload) {
  const { data } = await apiClient.post("/schools", payload);
  return data;
}

export async function updateSchool(id, payload) {
  const { data } = await apiClient.patch(`/schools/${id}`, payload);
  return data;
}
