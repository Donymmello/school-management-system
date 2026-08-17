const express = require('express');
const router = express.Router();


const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");
const requireSchool = require("../middleware/tenant.middleware");


const {
  getAllStudents,
  getStudentById,
  getMyProfile,
  updateStudent,
  deleteStudent,
} = require('../controllers/student.controller');

router.get(
  '/',
  authMiddleware,
  authorizeRoles("SUPER_ADMIN", "ADMIN", "DIRECTOR"),
  requireSchool,
  getAllStudents
);
// Precisa vir antes de "/:id" — senão o Express casaria "me" como :id.
router.get('/me', authMiddleware, authorizeRoles("STUDENT"), getMyProfile);
router.get(
  '/:id',
  authMiddleware,
  authorizeRoles("SUPER_ADMIN", "ADMIN", "DIRECTOR"),
  requireSchool,
  getStudentById
);
router.patch(
  '/:id',
  authMiddleware,
  authorizeRoles("SUPER_ADMIN", "ADMIN", "DIRECTOR"),
  requireSchool,
  updateStudent
);
router.delete(
  '/:id',
  authMiddleware,
  authorizeRoles("SUPER_ADMIN", "ADMIN", "DIRECTOR"),
  requireSchool,
  deleteStudent
);

module.exports = router;
