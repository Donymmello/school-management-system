import apiClient from "./client.js";

export async function listCourseOfferings() {
  const { data } = await apiClient.get("/course-offerings");
  return data;
}

export async function createCourseOffering(payload) {
  const { data } = await apiClient.post("/course-offerings", payload);
  return data;
}

export async function updateCourseOffering(id, payload) {
  const { data } = await apiClient.patch(`/course-offerings/${id}`, payload);
  return data;
}

export async function deactivateCourseOffering(id) {
  const { data } = await apiClient.patch(`/course-offerings/${id}/deactivate`);
  return data;
}
