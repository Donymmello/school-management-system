import apiClient from "./client.js";

export async function listSchools() {
  const { data } = await apiClient.get("/schools");
  return data;
}

export async function createSchool(payload) {
  const { data } = await apiClient.post("/schools", payload);
  return data;
}

// GET /schools/:id: SUPER_ADMIN vê qualquer uma, ADMIN/DIRECTOR/STAFF só a
// própria (checagem de posse no backend) — usado tanto no /escolas
// (SUPER_ADMIN) quanto na tela de configurações da própria escola (Fase 8).
export async function getSchool(id) {
  const { data } = await apiClient.get(`/schools/${id}`);
  return data;
}

export async function updateSchool(id, payload) {
  const { data } = await apiClient.patch(`/schools/${id}`, payload);
  return data;
}
