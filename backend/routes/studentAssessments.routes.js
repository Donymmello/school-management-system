const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

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
  recordScore
);

module.exports = router;