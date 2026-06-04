const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth.middleware');
const authorizeRoles = require('../middleware/role.middleware');

const {
    createCourseOfferingSubject,
    getAllCourseOfferingSubjects,
    getCourseOfferingSubjectById,
    updateCourseOfferingSubject,
} = require('../controllers/courseOfferingSubject.controller');

router.post(
    '/',
    authMiddleware,
    authorizeRoles('ADMIN', 'SUPER_ADMIN', 'STAFF'),
    createCourseOfferingSubject
);

router.get(
    '/',
    authMiddleware,
    getAllCourseOfferingSubjects
);

router.get(
    '/:id',
    authMiddleware,
    getCourseOfferingSubjectById
);

router.put(
    '/:id',
    authMiddleware,
    authorizeRoles('ADMIN', 'SUPER_ADMIN', 'STAFF'),
    updateCourseOfferingSubject
);

module.exports = router;