const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");
const requireSchool = require("../middleware/tenant.middleware");
const requireAcademicModel = require("../middleware/academicModel.middleware");

const {
  createTurmaSubject,
  getAllTurmaSubjects,
  updateTurmaSubject,
  deleteTurmaSubject,
} = require("../controllers/turmaSubject.controller");

const requireSecondary = requireAcademicModel("SECONDARY");
const READ_ROLES = ["ADMIN", "SUPER_ADMIN", "STAFF", "DIRECTOR", "TEACHER"];
const MANAGE_ROLES = ["ADMIN", "SUPER_ADMIN", "STAFF"];

router.post(
  "/",
  authMiddleware,
  authorizeRoles(...MANAGE_ROLES),
  requireSchool,
  requireSecondary,
  createTurmaSubject
);

router.get(
  "/",
  authMiddleware,
  authorizeRoles(...READ_ROLES),
  requireSchool,
  requireSecondary,
  getAllTurmaSubjects
);

router.put(
  "/:id",
  authMiddleware,
  authorizeRoles(...MANAGE_ROLES),
  requireSchool,
  requireSecondary,
  updateTurmaSubject
);

router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN"),
  requireSchool,
  requireSecondary,
  deleteTurmaSubject
);

module.exports = router;
