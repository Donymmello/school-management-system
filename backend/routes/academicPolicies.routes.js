const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");
const requireSchool = require("../middleware/tenant.middleware");
const requireAcademicModel = require("../middleware/academicModel.middleware");

const { getActivePolicy, updateActivePolicy } = require("../controllers/academicPolicy.controller");

const MANAGE_ROLES = ["SUPER_ADMIN", "ADMIN"];
const requireHigherEd = requireAcademicModel("HIGHER_ED");

router.get("/active", authMiddleware, authorizeRoles(...MANAGE_ROLES, "DIRECTOR", "STAFF", "TEACHER"), requireSchool, requireHigherEd, getActivePolicy);
router.patch("/active", authMiddleware, authorizeRoles(...MANAGE_ROLES), requireSchool, requireHigherEd, updateActivePolicy);

module.exports = router;
