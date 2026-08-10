import apiClient from "./client.js";

export async function listEnrollments() {
  const { data } = await apiClient.get("/enrollments");
  return data;
}

export async function enrollStudent(payload) {
  const { data } = await apiClient.post("/enrollments", payload);
  return data;
}

export async function approveEnrollment(id) {
  const { data } = await apiClient.patch(`/enrollments/${id}/approve`);
  return data;
}

export async function rejectEnrollment(id, rejectionReason) {
  const { data } = await apiClient.patch(`/enrollments/${id}/reject`, { rejectionReason });
  return data;
}

export async function cancelEnrollment(id) {
  const { data } = await apiClient.patch(`/enrollments/${id}/cancel`);
  return data;
}
