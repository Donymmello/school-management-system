const sequelize = require("../config/db");

const User = require("./user");
const Student = require("./student");
const Teacher = require("./teacher");
const Staff = require("./staff");

const Attendance = require("./attendance");
const Grade = require("./grade");
const Assessment = require("./assessment");
const StudentAssessment = require("./studentAssessment");

const Subject = require("./subject");

const Course = require("./course");
const CourseOffering = require("./courseOffering");
const CourseOfferingSubject = require("./courseOfferingSubject");

const Enrollment = require("./enrollment");
const Schedule = require("./schedule");
const Classroom = require("./classroom");

const LogAudit = require("./logAudit");

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

// Course 1 - N Subject
Course.hasMany(Subject, {
  foreignKey: "courseId",
  as: "subjects",
});

Subject.belongsTo(Course, {
  foreignKey: "courseId",
  as: "course",
});

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

Classroom.hasMany(CourseOfferingSubject, {
  foreignKey: "classroomId",
  as: "scheduledSubjects",
});

CourseOfferingSubject.belongsTo(Classroom, {
  foreignKey: "classroomId",
  as: "classroom",
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

module.exports = {
  sequelize,

  User,
  Student,
  Teacher,
  Staff,

  Attendance,
  Grade,

  Subject,
  Assessment,
  StudentAssessment,

  Course,
  CourseOffering,
  CourseOfferingSubject,
  Schedule,
  Enrollment,

  Classroom,

  LogAudit,
};