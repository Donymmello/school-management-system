const express = require('express');
const Teacher = require('../models/teacher');

const router = express.Router();

// Create teacher
router.post('/', async (req, res) => {
  const teacher = new Teacher(req.body);
  try {
    await teacher.save();
    res.status(201).send(teacher);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Get all teachers
router.get('/', async (req, res) => {
  try {
    const teachers = await Teacher.find();
    res.status(200).send(teachers);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Get teacher by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const teacher = await Teacher.findById(id);
    if (!teacher) return res.status(404).send();
    res.status(200).send(teacher);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Update teacher by ID
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const teacher = await Teacher.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!teacher) return res.status(404).send();
    res.status(200).send(teacher);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Delete teacher by ID
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const teacher = await Teacher.findByIdAndDelete(id);
    if (!teacher) return res.status(404).send();
    res.status(200).send(teacher);
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
