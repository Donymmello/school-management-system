const { TurmaSubject, Turma, Subject, Teacher } = require("../models");
const { tenantWhere } = require("../utils/tenantScope");
const { isUniqueConstraintError, respondUniqueConstraint } = require("../utils/dbErrors");

// TurmaSubject não tem schoolId próprio — o isolamento por escola é feito
// via join obrigatório no Turma dono do registro (turmaId nunca é nulo),
// mesmo padrão de CourseOfferingSubject pro lado HIGHER_ED.
function turmaScope(req) {
  return { model: Turma, as: "turma", required: true, where: tenantWhere(req) };
}

async function createTurmaSubject(req, res) {
  try {
    const { turmaId, subjectId, teacherId, weeklyHours } = req.body;

    if (!turmaId || !subjectId) {
      return res.status(400).json({ message: "turmaId and subjectId are required." });
    }

    const turma = await Turma.findOne({ where: tenantWhere(req, { id: turmaId }) });
    if (!turma) return res.status(404).json({ message: "Turma not found in this school." });

    const subject = await Subject.findOne({ where: tenantWhere(req, { id: subjectId }) });
    if (!subject) return res.status(404).json({ message: "Subject not found in this school." });

    if (teacherId) {
      const teacher = await Teacher.findOne({ where: tenantWhere(req, { id: teacherId }) });
      if (!teacher) return res.status(404).json({ message: "Teacher not found in this school." });
    }

    const turmaSubject = await TurmaSubject.create({
      turmaId,
      subjectId,
      teacherId: teacherId || null,
      weeklyHours: weeklyHours || 2,
    });

    return res.status(201).json({
      message: "Subject assigned to turma successfully.",
      data: turmaSubject,
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) return respondUniqueConstraint(res, error);
    console.error("[Error creating turma subject]:", error);
    return res.status(500).json({ message: "An error occurred while assigning the subject to the turma." });
  }
}

async function getAllTurmaSubjects(req, res) {
  try {
    const { turmaId } = req.query;
    const where = {};
    if (turmaId) where.turmaId = turmaId;

    const data = await TurmaSubject.findAll({
      where,
      include: [
        turmaScope(req),
        { model: Subject, as: "subject" },
        { model: Teacher, as: "teacher" },
      ],
    });

    return res.status(200).json(data);
  } catch (error) {
    console.error("[Error fetching turma subjects]:", error);
    return res.status(500).json({ message: "An error occurred while fetching turma subjects." });
  }
}

async function updateTurmaSubject(req, res) {
  try {
    const item = await TurmaSubject.findOne({
      where: { id: req.params.id },
      include: [turmaScope(req)],
    });

    if (!item) return res.status(404).json({ message: "Turma subject not found." });

    const { teacherId, weeklyHours } = req.body;

    if ("teacherId" in req.body && teacherId) {
      const teacher = await Teacher.findOne({ where: tenantWhere(req, { id: teacherId }) });
      if (!teacher) return res.status(404).json({ message: "Teacher not found in this school." });
    }

    await item.update({
      teacherId: "teacherId" in req.body ? teacherId : item.teacherId,
      weeklyHours: weeklyHours ?? item.weeklyHours,
    });

    return res.status(200).json({ message: "Turma subject updated successfully.", data: item });
  } catch (error) {
    if (isUniqueConstraintError(error)) return respondUniqueConstraint(res, error);
    console.error("[Error updating turma subject]:", error);
    return res.status(500).json({ message: "An error occurred while updating the turma subject." });
  }
}

async function deleteTurmaSubject(req, res) {
  try {
    const item = await TurmaSubject.findOne({
      where: { id: req.params.id },
      include: [turmaScope(req)],
    });

    if (!item) return res.status(404).json({ message: "Turma subject not found." });

    await item.destroy();
    return res.status(200).json({ message: "Turma subject removed successfully." });
  } catch (error) {
    console.error("[Error deleting turma subject]:", error);
    return res.status(500).json({ message: "An error occurred while removing the turma subject." });
  }
}

module.exports = {
  createTurmaSubject,
  getAllTurmaSubjects,
  updateTurmaSubject,
  deleteTurmaSubject,
};
