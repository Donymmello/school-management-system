const { Op } = require("sequelize");
const { TurmaSchedule, TurmaSubject, Turma, Classroom, Subject, Teacher, Student } = require("../models");
const { tenantWhere } = require("../utils/tenantScope");

// Horário de Turma (Fase 9a, ver docs/project-rules.md, seção 6) — espelha
// backend/controllers/schedule.controller.js (HIGHER_ED), adaptado pro
// lado SECONDARY. TurmaSchedule não tem schoolId próprio — isolamento via
// join obrigatório em TurmaSubject -> Turma.
function turmaSubjectScope(req, turmaSubjectIds) {
  return {
    model: TurmaSubject,
    as: "turmaSubject",
    required: true,
    where: turmaSubjectIds ? { id: { [Op.in]: turmaSubjectIds } } : undefined,
    include: [
      { model: Turma, as: "turma", required: true, where: tenantWhere(req), attributes: ["id", "name", "grade"] },
      { model: Subject, as: "subject", attributes: ["id", "name"], required: false },
      { model: Teacher, as: "teacher", attributes: ["id", "name"], required: false },
    ],
  };
}

// Um STUDENT só deve ver o horário da própria turma. Devolve a lista de
// turmaSubjectId da turma do aluno, ou [] se não tiver turma atribuída
// ainda (sem matrícula em turma = sem horário pra mostrar).
async function studentTurmaSubjectIds(req) {
  const student = await Student.findOne({ where: { userId: req.user.id }, attributes: ["id", "turmaId"] });
  if (!student || !student.turmaId) return [];

  const assignments = await TurmaSubject.findAll({
    where: { turmaId: student.turmaId },
    attributes: ["id"],
  });
  return assignments.map((a) => a.id);
}

async function validateTurmaSubject(req, turmaSubjectId) {
  return TurmaSubject.findOne({
    where: { id: turmaSubjectId },
    include: [{ model: Turma, as: "turma", required: true, where: tenantWhere(req) }],
  });
}

async function createTurmaSchedule(req, res) {
  try {
    const { turmaSubjectId, classroomId, dayOfWeek, startTime, endTime } = req.body;

    if (!turmaSubjectId || !classroomId || !dayOfWeek || !startTime || !endTime) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (startTime >= endTime) {
      return res.status(400).json({ message: "End time must be greater than start time." });
    }

    const turmaSubject = await validateTurmaSubject(req, turmaSubjectId);
    if (!turmaSubject) {
      return res.status(404).json({ message: "Turma subject not found in this school" });
    }

    const classroom = await Classroom.findOne({ where: tenantWhere(req, { id: classroomId }) });
    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found in this school" });
    }

    // Checa conflito só dentro de TurmaSchedule — uma escola opera num só
    // academicModel (ver School.academicModel, imutável), então as salas
    // dela nunca são compartilhadas entre Schedule (HIGHER_ED) e
    // TurmaSchedule (SECONDARY) ao mesmo tempo.
    const classroomConflict = await TurmaSchedule.findOne({
      where: {
        classroomId,
        dayOfWeek,
        startTime: { [Op.lt]: endTime },
        endTime: { [Op.gt]: startTime },
      },
    });

    if (classroomConflict) {
      return res.status(400).json({ message: "Classroom is already booked for the selected time slot." });
    }

    const schedule = await TurmaSchedule.create({ turmaSubjectId, classroomId, dayOfWeek, startTime, endTime });

    return res.status(201).json({ message: "Schedule created successfully", schedule });
  } catch (error) {
    console.error("[Error creating turma schedule]:", error);
    return res.status(500).json({ message: "An error occurred while creating the schedule." });
  }
}

async function getAllTurmaSchedules(req, res) {
  try {
    const { turmaSubjectId } = req.query;

    let turmaSubjectIds;
    if (req.user.role === "STUDENT") {
      turmaSubjectIds = await studentTurmaSubjectIds(req);
      if (turmaSubjectIds.length === 0) return res.status(200).json([]);
    } else if (turmaSubjectId) {
      turmaSubjectIds = [turmaSubjectId];
    }

    const schedules = await TurmaSchedule.findAll({
      where: req.user.role === "STUDENT" ? { status: "ACTIVE" } : undefined,
      include: [turmaSubjectScope(req, turmaSubjectIds), { association: "classroom" }],
    });

    return res.status(200).json(schedules);
  } catch (error) {
    console.error("[Error fetching turma schedules]:", error);
    return res.status(500).json({ message: "An error occurred while fetching schedules." });
  }
}

async function getTurmaScheduleById(req, res) {
  try {
    let turmaSubjectIds;
    if (req.user.role === "STUDENT") {
      turmaSubjectIds = await studentTurmaSubjectIds(req);
      if (turmaSubjectIds.length === 0) return res.status(404).json({ message: "Schedule not found" });
    }

    const schedule = await TurmaSchedule.findOne({
      where: { id: req.params.id },
      include: [turmaSubjectScope(req, turmaSubjectIds), { association: "classroom" }],
    });

    if (!schedule) return res.status(404).json({ message: "Schedule not found" });
    return res.status(200).json(schedule);
  } catch (error) {
    console.error("[Error fetching turma schedule]:", error);
    return res.status(500).json({ message: "An error occurred while fetching the schedule." });
  }
}

async function updateTurmaSchedule(req, res) {
  try {
    const schedule = await TurmaSchedule.findOne({
      where: { id: req.params.id },
      include: [turmaSubjectScope(req)],
    });
    if (!schedule) return res.status(404).json({ message: "Schedule not found" });

    const { classroomId, dayOfWeek, startTime, endTime, status } = req.body;

    if (classroomId) {
      const classroom = await Classroom.findOne({ where: tenantWhere(req, { id: classroomId }) });
      if (!classroom) return res.status(404).json({ message: "Classroom not found in this school" });
    }

    await schedule.update({
      // "in req.body" em vez de "??": classroomId precisa poder virar null
      // de propósito (aula sem sala fixa) sem o "??" ignorar o null
      // silenciosamente (mesmo cuidado do resto do sistema, ver
      // docs/project-rules.md, seção 6).
      classroomId: "classroomId" in req.body ? classroomId : schedule.classroomId,
      dayOfWeek: dayOfWeek ?? schedule.dayOfWeek,
      startTime: startTime ?? schedule.startTime,
      endTime: endTime ?? schedule.endTime,
      status: status ?? schedule.status,
    });

    return res.status(200).json({ message: "Schedule updated successfully", schedule });
  } catch (error) {
    console.error("[Error updating turma schedule]:", error);
    return res.status(500).json({ message: "An error occurred while updating the schedule." });
  }
}

async function deleteTurmaSchedule(req, res) {
  try {
    const schedule = await TurmaSchedule.findOne({
      where: { id: req.params.id },
      include: [turmaSubjectScope(req)],
    });
    if (!schedule) return res.status(404).json({ message: "Schedule not found" });

    await schedule.destroy();
    return res.status(200).json({ message: "Schedule deleted successfully" });
  } catch (error) {
    console.error("[Error deleting turma schedule]:", error);
    return res.status(500).json({ message: "An error occurred while deleting the schedule." });
  }
}

module.exports = {
  createTurmaSchedule,
  getAllTurmaSchedules,
  getTurmaScheduleById,
  updateTurmaSchedule,
  deleteTurmaSchedule,
};
