const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");
const requireSchool = require("../middleware/tenant.middleware");

const {
  createGrade,
  getAllGrades,
  getGradeById,
  updateGrade,
  deleteGrade,
} = require("../controllers/grade.controller");

// STAFF entra aqui porque o papel foi definido como "secretaria": lança
// nota, trata inscrição e propina — ver docs/project-rules.md, seção 4.
// SECRETARY foi unificado em STAFF, não entra mais separado (ver seção 7).
const MANAGE_ROLES = ["SUPER_ADMIN", "ADMIN", "DIRECTOR", "TEACHER", "STAFF"];
// STUDENT só entra na listagem (portal do aluno, auto-escopado no
// controller) — não em criar/editar/excluir nem em getGradeById, que não
// tem esse auto-escopo implementado.
const READ_ROLES = [...MANAGE_ROLES, "STUDENT"];

router.post("/", authMiddleware, authorizeRoles(...MANAGE_ROLES), requireSchool, createGrade);
router.get("/", authMiddleware, authorizeRoles(...READ_ROLES), requireSchool, getAllGrades);
router.get("/:id", authMiddleware, authorizeRoles(...MANAGE_ROLES), requireSchool, getGradeById);
router.patch("/:id", authMiddleware, authorizeRoles(...MANAGE_ROLES), requireSchool, updateGrade);
router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles("SUPER_ADMIN", "ADMIN", "DIRECTOR"),
  requireSchool,
  deleteGrade
);

module.exports = router;
