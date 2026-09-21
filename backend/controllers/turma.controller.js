const { Turma, Classroom, TurmaSubject, Student } = require("../models");
const { tenantWhere } = require("../utils/tenantScope");
const { isUniqueConstraintError, respondUniqueConstraint } = require("../utils/dbErrors");
const registerLogAudit = require("../utils/logAudit");
const logger = require("../utils/logger");

async function validateClassroom(req, classroomId) {
  if (!classroomId) return true;
  const classroom = await Classroom.findOne({ where: tenantWhere(req, { id: classroomId }) });
  return Boolean(classroom);
}

async function createTurma(req, res) {
  try {
    const { name, grade, classroomId, academicYear, active } = req.body;

    if (!req.schoolId) {
      return res.status(400).json({ message: "schoolId is required to create a turma." });
    }

    if (!name) {
      return res.status(400).json({ message: "Turma name is required." });
    }

    if (classroomId && !(await validateClassroom(req, classroomId))) {
      return res.status(404).json({ message: "Classroom not found in this school." });
    }

    const turma = await Turma.create({
      schoolId: req.schoolId,
      name,
      grade: grade || null,
      classroomId: classroomId || null,
      academicYear: academicYear || null,
      active: active ?? true,
    });

    await registerLogAudit({
      userId: req.user.id,
      action: "CREATE",
      entity: "Turma",
      entityId: turma.id,
      description: `Created turma "${turma.name}".`,
    });

    return res.status(201).json({ message: "Turma created successfully.", turma });
  } catch (error) {
    if (isUniqueConstraintError(error)) return respondUniqueConstraint(res, error);
    logger.requestError("[Error creating turma]", req, error);
    return res.status(500).json({ message: "An error occurred while creating the turma." });
  }
}

async function getAllTurmas(req, res) {
  try {
    const { active } = req.query;
    const where = {};
    if (active !== undefined) where.active = active === "true";

    const turmas = await Turma.findAll({
      where: tenantWhere(req, where),
      include: [{ model: Classroom, as: "classroom", attributes: ["id", "name"] }],
      order: [["name", "ASC"]],
    });

    return res.status(200).json(turmas);
  } catch (error) {
    logger.requestError("[Error fetching turmas]", req, error);
    return res.status(500).json({ message: "An error occurred while fetching turmas." });
  }
}

async function getTurmaById(req, res) {
  try {
    const turma = await Turma.findOne({
      where: tenantWhere(req, { id: req.params.id }),
      include: [{ model: Classroom, as: "classroom", attributes: ["id", "name"] }],
    });

    if (!turma) return res.status(404).json({ message: "Turma not found." });
    return res.status(200).json(turma);
  } catch (error) {
    logger.requestError("[Error fetching turma]", req, error);
    return res.status(500).json({ message: "An error occurred while fetching the turma." });
  }
}

async function updateTurma(req, res) {
  try {
    const turma = await Turma.findOne({ where: tenantWhere(req, { id: req.params.id }) });
    if (!turma) return res.status(404).json({ message: "Turma not found." });

    const { name, grade, classroomId, academicYear, active } = req.body;

    if ("classroomId" in req.body && classroomId && !(await validateClassroom(req, classroomId))) {
      return res.status(404).json({ message: "Classroom not found in this school." });
    }

    // "campo ?? turma.campo" trataria null explícito (ex: desvincular a
    // sala) como "não informado" e manteria o valor antigo — mesma
    // armadilha corrigida em courseOfferingSubject.controller.js (ver
    // docs/project-rules.md, seção 6). Aqui já nasce certo, checando
    // presença da chave em vez de usar "??" pros campos anuláveis.
    await turma.update({
      name: name ?? turma.name,
      grade: "grade" in req.body ? grade : turma.grade,
      classroomId: "classroomId" in req.body ? classroomId : turma.classroomId,
      academicYear: "academicYear" in req.body ? academicYear : turma.academicYear,
      active: active ?? turma.active,
    });

    await registerLogAudit({
      userId: req.user.id,
      action: "UPDATE",
      entity: "Turma",
      entityId: turma.id,
      description: `Updated turma "${turma.name}".`,
    });

    return res.status(200).json({ message: "Turma updated successfully.", turma });
  } catch (error) {
    if (isUniqueConstraintError(error)) return respondUniqueConstraint(res, error);
    logger.requestError("[Error updating turma]", req, error);
    return res.status(500).json({ message: "An error occurred while updating the turma." });
  }
}

async function deleteTurma(req, res) {
  try {
    const turma = await Turma.findOne({ where: tenantWhere(req, { id: req.params.id }) });
    if (!turma) return res.status(404).json({ message: "Turma not found." });

    // Sem CASCADE configurado — apagar uma turma com alunos ou disciplinas
    // atribuídas quebraria com erro de constraint cru. Mesmo padrão do
    // deleteAssessment (ver assessment.controller.js).
    const [studentsCount, subjectsCount] = await Promise.all([
      Student.count({ where: { turmaId: turma.id } }),
      TurmaSubject.count({ where: { turmaId: turma.id } }),
    ]);

    if (studentsCount > 0 || subjectsCount > 0) {
      return res.status(409).json({
        message: "Cannot delete a turma that has students or subjects assigned to it.",
      });
    }

    await turma.destroy();

    await registerLogAudit({
      userId: req.user.id,
      action: "DELETE",
      entity: "Turma",
      entityId: turma.id,
      description: `Deleted turma "${turma.name}".`,
    });

    return res.status(200).json({ message: "Turma deleted successfully." });
  } catch (error) {
    logger.requestError("[Error deleting turma]", req, error);
    return res.status(500).json({ message: "An error occurred while deleting the turma." });
  }
}

module.exports = {
  createTurma,
  getAllTurmas,
  getTurmaById,
  updateTurma,
  deleteTurma,
};
