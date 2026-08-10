const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");
const requireSchool = require("../middleware/tenant.middleware");
const requireAcademicModel = require("../middleware/academicModel.middleware");

const {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deactivateCourse,
  deleteCourse,
} = require("../controllers/course.controller");

const requireHigherEd = requireAcademicModel("HIGHER_ED");

router.post(
  "/",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN", "STAFF"),
  requireSchool,
  requireHigherEd,
  createCourse
);

router.get(
  "/",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN", "STAFF", "DIRECTOR", "TEACHER", "STUDENT"),
  requireSchool,
  requireHigherEd,
  getAllCourses
);

router.get(
  "/:id",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN", "STAFF", "DIRECTOR", "TEACHER", "STUDENT"),
  requireSchool,
  requireHigherEd,
  getCourseById
);

router.patch(
  "/:id",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN", "STAFF"),
  requireSchool,
  requireHigherEd,
  updateCourse
);

router.patch(
  "/:id/deactivate",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN", "STAFF"),
  requireSchool,
  requireHigherEd,
  deactivateCourse
);

router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN"),
  requireSchool,
  requireHigherEd,
  deleteCourse
);

module.exports = router;
