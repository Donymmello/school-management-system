import apiClient from "./client.js";

export async function listStudentAssessments(params) {
  const { data } = await apiClient.get("/student-assessments", { params });
  return data.results;
}

export async function recordScore(payload) {
  const { data } = await apiClient.post("/student-assessments", payload);
  return data.result;
}
