const express = require('express');
const sendEmail = require('../utils/email');

const router = express.Router();

router.post('/send', async (req, res) => {
  const { to, subject, text } = req.body;

  try {
    await sendEmail(to, subject, text);
    res.status(200).send('Email sent successfully');
  } catch (error) {
    res.status(500).send('Failed to send email');
  }
});

module.exports = router;
