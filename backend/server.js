const express = require("express");
const cors = require("cors");
const { sequelize } = require("./models");
require("dotenv").config();



const studentRoutes = require('./routes/students.routes');
const authRoutes = require('./routes/auth.routes');
//const teacherRoutes = require('./routes/teachers');
/////const staffRoutes = require('./routes/staff');
///const gradeRoutes = require('./routes/grades');
//const attendanceRoutes = require('./routes/attendance');
//const emailRoutes = require('./routes/emails');

const app = express();
const PORT = process.env.PORT || 5000

app.use(cors());
app.use(express.json());
app.use('/api/students', studentRoutes);
app.use('/api/auth', authRoutes);
////app.use('/api/teachers', teacherRoutes);
//app.use('/api/staff', staffRoutes);
//app.use('/api/grades', gradeRoutes);
///app.use('/api/attendance', attendanceRoutes);
//app.use('/api/emails', emailRoutes);

async function startServer() {
  try {
    // Testa a ligação com a base de dados
    await sequelize.authenticate();
    console.log("MySQL connected.");

    // Sincroniza os models com a base de dados
    await sequelize.sync({ alter: true });
    console.log("Models synchronized.");

    // Inicia o servidor HTTP
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Error starting server:", error);
  }
}

startServer();
