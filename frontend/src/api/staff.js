import apiClient from "./client.js";

export async function listStaff() {
  const { data } = await apiClient.get("/staff");
  return data;
}

// Não existe POST /api/staff no backend: criar um colaborador cria um User
// (login) junto, então passa pelo mesmo endpoint de registro usado pro admin
// cadastrar qualquer papel (backend/controllers/auth.controller.js
// registerUser) — mesmo padrão de createTeacher em api/teachers.js.
export async function createStaff(payload) {
  const { data } = await apiClient.post("/auth/register-user", {
    ...payload,
    role: "STAFF",
  });
  return data;
}

export async function updateStaff(id, payload) {
  const { data } = await apiClient.patch(`/staff/${id}`, payload);
  return data;
}

export async function deleteStaff(id) {
  const { data } = await apiClient.delete(`/staff/${id}`);
  return data;
}
