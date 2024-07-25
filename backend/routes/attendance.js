const express = require('express');
const router = express.Router();
const Attendance = require('../models/attendance');

router.post('/', async (req, res) => {
  const attendance = new Attendance(req.body);
  try {
    const savedAttendance = await attendance.save();
    res.status(201).send(savedAttendance);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.get('/', async (req, res) => {
  try {
    const attendanceRecords = await Attendance.find();
    res.send(attendanceRecords);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.get('/:id', async (req, res) => {
  try {
    const attendanceRecord = await Attendance.findById(req.params.id);
    if (!attendanceRecord) {
      return res.status(404).send();
    }
    res.send(attendanceRecord);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const attendanceRecord = await Attendance.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!attendanceRecord) {
      return res.status(404).send();
    }
    res.send(attendanceRecord);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const attendanceRecord = await Attendance.findByIdAndDelete(req.params.id);
    if (!attendanceRecord) {
      return res.status(404).send();
    }
    res.send(attendanceRecord);
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
