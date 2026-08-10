const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");
const requireSchool = require("../middleware/tenant.middleware");

const {
  getAllStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
} = require("../controllers/staff.controller");

const MANAGE_ROLES = ["SUPER_ADMIN", "ADMIN", "DIRECTOR", "SECRETARY"];

router.get("/", authMiddleware, authorizeRoles(...MANAGE_ROLES), requireSchool, getAllStaff);
router.get("/:id", authMiddleware, authorizeRoles(...MANAGE_ROLES), requireSchool, getStaffById);
router.patch("/:id", authMiddleware, authorizeRoles(...MANAGE_ROLES), requireSchool, updateStaff);
router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  requireSchool,
  deleteStaff
);

module.exports = router;
