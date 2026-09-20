const express = require('express');
const router = express.Router();


const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");
const requireSchool = require("../middleware/tenant.middleware");


const {
  getAllStudents,
  getStudentById,
  getMyProfile,
  getMyStudyPlan,
  getMyAcademicStatus,
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
// Precisam vir antes de "/:id" — senão o Express casaria "me"/"me" como :id.
router.get('/me', authMiddleware, authorizeRoles("STUDENT"), getMyProfile);
// Fase 9c — "Meu plano de estudos" (ver docs/project-rules.md, seção 6).
router.get('/me/study-plan', authMiddleware, authorizeRoles("STUDENT"), getMyStudyPlan);
// Fase 9d — "Minha situação curricular" (ver docs/project-rules.md, seção 6).
router.get('/me/academic-status', authMiddleware, authorizeRoles("STUDENT"), getMyAcademicStatus);
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
