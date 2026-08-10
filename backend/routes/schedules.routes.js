const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");
const requireSchool = require("../middleware/tenant.middleware");
const requireAcademicModel = require("../middleware/academicModel.middleware");

const {
    createSchedule,
    getAllSchedules,
    getScheduleById,
    updateSchedule,
    deleteSchedule,
} = require("../controllers/schedule.controller");

const READ_ROLES = ["SUPER_ADMIN", "ADMIN", "STAFF", "DIRECTOR", "TEACHER", "STUDENT"];
const requireHigherEd = requireAcademicModel("HIGHER_ED");

router.post(
    "/",
    authMiddleware,
    authorizeRoles(
        "SUPER_ADMIN",
        "ADMIN",
        "STAFF"
    ),
    requireSchool,
    requireHigherEd,
    createSchedule
);

router.get(
    "/",
    authMiddleware,
    authorizeRoles(...READ_ROLES),
    requireSchool,
    requireHigherEd,
    getAllSchedules
);

router.get(
    "/:id",
    authMiddleware,
    authorizeRoles(...READ_ROLES),
    requireSchool,
    requireHigherEd,
    getScheduleById
);

router.put(
    "/:id",
    authMiddleware,
    authorizeRoles(
        "SUPER_ADMIN",
        "ADMIN",
        "STAFF"
    ),
    requireSchool,
    requireHigherEd,
    updateSchedule
);

router.delete(
    "/:id",
    authMiddleware,
    authorizeRoles(
        "SUPER_ADMIN",
        "ADMIN",
    ),
    requireSchool,
    requireHigherEd,
    deleteSchedule
);

module.exports = router;