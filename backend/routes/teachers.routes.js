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
} = require("../controllers/teacher.controller");

const MANAGE_ROLES = ["SUPER_ADMIN", "ADMIN", "DIRECTOR", "SECRETARY"];

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
