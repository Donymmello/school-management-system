const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");
const requireSchool = require("../middleware/tenant.middleware");

const { getDashboardSummary } = require("../controllers/dashboard.controller");

// Só papéis administrativos — TEACHER/STUDENT não veem KPIs agregados
// (financeiro, contagens de toda a escola) por enquanto. Ver
// docs/project-rules.md, seção 7.
router.get(
  "/summary",
  authMiddleware,
  authorizeRoles("SUPER_ADMIN", "ADMIN", "DIRECTOR", "STAFF"),
  requireSchool,
  getDashboardSummary
);

module.exports = router;
