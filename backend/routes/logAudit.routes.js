const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

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

// Ver todos os logs
router.get(
  "/",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN"),
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
  getLogAuditById
);

module.exports = router;