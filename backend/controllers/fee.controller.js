const { Fee, Student, School } = require("../models");
const registerLogAudit = require("../utils/logAudit");
const { tenantWhere } = require("../utils/tenantScope");
const { resolveOwnStudentId } = require("../utils/selfScope");
const { validateAmount, validateCurrency } = require("../utils/validators");

// Fee não tem schoolId próprio (ver docs/project-rules.md, seção 5) — o
// isolamento por escola é feito via join obrigatório no Student dono do
// registro, mesmo padrão de Grade/Attendance.
function studentScope(req, extra = {}) {
  return {
    model: Student,
    as: "student",
    required: true,
    where: tenantWhere(req, extra),
    attributes: ["id", "name", "studentCode"],
  };
}

async function createFee(req, res) {
  try {
    const { studentId, description, amount, dueDate, currency, notes } = req.body;

    if (!studentId || !description || amount === undefined || !dueDate) {
      return res.status(400).json({
        message: "studentId, description, amount and dueDate are required.",
      });
    }

    const amountCheck = validateAmount(amount);
    if (amountCheck.error) return res.status(400).json({ message: amountCheck.error });

    let currencyValue;
    if (currency !== undefined) {
      const currencyCheck = validateCurrency(currency);
      if (currencyCheck.error) return res.status(400).json({ message: currencyCheck.error });
      currencyValue = currencyCheck.value;
    }

    // Busca o Student junto com a School dona pra validar o tenant e, se o
    // caller não mandou currency, herdar a moeda configurada na escola
    // (ver docs/project-rules.md, seção 6, item 5).
    const student = await Student.findOne({
      where: tenantWhere(req, { id: studentId }),
      attributes: ["id"],
      include: [{ model: School, as: "school", attributes: ["currency"] }],
    });
    if (!student) return res.status(404).json({ message: "Student not found in this school." });

    const fee = await Fee.create({
      studentId,
      description,
      amount: amountCheck.value,
      dueDate,
      currency: currencyValue || student.school?.currency || "AOA",
      notes: notes || null,
    });

    await registerLogAudit({
      userId: req.user.id,
      action: "CREATE",
      entity: "Fee",
      entityId: fee.id,
      description: `Recorded fee "${description}" (${amount}) for student ${studentId}, due ${dueDate}.`,
    });

    return res.status(201).json({ message: "Fee recorded successfully.", fee });
  } catch (error) {
    console.error("[Error creating fee]:", error);
    return res.status(500).json({ message: "An error occurred while recording the fee." });
  }
}

async function getAllFees(req, res) {
  try {
    const { studentId, status } = req.query;
    const where = {};

    // Portal do aluno: ignora studentId da query e força o próprio registro
    // (mesmo padrão de Grades/Attendance — ver docs/project-rules.md, seção
    // 6, item 5).
    if (req.user.role === "STUDENT") {
      const ownStudentId = await resolveOwnStudentId(req);
      if (!ownStudentId) return res.status(403).json({ message: "Student profile not found for this user." });
      where.studentId = ownStudentId;
    } else if (studentId) {
      where.studentId = studentId;
    }

    if (status) where.status = status;

    const fees = await Fee.findAll({
      where,
      include: [studentScope(req)],
      order: [["due_date", "ASC"]],
    });

    return res.status(200).json(fees);
  } catch (error) {
    console.error("[Error fetching fees]:", error);
    return res.status(500).json({ message: "An error occurred while fetching fees." });
  }
}

async function getFeeById(req, res) {
  try {
    const fee = await Fee.findOne({
      where: { id: req.params.id },
      include: [studentScope(req)],
    });

    if (!fee) return res.status(404).json({ message: "Fee not found." });
    return res.status(200).json(fee);
  } catch (error) {
    console.error("[Error fetching fee]:", error);
    return res.status(500).json({ message: "An error occurred while fetching the fee." });
  }
}

async function updateFee(req, res) {
  try {
    const { description, amount, dueDate, notes } = req.body;

    let amountValue;
    if (amount !== undefined) {
      const amountCheck = validateAmount(amount);
      if (amountCheck.error) return res.status(400).json({ message: amountCheck.error });
      amountValue = amountCheck.value;
    }

    const fee = await Fee.findOne({
      where: { id: req.params.id },
      include: [studentScope(req)],
    });
    if (!fee) return res.status(404).json({ message: "Fee not found." });

    await fee.update({
      description: description ?? fee.description,
      amount: amountValue ?? fee.amount,
      dueDate: dueDate ?? fee.dueDate,
      notes: notes ?? fee.notes,
    });

    return res.status(200).json({ message: "Fee updated successfully.", fee });
  } catch (error) {
    console.error("[Error updating fee]:", error);
    return res.status(500).json({ message: "An error occurred while updating the fee." });
  }
}

// Marca como paga/pendente — endpoint separado do update genérico porque é
// a ação mais comum do STAFF aqui (ledger manual, sem gateway — ver
// docs/project-rules.md, seção 6, item 5) e não deveria exigir description
// nem amount no body.
async function markFeeStatus(req, res) {
  try {
    const { status } = req.body;
    if (!["PENDING", "PAID"].includes(status)) {
      return res.status(400).json({ message: "status must be PENDING or PAID." });
    }

    const fee = await Fee.findOne({
      where: { id: req.params.id },
      include: [studentScope(req)],
    });
    if (!fee) return res.status(404).json({ message: "Fee not found." });

    await fee.update({
      status,
      paidAt: status === "PAID" ? new Date() : null,
    });

    await registerLogAudit({
      userId: req.user.id,
      action: "UPDATE",
      entity: "Fee",
      entityId: fee.id,
      description: `Marked fee ${fee.id} as ${status}.`,
    });

    return res.status(200).json({ message: "Fee status updated successfully.", fee });
  } catch (error) {
    console.error("[Error updating fee status]:", error);
    return res.status(500).json({ message: "An error occurred while updating the fee status." });
  }
}

async function deleteFee(req, res) {
  try {
    const fee = await Fee.findOne({
      where: { id: req.params.id },
      include: [studentScope(req)],
    });
    if (!fee) return res.status(404).json({ message: "Fee not found." });

    await fee.destroy();
    return res.status(200).json({ message: "Fee deleted successfully." });
  } catch (error) {
    console.error("[Error deleting fee]:", error);
    return res.status(500).json({ message: "An error occurred while deleting the fee." });
  }
}

module.exports = {
  createFee,
  getAllFees,
  getFeeById,
  updateFee,
  markFeeStatus,
  deleteFee,
};
