const express = require('express');
const router = express.Router();


const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");


const {
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
} = require('../controllers/student.controller');

router.get(
  '/', 
  authMiddleware,
  authorizeRoles("ADMIN", "DIRECTOR"),
  getAllStudents
);
router.get(
  '/:id', 
  authMiddleware,
  authorizeRoles("ADMIN", "DIRECTOR"),
  getStudentById
);
router.patch(
  '/:id', 
  authMiddleware,
  authorizeRoles("ADMIN", "DIRECTOR"),
  updateStudent
);
router.delete(
  '/:id', 
  authMiddleware,
  authorizeRoles("ADMIN", "DIRECTOR"),
  deleteStudent
);

module.exports = router;
