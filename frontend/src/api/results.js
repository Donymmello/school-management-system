import apiClient from "./client.js";

export async function getStudentResult(enrollmentId, courseOfferingSubjectId) {
  const { data } = await apiClient.get(`/results/${enrollmentId}/${courseOfferingSubjectId}`);
  return data;
}
