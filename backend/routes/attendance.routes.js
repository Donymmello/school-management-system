const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");
const requireSchool = require("../middleware/tenant.middleware");

const {
  createAttendance,
  getAllAttendance,
  getAttendanceById,
  updateAttendance,
  deleteAttendance,
} = require("../controllers/attendance.controller");

const MANAGE_ROLES = ["SUPER_ADMIN", "ADMIN", "DIRECTOR", "STAFF", "TEACHER"];
// STUDENT só entra na listagem (portal do aluno, auto-escopado no
// controller) — não em criar/editar/excluir nem em getAttendanceById, que
// não tem esse auto-escopo implementado.
const READ_ROLES = [...MANAGE_ROLES, "STUDENT"];

router.post("/", authMiddleware, authorizeRoles(...MANAGE_ROLES), requireSchool, createAttendance);
router.get("/", authMiddleware, authorizeRoles(...READ_ROLES), requireSchool, getAllAttendance);
router.get("/:id", authMiddleware, authorizeRoles(...MANAGE_ROLES), requireSchool, getAttendanceById);
router.patch("/:id", authMiddleware, authorizeRoles(...MANAGE_ROLES), requireSchool, updateAttendance);
router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles("SUPER_ADMIN", "ADMIN", "DIRECTOR"),
  requireSchool,
  deleteAttendance
);

module.exports = router;
