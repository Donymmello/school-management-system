const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");
const requireSchool = require("../middleware/tenant.middleware");
const requireAcademicModel = require("../middleware/academicModel.middleware");

const {
  createCourseOffering,
  getAllCourseOfferings,
  getCourseOfferingById,
  updateCourseOffering,
  deactivateCourseOffering,
} = require("../controllers/courseOffering.controller");

const requireHigherEd = requireAcademicModel("HIGHER_ED");

router.post(
  "/",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN", "STAFF"),
  requireSchool,
  requireHigherEd,
  createCourseOffering
);

router.get(
  "/",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN", "STAFF", "DIRECTOR", "TEACHER", "STUDENT"),
  requireSchool,
  requireHigherEd,
  getAllCourseOfferings
);

router.get(
  "/:id",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN", "STAFF", "DIRECTOR", "TEACHER", "STUDENT"),
  requireSchool,
  requireHigherEd,
  getCourseOfferingById
);

router.patch(
  "/:id",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN", "STAFF"),
  requireSchool,
  requireHigherEd,
  updateCourseOffering
);

router.patch(
  "/:id/deactivate",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN", "STAFF"),
  requireSchool,
  requireHigherEd,
  deactivateCourseOffering
);

module.exports = router;