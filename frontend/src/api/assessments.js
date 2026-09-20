import apiClient from "./client.js";

export async function listAssessments(courseOfferingSubjectId) {
  const { data } = await apiClient.get("/assessments", { params: { courseOfferingSubjectId } });
  return data.assessments;
}

export async function createAssessment(payload) {
  const { data } = await apiClient.post("/assessments", payload);
  return data.assessment;
}

export async function updateAssessment(id, payload) {
  const { data } = await apiClient.put(`/assessments/${id}`, payload);
  return data.assessment;
}

export async function deleteAssessment(id) {
  const { data } = await apiClient.delete(`/assessments/${id}`);
  return data;
}
