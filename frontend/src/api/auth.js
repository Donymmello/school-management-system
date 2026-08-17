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
