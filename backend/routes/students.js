const express = require('express');
const Student = require('../models/student');

const router = express.Router();

// Create student
router.post('/', async (req, res) => {
  const student = new Student(req.body);
  try {
    await student.save();
    res.status(201).send(student);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Get all students
router.get('/', async (req, res) => {
  try {
    const students = await Student.find();
    res.status(200).send(students);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Get student by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const student = await Student.findById(id);
    if (!student) return res.status(404).send();
    res.status(200).send(student);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Update student by ID
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const student = await Student.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!student) return res.status(404).send();
    res.status(200).send(student);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Delete student by ID
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const student = await Student.findByIdAndDelete(id);
    if (!student) return res.status(404).send();
    res.status(200).send(student);
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
