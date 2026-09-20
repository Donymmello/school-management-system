import apiClient from "./client.js";

export async function listFees(params) {
  const { data } = await apiClient.get("/fees", { params });
  return data;
}

export async function createFee(payload) {
  const { data } = await apiClient.post("/fees", payload);
  return data;
}

export async function updateFee(id, payload) {
  const { data } = await apiClient.patch(`/fees/${id}`, payload);
  return data;
}

export async function markFeeStatus(id, status) {
  const { data } = await apiClient.patch(`/fees/${id}/status`, { status });
  return data;
}

// Fase 8: propinas atrasadas + a vencer nos próximos `days` dias (default
// 7 no backend), agrupadas por aluno com entidade/referência de cada
// propina e totais por moeda.
export async function getFeeAlerts(days) {
  const { data } = await apiClient.get("/fees/alerts", { params: days ? { days } : undefined });
  return data;
}

export async function deleteFee(id) {
  const { data } = await apiClient.delete(`/fees/${id}`);
  return data;
}
