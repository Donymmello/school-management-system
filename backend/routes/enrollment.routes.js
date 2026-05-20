const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

const {
  enrollStudent,
  getEnrollments,
  getEnrollmentById,
  approveEnrollment,
  rejectEnrollment,
  cancelEnrollment,
} = require("../controllers/enrollment.controller");

router.post(
  "/",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN", "STAFF", "STUDENT"),
  enrollStudent
);

router.get(
  "/",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN", "STAFF", "DIRECTOR"),
  getEnrollments
);

router.get(
  "/:id",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN", "STAFF", "DIRECTOR", "STUDENT"),
  getEnrollmentById
);

router.patch(
  "/:id/approve",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN", "STAFF"),
  approveEnrollment
);

router.patch(
  "/:id/reject",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN", "STAFF"),
  rejectEnrollment
);

router.patch(
  "/:id/cancel",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN", "STAFF", "STUDENT"),
  cancelEnrollment
);

module.exports = router;