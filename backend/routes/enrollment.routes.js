const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");
const requireSchool = require("../middleware/tenant.middleware");
const requireAcademicModel = require("../middleware/academicModel.middleware");

const {
  enrollStudent,
  getEnrollments,
  getEnrollmentById,
  approveEnrollment,
  rejectEnrollment,
  cancelEnrollment,
} = require("../controllers/enrollment.controller");

const requireHigherEd = requireAcademicModel("HIGHER_ED");

router.post(
  "/",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN", "STAFF", "STUDENT"),
  requireSchool,
  requireHigherEd,
  enrollStudent
);

router.get(
  "/",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN", "STAFF", "DIRECTOR", "STUDENT"),
  requireSchool,
  requireHigherEd,
  getEnrollments
);

router.get(
  "/:id",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN", "STAFF", "DIRECTOR", "STUDENT"),
  requireSchool,
  requireHigherEd,
  getEnrollmentById
);

router.patch(
  "/:id/approve",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN", "STAFF"),
  requireSchool,
  requireHigherEd,
  approveEnrollment
);

router.patch(
  "/:id/reject",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN", "STAFF"),
  requireSchool,
  requireHigherEd,
  rejectEnrollment
);

router.patch(
  "/:id/cancel",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN", "STAFF", "STUDENT"),
  requireSchool,
  requireHigherEd,
  cancelEnrollment
);

module.exports = router;