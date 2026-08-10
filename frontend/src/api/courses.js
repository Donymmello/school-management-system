import apiClient from "./client.js";

export async function listCourses() {
  const { data } = await apiClient.get("/courses");
  return data;
}

export async function createCourse(payload) {
  const { data } = await apiClient.post("/courses", payload);
  return data;
}

export async function updateCourse(id, payload) {
  const { data } = await apiClient.patch(`/courses/${id}`, payload);
  return data;
}

export async function deleteCourse(id) {
  const { data } = await apiClient.delete(`/courses/${id}`);
  return data;
}
