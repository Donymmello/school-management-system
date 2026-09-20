const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");
const requireSchool = require("../middleware/tenant.middleware");

const {
  getAllTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
  getMySubjects,
} = require("../controllers/teacher.controller");

const MANAGE_ROLES = ["SUPER_ADMIN", "ADMIN", "DIRECTOR", "STAFF"];

// Antes de "/:id" por clareza. Sem requireSchool: o escopo é o próprio
// registo de Teacher resolvido pelo token, que já pertence a uma escola.
router.get("/me/subjects", authMiddleware, authorizeRoles("TEACHER"), getMySubjects);

router.get("/", authMiddleware, authorizeRoles(...MANAGE_ROLES), requireSchool, getAllTeachers);
router.get("/:id", authMiddleware, authorizeRoles(...MANAGE_ROLES), requireSchool, getTeacherById);
router.patch("/:id", authMiddleware, authorizeRoles(...MANAGE_ROLES), requireSchool, updateTeacher);
router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  requireSchool,
  deleteTeacher
);

module.exports = router;
