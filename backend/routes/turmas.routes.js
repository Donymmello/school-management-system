const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");
const requireSchool = require("../middleware/tenant.middleware");
const requireAcademicModel = require("../middleware/academicModel.middleware");

const {
  createTurma,
  getAllTurmas,
  getTurmaById,
  updateTurma,
  deleteTurma,
} = require("../controllers/turma.controller");

// Turma pedagógica só existe pra escolas SECONDARY — ver
// docs/project-rules.md, seção 5 e 6 (fase 6 do roadmap de execução).
const requireSecondary = requireAcademicModel("SECONDARY");
const READ_ROLES = ["ADMIN", "SUPER_ADMIN", "STAFF", "DIRECTOR", "TEACHER"];
const MANAGE_ROLES = ["ADMIN", "SUPER_ADMIN", "STAFF"];

router.post("/", authMiddleware, authorizeRoles(...MANAGE_ROLES), requireSchool, requireSecondary, createTurma);

router.get("/", authMiddleware, authorizeRoles(...READ_ROLES), requireSchool, requireSecondary, getAllTurmas);

router.get("/:id", authMiddleware, authorizeRoles(...READ_ROLES), requireSchool, requireSecondary, getTurmaById);

router.patch("/:id", authMiddleware, authorizeRoles(...MANAGE_ROLES), requireSchool, requireSecondary, updateTurma);

router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN"),
  requireSchool,
  requireSecondary,
  deleteTurma
);

module.exports = router;
