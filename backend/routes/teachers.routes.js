const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");
const requireSchool = require("../middleware/tenant.middleware");

const {
  getAllTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
  getMySubjects,
} = require("../controllers/teacher.controller");

const MANAGE_ROLES = ["SUPER_ADMIN", "ADMIN", "DIRECTOR", "STAFF"];
// TEACHER entra só na leitura: o formulário de notas precisa da lista para
// preencher o campo "professor". Editar e apagar continuam fora.
const READ_ROLES = [...MANAGE_ROLES, "TEACHER"];

// Antes de "/:id" por clareza. Sem requireSchool: o escopo é o próprio
// registo de Teacher resolvido pelo token, que já pertence a uma escola.
router.get("/me/subjects", authMiddleware, authorizeRoles("TEACHER"), getMySubjects);

router.get("/", authMiddleware, authorizeRoles(...READ_ROLES), requireSchool, getAllTeachers);
router.get("/:id", authMiddleware, authorizeRoles(...READ_ROLES), requireSchool, getTeacherById);
router.patch("/:id", authMiddleware, authorizeRoles(...MANAGE_ROLES), requireSchool, updateTeacher);
router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  requireSchool,
  deleteTeacher
);

module.exports = router;
