const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const emailRoutes = require('./routes/email');
const studentRoutes = require('./routes/students');
const teacherRoutes = require('./routes/teachers');
const staffRoutes = require('./routes/staff');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB connected');
}).catch(err => {
  console.error(err);
});

// Routes
app.use('/api/email', emailRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/staff', staffRoutes);

app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Start Server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
