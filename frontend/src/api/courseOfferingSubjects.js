import apiClient from "./client.js";

// GET /course-offering-subjects não filtra por courseOfferingId no backend
// (devolve tudo da escola) — filtragem por oferta é feita aqui no cliente.
// Ver docs/project-rules.md, seção 6, item 6 (fase 5 do roadmap de execução).
export async function listCourseOfferingSubjects() {
  const { data } = await apiClient.get("/course-offering-subjects");
  return data;
}

export async function getCourseOfferingSubject(id) {
  const { data } = await apiClient.get(`/course-offering-subjects/${id}`);
  return data;
}

export async function createCourseOfferingSubject(payload) {
  const { data } = await apiClient.post("/course-offering-subjects", payload);
  return data.data;
}

export async function updateCourseOfferingSubject(id, payload) {
  const { data } = await apiClient.put(`/course-offering-subjects/${id}`, payload);
  return data.data;
}
