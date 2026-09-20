const sequelize = require("../config/db");

const User = require("./user");
const Student = require("./student");
const Teacher = require("./teacher");
const Staff = require("./staff");
const School = require("./school");
const PasswordResetToken = require("./passwordResetToken");

const Attendance = require("./attendance");
const Grade = require("./grade");
const Fee = require("./fee");
const Assessment = require("./assessment");
const StudentAssessment = require("./studentAssessment");
const AcademicPolicy = require("./academicPolicy");

const Subject = require("./subject");

const Course = require("./course");
const CourseOffering = require("./courseOffering");
const CourseOfferingSubject = require("./courseOfferingSubject");

const Enrollment = require("./enrollment");
const Schedule = require("./schedule");
const Classroom = require("./classroom");

const Turma = require("./turma");
const TurmaSubject = require("./turmaSubject");
const TurmaSchedule = require("./turmaSchedule");

const LogAudit = require("./logAudit");

/*
  ======================================================
  SCHOOL RELATIONS
  ======================================================
*/

// School 1 - N User
School.hasMany(User, {
  foreignKey: "schoolId",
  as: "users",
});

User.belongsTo(School, {
  foreignKey: "schoolId",
  as: "school",
});

// School 1 - N Student
School.hasMany(Student, { foreignKey: "schoolId", as: "students" });
Student.belongsTo(School, { foreignKey: "schoolId", as: "school" });

// School 1 - N Teacher
School.hasMany(Teacher, { foreignKey: "schoolId", as: "teachers" });
Teacher.belongsTo(School, { foreignKey: "schoolId", as: "school" });

// School 1 - N Staff
School.hasMany(Staff, { foreignKey: "schoolId", as: "staffMembers" });
Staff.belongsTo(School, { foreignKey: "schoolId", as: "school" });

// School 1 - N Course
School.hasMany(Course, { foreignKey: "schoolId", as: "courses" });
Course.belongsTo(School, { foreignKey: "schoolId", as: "school" });

// School 1 - N Classroom
School.hasMany(Classroom, { foreignKey: "schoolId", as: "classrooms" });
Classroom.belongsTo(School, { foreignKey: "schoolId", as: "school" });

// School 1 - N Subject
School.hasMany(Subject, { foreignKey: "schoolId", as: "subjects" });
Subject.belongsTo(School, { foreignKey: "schoolId", as: "school" });

// School 1 - N AcademicPolicy
School.hasMany(AcademicPolicy, { foreignKey: "schoolId", as: "academicPolicies" });
AcademicPolicy.belongsTo(School, { foreignKey: "schoolId", as: "school" });

// User 1 - N PasswordResetToken
User.hasMany(PasswordResetToken, {
  foreignKey: "userId",
  as: "passwordResetTokens",
});

PasswordResetToken.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

/*
  ======================================================
  USER RELATIONS
  ======================================================
*/

// User 1 - 1 Student
User.hasOne(Student, {
  foreignKey: "userId",
  as: "student",
});

Student.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

// User 1 - 1 Teacher
User.hasOne(Teacher, {
  foreignKey: "userId",
  as: "teacher",
});

Teacher.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

// User 1 - 1 Staff
User.hasOne(Staff, {
  foreignKey: "userId",
  as: "staff",
});

Staff.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

/*
  ======================================================
  USER ↔ ENROLLMENT APPROVALS
  ======================================================
*/

// User 1 - N Approved Enrollments
User.hasMany(Enrollment, {
  foreignKey: "approvedBy",
  as: "approvedEnrollments",
});

Enrollment.belongsTo(User, {
  foreignKey: "approvedBy",
  as: "approver",
});

/*
  ======================================================
  STUDENT RELATIONS
  ======================================================
*/

// Student 1 - N Attendance
Student.hasMany(Attendance, {
  foreignKey: "studentId",
  as: "attendanceRecords",
});

Attendance.belongsTo(Student, {
  foreignKey: "studentId",
  as: "student",
});

// Student 1 - N Grade
Student.hasMany(Grade, {
  foreignKey: "studentId",
  as: "grades",
});

Grade.belongsTo(Student, {
  foreignKey: "studentId",
  as: "student",
});

// Student 1 - N Fee
Student.hasMany(Fee, {
  foreignKey: "studentId",
  as: "fees",
});

Fee.belongsTo(Student, {
  foreignKey: "studentId",
  as: "student",
});

// Fee 1 - N confirmadas por User (Fase 8 — quem marcou como paga
// manualmente; null quando ainda pendente ou confirmada via webhook, ver
// backend/models/fee.js)
User.hasMany(Fee, { foreignKey: "confirmedById", as: "confirmedFees" });
Fee.belongsTo(User, { foreignKey: "confirmedById", as: "confirmedBy" });

/*
  ======================================================
  TEACHER RELATIONS
  ======================================================
*/

// Teacher 1 - N Grade
Teacher.hasMany(Grade, {
  foreignKey: "teacherId",
  as: "grades",
});

Grade.belongsTo(Teacher, {
  foreignKey: "teacherId",
  as: "teacher",
});

/*
  ======================================================
  SUBJECT RELATIONS
  ======================================================
*/

// Subject 1 - N Grade
Subject.hasMany(Grade, {
  foreignKey: "subjectId",
  as: "grades",
});

Grade.belongsTo(Subject, {
  foreignKey: "subjectId",
  as: "subject",
});

/*
  ======================================================
  COURSE ↔ SUBJECT
  ======================================================
*/

/*
  ======================================================
  COURSE ↔ COURSE OFFERING
  ======================================================
*/

// Course 1 - N CourseOffering
Course.hasMany(CourseOffering, {
  foreignKey: "courseId",
  as: "offerings",
});

CourseOffering.belongsTo(Course, {
  foreignKey: "courseId",
  as: "course",
});

CourseOffering.hasMany(CourseOfferingSubject, {
  foreignKey: "courseOfferingId",
  as: "subjects",
});

CourseOfferingSubject.belongsTo(CourseOffering, {
  foreignKey: "courseOfferingId",
  as: "courseOffering",
});

Subject.hasMany(CourseOfferingSubject, {
  foreignKey: "subjectId",
  as: "offerings",
});

CourseOfferingSubject.belongsTo(Subject, {
  foreignKey: "subjectId",
  as: "subject",
});

Teacher.hasMany(CourseOfferingSubject, {
  foreignKey: "teacherId",
  as: "assignedSubjects",
});

CourseOfferingSubject.belongsTo(Teacher, {
  foreignKey: "teacherId",
  as: "teacher",
});

CourseOfferingSubject.hasMany(Schedule, {
  foreignKey: "courseOfferingSubjectId",
  as: "schedules",
});

Schedule.belongsTo(CourseOfferingSubject, {
  foreignKey: "courseOfferingSubjectId",
  as: "courseOfferingSubject",
});

/*
  ======================================================
  ENROLLMENT RELATIONS
  ======================================================
*/

// Student 1 - N Enrollment
Student.hasMany(Enrollment, {
  foreignKey: "studentId",
  as: "enrollments",
});

Enrollment.belongsTo(Student, {
  foreignKey: "studentId",
  as: "student",
});

// CourseOffering 1 - N Enrollment
CourseOffering.hasMany(Enrollment, {
  foreignKey: "courseOfferingId",
  as: "enrollments",
});

Enrollment.belongsTo(CourseOffering, {
  foreignKey: "courseOfferingId",
  as: "courseOffering",
});

/*
  ======================================================
  CLASSROOM RELATIONS
  ======================================================
*/

// Classroom 1 - N Student
Classroom.hasMany(Student, {
  foreignKey: "classroomId",
  as: "students",
});

Student.belongsTo(Classroom, {
  foreignKey: "classroomId",
  as: "classroom",
});

Classroom.hasMany(Schedule, {
  foreignKey: "classroomId",
  as: "schedules",
});

Schedule.belongsTo(Classroom, {
  foreignKey: "classroomId",
  as: "classroom",
});

/*
  ======================================================
  TURMA RELATIONS (pedagógica, SECONDARY — ver backend/models/turma.js,
  não confundir com CLASSROOM acima, que é sala física)
  ======================================================
*/

// School 1 - N Turma
School.hasMany(Turma, { foreignKey: "schoolId", as: "turmas" });
Turma.belongsTo(School, { foreignKey: "schoolId", as: "school" });

// Turma 1 - N Student
Turma.hasMany(Student, { foreignKey: "turmaId", as: "students" });
Student.belongsTo(Turma, { foreignKey: "turmaId", as: "turma" });

// Turma opcionalmente aponta pra uma sala física "principal"
Classroom.hasMany(Turma, { foreignKey: "classroomId", as: "turmas" });
Turma.belongsTo(Classroom, { foreignKey: "classroomId", as: "classroom" });

// Turma 1 - N TurmaSubject (atribuição de disciplina+professor)
Turma.hasMany(TurmaSubject, { foreignKey: "turmaId", as: "subjects" });
TurmaSubject.belongsTo(Turma, { foreignKey: "turmaId", as: "turma" });

Subject.hasMany(TurmaSubject, { foreignKey: "subjectId", as: "turmaAssignments" });
TurmaSubject.belongsTo(Subject, { foreignKey: "subjectId", as: "subject" });

Teacher.hasMany(TurmaSubject, { foreignKey: "teacherId", as: "turmaAssignments" });
TurmaSubject.belongsTo(Teacher, { foreignKey: "teacherId", as: "teacher" });

// TurmaSubject 1 - N TurmaSchedule (horário, Fase 9a — "Meu horário" pro
// SECONDARY, espelha CourseOfferingSubject -> Schedule do HIGHER_ED)
TurmaSubject.hasMany(TurmaSchedule, { foreignKey: "turmaSubjectId", as: "schedules" });
TurmaSchedule.belongsTo(TurmaSubject, { foreignKey: "turmaSubjectId", as: "turmaSubject" });

Classroom.hasMany(TurmaSchedule, { foreignKey: "classroomId", as: "turmaSchedules" });
TurmaSchedule.belongsTo(Classroom, { foreignKey: "classroomId", as: "classroom" });

/*
  ======================================================
  ASSESSMENT RELATIONS
  ======================================================
*/
CourseOfferingSubject.hasMany(
  Assessment,
  {
    foreignKey:
      "courseOfferingSubjectId",
    as: "assessments",
  }
);

Assessment.belongsTo(
  CourseOfferingSubject,
  {
    foreignKey:
      "courseOfferingSubjectId",
    as: "courseOfferingSubject",
  }
);

Assessment.hasMany(
  StudentAssessment,
  {
    foreignKey: "assessmentId",
    as: "results",
  }
);

StudentAssessment.belongsTo(
  Assessment,
  {
    foreignKey: "assessmentId",
    as: "assessment",
  }
);

Enrollment.hasMany(
  StudentAssessment,
  {
    foreignKey: "enrollmentId",
    as: "assessments",
  }
);

StudentAssessment.belongsTo(
  Enrollment,
  {
    foreignKey: "enrollmentId",
    as: "enrollment",
  }
);

/*
  ======================================================
  LOG AUDIT RELATIONS
  ======================================================
*/

// User 1 - N Audit Logs
User.hasMany(LogAudit, {
  foreignKey: "userId",
  as: "logs",
});

LogAudit.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

/*
  ======================================================
  EXPORTS
  ======================================================
*/

/*
  ASSOCIAÇÕES REMOVIDAS (nenhum controller as usava, nenhuma linha preenchida):

  - Student ↔ Course (`Student.courseId`). O vínculo real de um aluno a um
    curso é Enrollment -> CourseOffering -> Course. Já estava assinalada como
    morta num comentário em controllers/student.controller.js.
  - Course ↔ Subject (`Subject.courseId`). Redundante por desenho: uma
    disciplina liga-se a um curso via CourseOfferingSubject, que é a relação
    muitos-para-muitos de verdade.
  - Classroom ↔ CourseOfferingSubject (`CourseOfferingSubject.classroomId`).
    A sala pertence ao Schedule, não à disciplina: a mesma disciplina dá-se em
    salas diferentes conforme o horário.

  As três denunciavam-se pela coluna em camelCase (`"courseId"`,
  `"classroomId"`): o foreignKey era declarado aqui sem o atributo
  correspondente no modelo, e sem `field:` o Sequelize usa o nome tal e qual
  como nome de coluna. Ver docs/project-rules.md, secção 5.
*/

module.exports = {
  sequelize,

  User,
  Student,
  Teacher,
  Staff,
  School,
  PasswordResetToken,

  Attendance,
  Grade,
  Fee,

  Subject,
  Assessment,
  StudentAssessment,
  AcademicPolicy,

  Course,
  CourseOffering,
  CourseOfferingSubject,
  Schedule,
  Enrollment,

  Classroom,

  Turma,
  TurmaSubject,
  TurmaSchedule,

  LogAudit,
};