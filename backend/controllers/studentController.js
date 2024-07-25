const Student = require('../models/student');

// Adicionar nota ao estudante
exports.addNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, score } = req.body;
    const student = await Student.findById(id);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    student.notes.push({ subject, score });
    await student.save();
    res.json(student);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Adicionar frequência ao estudante
exports.addAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, present } = req.body;
    const student = await Student.findById(id);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    student.attendance.push({ date, present });
    await student.save();
    res.json(student);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
