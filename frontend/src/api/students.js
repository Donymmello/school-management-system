import apiClient from "./client.js";

// Sem argumentos devolve tudo, que é o que as telas de listagem querem.
// Com { search, limit } o backend filtra e trunca — usado pelas caixas de
// seleção, para não descarregarem a escola inteira à procura de um aluno.
export async function listStudents(params = {}) {
  const { data } = await apiClient.get("/students", { params });
  return data;
}

// Portal do aluno: o próprio registro, resolvido pelo backend via userId do
// token — não existe um :id aqui de propósito.
export async function getMyProfile() {
  const { data } = await apiClient.get("/students/me");
  return data;
}

// Fase 9c — disciplinas do aluno (via matrícula aprovada no HIGHER_ED, via
// turma no SECONDARY), já normalizadas num shape só pelo backend.
export async function getMyStudyPlan() {
  const { data } = await apiClient.get("/students/me/study-plan");
  return data;
}

// Fase 9d — aprovado/reprovado por disciplina (HIGHER_ED, reaproveita o
// cálculo de AcademicPolicy) ou média simples por disciplina (SECONDARY).
export async function getMyAcademicStatus() {
  const { data } = await apiClient.get("/students/me/academic-status");
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
