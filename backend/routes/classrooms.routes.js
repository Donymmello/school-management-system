const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");
const requireSchool = require("../middleware/tenant.middleware");

const {
  createClassroom,
  getAllClassrooms,
  getClassroomById,
  updateClassroom,
  deactivateClassroom,
  deleteClassroom,
} = require("../controllers/classroom.controller");

router.post(
  "/",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN", "STAFF"),
  requireSchool,
  createClassroom
);

router.get(
  "/",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN", "STAFF", "DIRECTOR", "TEACHER"),
  requireSchool,
  getAllClassrooms
);

router.get(
  "/:id",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN", "STAFF", "DIRECTOR", "TEACHER"),
  requireSchool,
  getClassroomById
);

router.patch(
  "/:id",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN", "STAFF"),
  requireSchool,
  updateClassroom
);

router.patch(
  "/:id/deactivate",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN", "STAFF"),
  requireSchool,
  deactivateClassroom
);

router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN"),
  requireSchool,
  deleteClassroom
);

module.exports = router;
