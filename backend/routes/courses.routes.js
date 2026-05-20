const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

const {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deactivateCourse,
  deleteCourse,
} = require("../controllers/course.controller");

router.post(
  "/",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN", "STAFF"),
  createCourse
);

router.get(
  "/",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN", "STAFF", "DIRECTOR", "TEACHER", "STUDENT"),
  getAllCourses
);

router.get(
  "/:id",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN", "STAFF", "DIRECTOR", "TEACHER", "STUDENT"),
  getCourseById
);

router.patch(
  "/:id",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN", "STAFF"),
  updateCourse
);

router.patch(
  "/:id/deactivate",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN", "STAFF"),
  deactivateCourse
);

router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN"),
  deleteCourse
);

module.exports = router;