const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");
const requireSchool = require("../middleware/tenant.middleware");

const {
  getAllLogsAudit,
  getLogAuditById,
  getMyAudits,
} = require("../controllers/logAudit.controller");

/*
  ==========================================================
  ROTAS DE LOGS DE AUDITORIA
  ==========================================================
*/

// Ver todos os logs. requireSchool faltava aqui — sem ele, um ADMIN de
// qualquer escola conseguia ver logs de TODAS as escolas (isolamento
// multi-tenant quebrado, LogAudit não tem schoolId próprio, só chega nele
// via User.schoolId). Bug pego ao construir a tela de consulta de audit log
// (endpoint nunca tinha sido consumido por nenhum frontend antes).
router.get(
  "/",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN"),
  requireSchool,
  getAllLogsAudit
);

// Ver meus logs
router.get(
  "/meus",
  authMiddleware,
  getMyAudits
);

// Ver log específico
router.get(
  "/:id",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN"),
  requireSchool,
  getLogAuditById
);

module.exports = router;