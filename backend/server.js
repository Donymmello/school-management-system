const express = require("express");
const cors = require("cors");
const { sequelize } = require("./models");
const syncDatabase = require("./config/databaseSync");
require("dotenv").config();



const authRoutes = require('./routes/auth.routes');
const schoolRoutes = require('./routes/schools.routes');
const studentRoutes = require('./routes/students.routes');
const teacherRoutes = require('./routes/teachers.routes');
const staffRoutes = require('./routes/staff.routes');
const logAuditRoutes = require('./routes/logAudit.routes');
const subjectRoutes = require('./routes/subjects.routes');
const classroomRoutes = require('./routes/classrooms.routes');
const turmaRoutes = require('./routes/turmas.routes');
const turmaSubjectRoutes = require('./routes/turmaSubjects.routes');
const turmaScheduleRoutes = require('./routes/turmaSchedules.routes');
const courseRoutes = require('./routes/courses.routes');
const courseOfferingRoutes = require('./routes/courseOfferings.routes');
const enrollmentRoutes = require('./routes/enrollment.routes');
const courseOfferingSubjectRoutes = require('./routes/courseOfferingSubjects.routes');
const scheduleRoutes = require('./routes/schedules.routes');
const studentAssessmentRoutes = require('./routes/studentAssessments.routes');
const assessmentRoutes = require('./routes/assessments.routes');
const resultRoutes = require('./routes/results.routes');
const gradeRoutes = require('./routes/grades.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const academicPolicyRoutes = require('./routes/academicPolicies.routes');
const feeRoutes = require('./routes/fees.routes');
const feeWebhookRoutes = require('./routes/feeWebhook.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
//const emailRoutes = require('./routes/emails');

const app = express();
const PORT = process.env.PORT || 5000

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/schools', schoolRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/logs-audit', logAuditRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/classrooms', classroomRoutes);
app.use('/api/turmas', turmaRoutes);
app.use('/api/turma-subjects', turmaSubjectRoutes);
app.use('/api/turma-schedules', turmaScheduleRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/course-offerings', courseOfferingRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/course-offering-subjects', courseOfferingSubjectRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/student-assessments', studentAssessmentRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/academic-policies', academicPolicyRoutes);
app.use('/api/fees', feeRoutes);
// Sem authMiddleware (ver backend/controllers/feeWebhook.controller.js) —
// segredo compartilhado próprio via PAYMENT_WEBHOOK_SECRET, não JWT.
app.use('/api/fees-webhook', feeWebhookRoutes);
app.use('/api/dashboard', dashboardRoutes);
//app.use('/api/emails', emailRoutes);

async function startServer() {
  try {
    // Testa a ligação com a base de dados
    await sequelize.authenticate();
    console.log("PostgreSQL connected.");

    // Sincroniza os models com a base de dados. Quem decide SE e COMO é o
    // .env (DB_SYNC/DB_ALTER, ver config/databaseSync.js) — não mais um
    // sync({ alter: true }) fixo em todo boot. Motivo: no PostgreSQL ENUM é
    // um tipo de verdade (CREATE TYPE), não um modificador de coluna como no
    // MySQL, e `alter` repetido sobre as 21 colunas ENUM deste projeto é
    // ponto conhecido de atrito do Sequelize v6 (erro "type enum_... already
    // exists" e tipos órfãos). Com DB_ALTER=false o sync ainda cria o que
    // falta num banco vazio; mudança de schema em banco já populado pede
    // DB_ALTER=true pontual ou migration via sequelize-cli.
    await syncDatabase();

    // Inicia o servidor HTTP
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Error starting server:", error);
  }
}

startServer();
