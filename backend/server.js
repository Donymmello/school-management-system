const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const studentRoutes = require('./routes/students');
const teacherRoutes = require('./routes/teachers');
const staffRoutes = require('./routes/staff');
const gradeRoutes = require('./routes/grades');
const attendanceRoutes = require('./routes/attendance');
const emailRoutes = require('./routes/emails');

const app = express();
const port = process.env.PORT || 5000;

mongoose.connect('mongodb://localhost:27017/school', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true
});

app.use(cors());
app.use(express.json());
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/emails', emailRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
