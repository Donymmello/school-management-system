const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

const {
    createSchedule,
    getAllSchedules,
    getScheduleById,
    updateSchedule,
    deleteSchedule,
} = require("../controllers/schedule.controller");

router.post(
    "/",
    authMiddleware,
    authorizeRoles(
        "SUPER_ADMIN",
        "ADMIN",
        "STAFF"
    ),
    createSchedule
);

router.get(
    "/",
    authMiddleware,
    getAllSchedules
);

router.get(
    "/:id",
    authMiddleware,
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
    updateSchedule
);

router.delete(
    "/:id",
    authMiddleware,
    authorizeRoles(
        "SUPER_ADMIN",
        "ADMIN",
    ),
    deleteSchedule
);

module.exports = router;