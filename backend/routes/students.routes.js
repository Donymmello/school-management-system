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

// TEACHER e STAFF leem, mas não escrevem. Sem isto não conseguiam escolher o
// aluno ao lançar nota ou frequência — operações que grades.routes.js e
// attendance.routes.js já lhes permitiam. Alterar e apagar continuam restritos.
const READ_ROLES = ["SUPER_ADMIN", "ADMIN", "DIRECTOR", "STAFF", "TEACHER"];
const WRITE_ROLES = ["SUPER_ADMIN", "ADMIN", "DIRECTOR"];

router.get(
  '/',
  authMiddleware,
  authorizeRoles(...READ_ROLES),
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
  authorizeRoles(...READ_ROLES),
  requireSchool,
  getStudentById
);
router.patch(
  '/:id',
  authMiddleware,
  authorizeRoles(...WRITE_ROLES),
  requireSchool,
  updateStudent
);
router.delete(
  '/:id',
  authMiddleware,
  authorizeRoles(...WRITE_ROLES),
  requireSchool,
  deleteStudent
);

module.exports = router;
