import apiClient from "./client.js";

export async function listTeachers() {
  const { data } = await apiClient.get("/teachers");
  return data;
}

// Não existe POST /api/teachers no backend: criar professor cria um User
// (login) junto, então passa pelo mesmo endpoint de registro usado pro admin
// cadastrar qualquer papel (backend/controllers/auth.controller.js registerUser).
export async function createTeacher(payload) {
  const { data } = await apiClient.post("/auth/register-user", {
    ...payload,
    role: "TEACHER",
  });
  return data;
}

export async function updateTeacher(id, payload) {
  const { data } = await apiClient.patch(`/teachers/${id}`, payload);
  return data;
}

export async function deleteTeacher(id) {
  const { data } = await apiClient.delete(`/teachers/${id}`);
  return data;
}
