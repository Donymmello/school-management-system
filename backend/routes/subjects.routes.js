const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");
const requireSchool = require("../middleware/tenant.middleware");

const {
  createSubject,
  getAllSubjects,
  getSubjectById,
  updateSubject,
  deactivateSubject,
  deleteSubject,
} = require("../controllers/subject.controller");

router.post(
  "/",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN"),
  requireSchool,
  createSubject
);

router.get(
  "/",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN", "DIRECTOR", "STAFF", "TEACHER"),
  requireSchool,
  getAllSubjects
);

router.get(
  "/:id",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN", "DIRECTOR", "STAFF", "TEACHER"),
  requireSchool,
  getSubjectById
);

router.patch(
  "/:id",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN"),
  requireSchool,
  updateSubject
);

router.patch(
  "/:id/deactivate",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN"),
  requireSchool,
  deactivateSubject
);

router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  requireSchool,
  deleteSubject
);

module.exports = router;
