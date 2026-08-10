import apiClient from "./client.js";

export async function listStudents() {
  const { data } = await apiClient.get("/students");
  return data;
}

// Não existe POST /api/students no backend: criar aluno cria um User (login)
// junto, então passa pelo mesmo endpoint de registro usado pro admin cadastrar
// qualquer papel (backend/controllers/auth.controller.js registerUser).
export async function createStudent(payload) {
  const { data } = await apiClient.post("/auth/register-user", {
    ...payload,
    role: "STUDENT",
  });
  return data;
}

export async function updateStudent(id, payload) {
  const { data } = await apiClient.patch(`/students/${id}`, payload);
  return data;
}

export async function deleteStudent(id) {
  const { data } = await apiClient.delete(`/students/${id}`);
  return data;
}
