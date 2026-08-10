const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");
const requireSchool = require("../middleware/tenant.middleware");
const requireAcademicModel = require("../middleware/academicModel.middleware");

const {
  recordScore,
} = require("../controllers/studentAssessment.controller");

router.post(
  "/",
  authMiddleware,
  authorizeRoles(
    "ADMIN",
    "SUPER_ADMIN",
    "TEACHER"
  ),
  requireSchool,
  requireAcademicModel("HIGHER_ED"),
  recordScore
);

module.exports = router;