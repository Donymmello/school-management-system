const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

const {
  createCourseOffering,
  getAllCourseOfferings,
  getCourseOfferingById,
  updateCourseOffering,
  deactivateCourseOffering,
} = require("../controllers/courseOffering.controller");

router.post(
  "/",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN", "STAFF"),
  createCourseOffering
);

router.get(
  "/",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN", "STAFF", "DIRECTOR", "TEACHER", "STUDENT"),
  getAllCourseOfferings
);

router.get(
  "/:id",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN", "STAFF", "DIRECTOR", "TEACHER", "STUDENT"),
  getCourseOfferingById
);

router.patch(
  "/:id",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN", "STAFF"),
  updateCourseOffering
);

router.patch(
  "/:id/deactivate",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN", "STAFF"),
  deactivateCourseOffering
);

module.exports = router;