const { Attendance, Student } = require("../models");
const registerLogAudit = require("../utils/logAudit");
const { tenantWhere } = require("../utils/tenantScope");
const { isUniqueConstraintError, respondUniqueConstraint } = require("../utils/dbErrors");

const ALLOWED_STATUSES = ["PRESENT", "ABSENT", "LATE", "JUSTIFIED"];

// Attendance não tem schoolId próprio (ver docs/project-rules.md, seção 5) —
// o isolamento por escola é feito via join obrigatório no Student dono do
// registro. `studentScope` também serve pra confirmar que o studentId
// informado pertence à escola de quem está fazendo a chamada.
function studentScope(req, extra = {}) {
  return {
    model: Student,
    as: "student",
    required: true,
    where: tenantWhere(req, extra),
    attributes: ["id", "name", "studentCode"],
  };
}

async function createAttendance(req, res) {
  try {
    const { studentId, date, status } = req.body;

    if (!studentId || !date) {
      return res.status(400).json({ message: "studentId and date are required." });
    }

    if (status && !ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ message: "Invalid status.", allowedStatuses: ALLOWED_STATUSES });
    }

    const student = await Student.findOne({ where: tenantWhere(req, { id: studentId }), attributes: ["id"] });
    if (!student) {
      return res.status(404).json({ message: "Student not found in this school." });
    }

    const attendance = await Attendance.create({
      studentId,
      date,
      status: status || "PRESENT",
    });

    await registerLogAudit({
      userId: req.user.id,
      action: "CREATE",
      entity: "Attendance",
      entityId: attendance.id,
      description: `Recorded attendance for student ${studentId} on ${date}.`,
    });

    return res.status(201).json({ message: "Attendance recorded successfully.", attendance });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return res.status(409).json({ message: "Attendance for this student on this date already exists." });
    }
    console.error("[Error creating attendance]:", error);
    return res.status(500).json({ message: "An error occurred while recording attendance." });
  }
}

async function getAllAttendance(req, res) {
  try {
    const { studentId, date } = req.query;
    const where = {};
    if (studentId) where.studentId = studentId;
    if (date) where.date = date;

    const records = await Attendance.findAll({
      where,
      include: [studentScope(req)],
      order: [["date", "DESC"]],
    });

    return res.status(200).json(records);
  } catch (error) {
    console.error("[Error fetching attendance]:", error);
    return res.status(500).json({ message: "An error occurred while fetching attendance." });
  }
}

async function getAttendanceById(req, res) {
  try {
    const record = await Attendance.findOne({
      where: { id: req.params.id },
      include: [studentScope(req)],
    });

    if (!record) return res.status(404).json({ message: "Attendance record not found." });
    return res.status(200).json(record);
  } catch (error) {
    console.error("[Error fetching attendance record]:", error);
    return res.status(500).json({ message: "An error occurred while fetching the attendance record." });
  }
}

async function updateAttendance(req, res) {
  try {
    const { status, date } = req.body;

    if (status && !ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ message: "Invalid status.", allowedStatuses: ALLOWED_STATUSES });
    }

    const record = await Attendance.findOne({
      where: { id: req.params.id },
      include: [studentScope(req)],
    });
    if (!record) return res.status(404).json({ message: "Attendance record not found." });

    await record.update({
      status: status ?? record.status,
      date: date ?? record.date,
    });

    return res.status(200).json({ message: "Attendance updated successfully.", attendance: record });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return res.status(409).json({ message: "Attendance for this student on this date already exists." });
    }
    console.error("[Error updating attendance]:", error);
    return res.status(500).json({ message: "An error occurred while updating attendance." });
  }
}

async function deleteAttendance(req, res) {
  try {
    const record = await Attendance.findOne({
      where: { id: req.params.id },
      include: [studentScope(req)],
    });
    if (!record) return res.status(404).json({ message: "Attendance record not found." });

    await record.destroy();
    return res.status(200).json({ message: "Attendance record deleted successfully." });
  } catch (error) {
    console.error("[Error deleting attendance]:", error);
    return res.status(500).json({ message: "An error occurred while deleting the attendance record." });
  }
}

module.exports = {
  createAttendance,
  getAllAttendance,
  getAttendanceById,
  updateAttendance,
  deleteAttendance,
};
