const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth.middleware');
const authorizeRoles = require('../middleware/role.middleware');
const requireSchool = require('../middleware/tenant.middleware');
const requireAcademicModel = require('../middleware/academicModel.middleware');

const {
    createCourseOfferingSubject,
    getAllCourseOfferingSubjects,
    getCourseOfferingSubjectById,
    updateCourseOfferingSubject,
} = require('../controllers/courseOfferingSubject.controller');

const READ_ROLES = ['SUPER_ADMIN', 'ADMIN', 'STAFF', 'DIRECTOR', 'TEACHER', 'STUDENT'];
const requireHigherEd = requireAcademicModel('HIGHER_ED');

router.post(
    '/',
    authMiddleware,
    authorizeRoles('ADMIN', 'SUPER_ADMIN', 'STAFF'),
    requireSchool,
    requireHigherEd,
    createCourseOfferingSubject
);

router.get(
    '/',
    authMiddleware,
    authorizeRoles(...READ_ROLES),
    requireSchool,
    requireHigherEd,
    getAllCourseOfferingSubjects
);

router.get(
    '/:id',
    authMiddleware,
    authorizeRoles(...READ_ROLES),
    requireSchool,
    requireHigherEd,
    getCourseOfferingSubjectById
);

router.put(
    '/:id',
    authMiddleware,
    authorizeRoles('ADMIN', 'SUPER_ADMIN', 'STAFF'),
    requireSchool,
    requireHigherEd,
    updateCourseOfferingSubject
);

module.exports = router;