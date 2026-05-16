const express = require('express');
const Staff = require('../models/staff');

const router = express.Router();

// Create staff
router.post('/', async (req, res) => {
  const staff = new Staff(req.body);
  try {
    await staff.save();
    res.status(201).send(staff);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Get all staff
router.get('/', async (req, res) => {
  try {
    const staff = await Staff.find();
    res.status(200).send(staff);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Get staff by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const staff = await Staff.findById(id);
    if (!staff) return res.status(404).send();
    res.status(200).send(staff);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Update staff by ID
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const staff = await Staff.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!staff) return res.status(404).send();
    res.status(200).send(staff);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Delete staff by ID
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const staff = await Staff.findByIdAndDelete(id);
    if (!staff) return res.status(404).send();
    res.status(200).send(staff);
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
