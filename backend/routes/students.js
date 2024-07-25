const express = require('express');
const router = express.Router();
const {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  addNote,
  addAttendance
} = require('../controllers/studentController');

router.post('/', createStudent);
router.get('/', getStudents);
router.get('/:id', getStudentById);
router.patch('/:id', updateStudent);
router.delete('/:id', deleteStudent);
router.post('/:id/notes', addNote);
router.post('/:id/attendance', addAttendance);

module.exports = router;
