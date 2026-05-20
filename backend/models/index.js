const sequelize = require("../config/db");

const User = require("./user");
const Student = require("./student");
const Teacher = require("./teacher");
const Staff = require("./staff");
const Attendance = require("./attendance");
const Course = require("./course");
const CourseOffering = require("./courseOffering");
const Grade = require("./grade");
const Subject = require("./subject");
const Classroom = require("./classroom");
const LogAudit = require("./logAudit");

/*
  ================================
  USER RELATIONS
  ================================
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
  ================================
  STUDENT RELATIONS
  ================================
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

// Student N - 1 Course
Student.belongsTo(Course, {
  foreignKey: "courseId",
  as: "course",
});

Course.hasMany(Student, {
  foreignKey: "courseId",
  as: "students",
});

/*
  ================================
  TEACHER / SUBJECT / GRADE / COURSE
  ================================
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

// Subject 1 - N Grade
Subject.hasMany(Grade, {
  foreignKey: "subjectId",
  as: "grades",
});

Grade.belongsTo(Subject, {
  foreignKey: "subjectId",
  as: "subject",
});

// Subject 1 - N Course
Subject.hasMany(Course, {
  foreignKey: "subjectId",
  as: "courses",
});

Course.belongsTo(Subject, {
  foreignKey: "subjectId",
  as: "subject",
});

Course.hasMany(CourseOffering, {
  foreignKey: "courseId",
  as: "offerings",
});

CourseOffering.belongsTo(Course, {
  foreignKey: "courseId",
  as: "course",
});


/*
  ================================
  CLASSROOM
  ================================
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

/*
  ================================
  LOG AUDIT
  ================================
*/

User.hasMany(LogAudit, {
  foreignKey: "userId",
  as: "logs",
});

LogAudit.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

module.exports = {
  sequelize,
  User,
  Student,
  Teacher,
  Staff,
  Attendance,
  Grade,
  Subject,
  Classroom,
  LogAudit,
  Course,
  CourseOffering,
};