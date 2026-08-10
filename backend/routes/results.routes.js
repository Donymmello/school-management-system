const express = require("express");
const router = express.Router();

const authMiddleware =
  require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");
const requireSchool = require("../middleware/tenant.middleware");
const requireAcademicModel = require("../middleware/academicModel.middleware");

const {
  getStudentResult,
} = require(
  "../controllers/result.controller"
);

router.get(
  "/:enrollmentId/:courseOfferingSubjectId",
  authMiddleware,
  authorizeRoles("SUPER_ADMIN", "ADMIN", "DIRECTOR", "SECRETARY", "TEACHER", "STUDENT"),
  requireSchool,
  requireAcademicModel("HIGHER_ED"),
  getStudentResult
);

module.exports = router;