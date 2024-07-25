const express = require('express');
const router = express.Router();
const Grade = require('../models/grade');

router.post('/', async (req, res) => {
  const grade = new Grade(req.body);
  try {
    const savedGrade = await grade.save();
    res.status(201).send(savedGrade);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.get('/', async (req, res) => {
  try {
    const grades = await Grade.find();
    res.send(grades);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.get('/:id', async (req, res) => {
  try {
    const grade = await Grade.findById(req.params.id);
    if (!grade) {
      return res.status(404).send();
    }
    res.send(grade);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const grade = await Grade.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!grade) {
      return res.status(404).send();
    }
    res.send(grade);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const grade = await Grade.findByIdAndDelete(req.params.id);
    if (!grade) {
      return res.status(404).send();
    }
    res.send(grade);
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
