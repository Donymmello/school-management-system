const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  grade: { type: String, required: true },
  email: { type: String, required: true },
  notes: [{ subject: String, score: Number }],
  attendance: [{ date: Date, present: Boolean }]
});

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;
