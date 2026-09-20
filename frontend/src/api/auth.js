import apiClient from "./client.js";

export async function login(email, password) {
  const { data } = await apiClient.post("/auth/login", { email, password });
  return data; // { token, user }
}

export async function registerSchool(payload) {
  const { data } = await apiClient.post("/schools/register", payload);
  return data; // { token, school, user }
}

export async function fetchMe() {
  const { data } = await apiClient.get("/auth/me");
  return data;
}

export async function changePassword(currentPassword, newPassword) {
  const { data } = await apiClient.patch("/auth/change-password", { currentPassword, newPassword });
  return data;
}

// "Esqueci minha senha" — pra quem perdeu acesso (diferente de
// changePassword, que exige estar logado com a senha atual). Resposta do
// backend é sempre a mesma genérica, exista o email ou não.
export async function forgotPassword(email) {
  const { data } = await apiClient.post("/auth/forgot-password", { email });
  return data;
}

export async function resetPassword(token, password) {
  const { data } = await apiClient.post("/auth/reset-password", { token, password });
  return data;
}
