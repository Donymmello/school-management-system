const express = require("express");
const router = express.Router();

const authMiddleware =
  require("../middleware/auth.middleware");

const {
  getStudentResult,
} = require(
  "../controllers/result.controller"
);

router.get(
  "/:enrollmentId/:courseOfferingSubjectId",
  authMiddleware,
  getStudentResult
);

module.exports = router;