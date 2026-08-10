const { Grade, Student, Teacher, Subject } = require("../models");
const registerLogAudit = require("../utils/logAudit");
const { tenantWhere } = require("../utils/tenantScope");
const { isUniqueConstraintError, respondUniqueConstraint } = require("../utils/dbErrors");

// Grade não tem schoolId próprio (ver docs/project-rules.md, seção 5) — o
// isolamento por escola é feito via join obrigatório no Student dono do
// registro, igual ao Attendance.
function studentScope(req, extra = {}) {
  return {
    model: Student,
    as: "student",
    required: true,
    where: tenantWhere(req, extra),
    attributes: ["id", "name", "studentCode"],
  };
}

const commonIncludes = (req) => [
  studentScope(req),
  { model: Teacher, as: "teacher", attributes: ["id", "name"] },
  { model: Subject, as: "subject", attributes: ["id", "name", "code"] },
];

async function validateRelations(req, { studentId, teacherId, subjectId }) {
  const [student, teacher, subject] = await Promise.all([
    Student.findOne({ where: tenantWhere(req, { id: studentId }), attributes: ["id"] }),
    Teacher.findOne({ where: tenantWhere(req, { id: teacherId }), attributes: ["id"] }),
    Subject.findOne({ where: tenantWhere(req, { id: subjectId }), attributes: ["id"] }),
  ]);

  if (!student) return "Student not found in this school.";
  if (!teacher) return "Teacher not found in this school.";
  if (!subject) return "Subject not found in this school.";
  return null;
}

async function createGrade(req, res) {
  try {
    const { studentId, teacherId, subjectId, score, term } = req.body;

    if (!studentId || !teacherId || !subjectId || score === undefined || !term) {
      return res.status(400).json({
        message: "studentId, teacherId, subjectId, score and term are required.",
      });
    }

    const relationError = await validateRelations(req, { studentId, teacherId, subjectId });
    if (relationError) return res.status(404).json({ message: relationError });

    const grade = await Grade.create({ studentId, teacherId, subjectId, score, term });

    await registerLogAudit({
      userId: req.user.id,
      action: "CREATE",
      entity: "Grade",
      entityId: grade.id,
      description: `Recorded grade ${score} for student ${studentId} (${term}).`,
    });

    return res.status(201).json({ message: "Grade recorded successfully.", grade });
  } catch (error) {
    if (isUniqueConstraintError(error)) return respondUniqueConstraint(res, error);
    console.error("[Error creating grade]:", error);
    return res.status(500).json({ message: "An error occurred while recording the grade." });
  }
}

async function getAllGrades(req, res) {
  try {
    const { studentId, subjectId, term } = req.query;
    const where = {};
    if (studentId) where.studentId = studentId;
    if (subjectId) where.subjectId = subjectId;
    if (term) where.term = term;

    const grades = await Grade.findAll({
      where,
      include: commonIncludes(req),
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json(grades);
  } catch (error) {
    console.error("[Error fetching grades]:", error);
    return res.status(500).json({ message: "An error occurred while fetching grades." });
  }
}

async function getGradeById(req, res) {
  try {
    const grade = await Grade.findOne({
      where: { id: req.params.id },
      include: commonIncludes(req),
    });

    if (!grade) return res.status(404).json({ message: "Grade not found." });
    return res.status(200).json(grade);
  } catch (error) {
    console.error("[Error fetching grade]:", error);
    return res.status(500).json({ message: "An error occurred while fetching the grade." });
  }
}

async function updateGrade(req, res) {
  try {
    const { score, term } = req.body;

    const grade = await Grade.findOne({
      where: { id: req.params.id },
      include: [studentScope(req)],
    });
    if (!grade) return res.status(404).json({ message: "Grade not found." });

    await grade.update({
      score: score ?? grade.score,
      term: term ?? grade.term,
    });

    return res.status(200).json({ message: "Grade updated successfully.", grade });
  } catch (error) {
    if (isUniqueConstraintError(error)) return respondUniqueConstraint(res, error);
    console.error("[Error updating grade]:", error);
    return res.status(500).json({ message: "An error occurred while updating the grade." });
  }
}

async function deleteGrade(req, res) {
  try {
    const grade = await Grade.findOne({
      where: { id: req.params.id },
      include: [studentScope(req)],
    });
    if (!grade) return res.status(404).json({ message: "Grade not found." });

    await grade.destroy();
    return res.status(200).json({ message: "Grade deleted successfully." });
  } catch (error) {
    console.error("[Error deleting grade]:", error);
    return res.status(500).json({ message: "An error occurred while deleting the grade." });
  }
}

module.exports = {
  createGrade,
  getAllGrades,
  getGradeById,
  updateGrade,
  deleteGrade,
};
