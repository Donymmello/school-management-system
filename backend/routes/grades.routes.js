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

const MANAGE_ROLES = ["SUPER_ADMIN", "ADMIN", "DIRECTOR", "SECRETARY", "TEACHER"];

router.post("/", authMiddleware, authorizeRoles(...MANAGE_ROLES), requireSchool, createGrade);
router.get("/", authMiddleware, authorizeRoles(...MANAGE_ROLES), requireSchool, getAllGrades);
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
