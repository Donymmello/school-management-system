const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");
const requireSchool = require("../middleware/tenant.middleware");
const requireAcademicModel = require("../middleware/academicModel.middleware");

const {
  createAssessment,
  getAssessments,
} = require("../controllers/assessment.controller");

const requireHigherEd = requireAcademicModel("HIGHER_ED");

router.post(
  "/",
  authMiddleware,
  authorizeRoles(
    "ADMIN",
    "SUPER_ADMIN",
    "TEACHER"
  ),
  requireSchool,
  requireHigherEd,
  createAssessment
);

router.get(
  "/",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN", "TEACHER", "DIRECTOR", "SECRETARY", "STUDENT"),
  requireSchool,
  requireHigherEd,
  getAssessments
);

module.exports = router;