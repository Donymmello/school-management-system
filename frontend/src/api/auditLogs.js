import apiClient from "./client.js";

// GET /api/logs-audit — só ADMIN/SUPER_ADMIN (backend restringe por escola
// pra ADMIN via requireSchool, ver backend/routes/logAudit.routes.js).
export async function listAuditLogs() {
  const { data } = await apiClient.get("/logs-audit");
  return data;
}

// GET /api/logs-audit/meus — qualquer papel autenticado, só as próprias ações.
export async function listMyAuditLogs() {
  const { data } = await apiClient.get("/logs-audit/meus");
  return data;
}
