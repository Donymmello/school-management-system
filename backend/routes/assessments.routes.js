const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

const {
  createAssessment,
  getAssessments,
} = require("../controllers/assessment.controller");

router.post(
  "/",
  authMiddleware,
  authorizeRoles(
    "ADMIN",
    "SUPER_ADMIN",
    "TEACHER"
  ),
  createAssessment
);

router.get(
  "/",
  authMiddleware,
  getAssessments
);

module.exports = router;