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

const MANAGE_ROLES = ["SUPER_ADMIN", "ADMIN", "DIRECTOR", "SECRETARY", "TEACHER"];

router.post("/", authMiddleware, authorizeRoles(...MANAGE_ROLES), requireSchool, createAttendance);
router.get("/", authMiddleware, authorizeRoles(...MANAGE_ROLES), requireSchool, getAllAttendance);
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
