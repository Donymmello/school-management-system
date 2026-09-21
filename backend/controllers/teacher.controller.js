const {
  Teacher,
  User,
  School,
  Subject,
  CourseOfferingSubject,
  CourseOffering,
  Course,
  TurmaSubject,
  Turma,
} = require("../models");
const registerLogAudit = require("../utils/logAudit");
const { tenantWhere } = require("../utils/tenantScope");
const { isUniqueConstraintError, respondUniqueConstraint } = require("../utils/dbErrors");
const { resolveOwnTeacherId } = require("../utils/selfScope");
const logger = require("../utils/logger");

// Criação de professor passa por POST /api/auth/register-user (role TEACHER),
// igual ao padrão de Student — cria o User (login) e o Teacher juntos.

async function getAllTeachers(req, res) {
  try {
    const teachers = await Teacher.findAll({
      where: tenantWhere(req),
      include: [{ model: User, as: "user", required: false, attributes: ["id", "name", "email", "role", "active"] }],
      order: [["name", "ASC"]],
    });
    return res.status(200).json(teachers);
  } catch (error) {
    logger.requestError("[Error fetching teachers]", req, error);
    return res.status(500).json({ message: "An error occurred while fetching teachers." });
  }
}

async function getTeacherById(req, res) {
  try {
    const teacher = await Teacher.findOne({
      where: tenantWhere(req, { id: req.params.id }),
      include: [{ model: User, as: "user", required: false, attributes: ["id", "name", "email", "role", "active"] }],
    });

    if (!teacher) return res.status(404).json({ message: "Teacher not found." });
    return res.status(200).json(teacher);
  } catch (error) {
    logger.requestError("[Error fetching teacher]", req, error);
    return res.status(500).json({ message: "An error occurred while fetching the teacher." });
  }
}

async function updateTeacher(req, res) {
  try {
    const { id } = req.params;
    const teacher = await Teacher.findOne({ where: tenantWhere(req, { id }) });
    if (!teacher) return res.status(404).json({ message: "Teacher not found." });

    const { name, subject, email } = req.body;

    await teacher.update({
      name: name ?? teacher.name,
      subject: subject ?? teacher.subject,
      email: email ?? teacher.email,
    });

    await registerLogAudit({
      userId: req.user.id,
      action: "UPDATE",
      entity: "Teacher",
      entityId: teacher.id,
      description: `Updated teacher with ID ${teacher.id}`,
    });

    return res.status(200).json({ message: "Teacher updated successfully.", teacher });
  } catch (error) {
    if (isUniqueConstraintError(error)) return respondUniqueConstraint(res, error);
    logger.requestError("[Error updating teacher]", req, error);
    return res.status(500).json({ message: "An error occurred while updating the teacher." });
  }
}

async function deleteTeacher(req, res) {
  try {
    const teacher = await Teacher.findOne({ where: tenantWhere(req, { id: req.params.id }) });
    if (!teacher) return res.status(404).json({ message: "Teacher not found." });

    await teacher.destroy();

    await registerLogAudit({
      userId: req.user.id,
      action: "DELETE",
      entity: "Teacher",
      entityId: teacher.id,
      description: `Deleted teacher with ID ${teacher.id}`,
    });

    return res.status(200).json({ message: "Teacher deleted successfully." });
  } catch (error) {
    logger.requestError("[Error deleting teacher]", req, error);
    return res.status(500).json({ message: "An error occurred while deleting the teacher." });
  }
}

// Portal do Professor: "minhas disciplinas". Mesmo padrão do portal do aluno
// (student.controller.js getMyStudyPlan) — o isolamento vem de resolver o
// Teacher do próprio token em vez de aceitar um id pela URL, e o Teacher já
// está preso a uma escola pelo schoolId. Cada academicModel tem a sua tabela
// de vínculo: HIGHER_ED atribui professor em CourseOfferingSubject, SECONDARY
// em TurmaSubject.
async function getMySubjects(req, res) {
  try {
    const teacherId = await resolveOwnTeacherId(req);
    if (!teacherId) {
      return res.status(404).json({ message: "Teacher profile not found for this user." });
    }

    const teacher = await Teacher.findByPk(teacherId, {
      attributes: ["id"],
      include: [{ model: School, as: "school", attributes: ["academicModel"] }],
    });

    if (teacher?.school?.academicModel === "HIGHER_ED") {
      const assignments = await CourseOfferingSubject.findAll({
        where: { teacherId },
        include: [
          { model: Subject, as: "subject", attributes: ["id", "name"] },
          {
            model: CourseOffering,
            as: "courseOffering",
            attributes: ["id", "code"],
            include: [{ model: Course, as: "course", attributes: ["id", "displayName"] }],
          },
        ],
      });

      const items = assignments.map((assignment) => ({
        assignmentId: assignment.id,
        subjectId: assignment.subject?.id ?? null,
        subjectName: assignment.subject?.name || "—",
        weeklyHours: assignment.weeklyHours,
        status: assignment.status,
        context: assignment.courseOffering
          ? `${assignment.courseOffering.course?.displayName || ""} · ${assignment.courseOffering.code}`
          : null,
      }));

      return res.status(200).json({ academicModel: "HIGHER_ED", items });
    }

    // SECONDARY, e também o fallback para escola sem academicModel resolvido:
    // é o caminho que não depende de oferta/matrícula.
    const assignments = await TurmaSubject.findAll({
      where: { teacherId },
      include: [
        { model: Subject, as: "subject", attributes: ["id", "name"] },
        { model: Turma, as: "turma", attributes: ["id", "name", "grade"] },
      ],
    });

    const items = assignments.map((assignment) => ({
      assignmentId: assignment.id,
      subjectId: assignment.subject?.id ?? null,
      subjectName: assignment.subject?.name || "—",
      weeklyHours: assignment.weeklyHours,
      status: null,
      context: assignment.turma
        ? [assignment.turma.name, assignment.turma.grade].filter(Boolean).join(" · ")
        : null,
    }));

    return res.status(200).json({ academicModel: "SECONDARY", items });
  } catch (error) {
    logger.requestError("[Error fetching teacher subjects]", req, error);
    return res.status(500).json({ message: "An error occurred while fetching your subjects." });
  }
}

module.exports = {
  getAllTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
  getMySubjects,
};
