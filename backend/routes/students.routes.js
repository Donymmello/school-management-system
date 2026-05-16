const express = require('express');
const router = express.Router();


const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");


const {
  createStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
} = require('../controllers/student.controller');

router.post(
  '/',
  authMiddleware,
  authorizeRoles("ADMIN", "DIRETOR"),
   createStudent
  );

router.get(
  '/', 
  authMiddleware,
  authorizeRoles("ADMIN", "DIRETOR"),
  getAllStudents
);
router.get(
  '/:id', 
  authMiddleware,
  authorizeRoles("ADMIN", "DIRETOR"),
  getStudentById
);
router.patch(
  '/:id', 
  authMiddleware,
  authorizeRoles("ADMIN", "DIRETOR"),
  updateStudent
);
router.delete(
  '/:id', 
  authMiddleware,
  authorizeRoles("ADMIN", "DIRETOR"),
  deleteStudent
);

module.exports = router;
