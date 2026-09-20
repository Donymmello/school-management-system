const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");
const requireSchool = require("../middleware/tenant.middleware");
const requireAcademicModel = require("../middleware/academicModel.middleware");

const {
  createTurmaSchedule,
  getAllTurmaSchedules,
  getTurmaScheduleById,
  updateTurmaSchedule,
  deleteTurmaSchedule,
} = require("../controllers/turmaSchedule.controller");

const requireSecondary = requireAcademicModel("SECONDARY");
// Espelha backend/routes/schedules.routes.js (HIGHER_ED), com STUDENT
// incluído desde já em vez de precisar de um fix depois (Fase 9a corrigiu
// esse mesmo gap no lado HIGHER_ED — ver schedule.controller.js).
const READ_ROLES = ["SUPER_ADMIN", "ADMIN", "STAFF", "DIRECTOR", "TEACHER", "STUDENT"];
const MANAGE_ROLES = ["SUPER_ADMIN", "ADMIN", "STAFF"];

router.post("/", authMiddleware, authorizeRoles(...MANAGE_ROLES), requireSchool, requireSecondary, createTurmaSchedule);
router.get("/", authMiddleware, authorizeRoles(...READ_ROLES), requireSchool, requireSecondary, getAllTurmaSchedules);
router.get("/:id", authMiddleware, authorizeRoles(...READ_ROLES), requireSchool, requireSecondary, getTurmaScheduleById);
router.put("/:id", authMiddleware, authorizeRoles(...MANAGE_ROLES), requireSchool, requireSecondary, updateTurmaSchedule);
router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  requireSchool,
  requireSecondary,
  deleteTurmaSchedule
);

module.exports = router;
