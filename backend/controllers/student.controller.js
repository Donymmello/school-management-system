const { Op } = require("sequelize");
const { Student, User } = require("../models");
const registerLogAudit = require("../utils/logAudit");

async function validateStudentData({ idNumber, userId, studentId = null }) {
  if (idNumber) {
    const conflictDoc = await Student.findOne({
      where: {
        idNumber,
        ...(studentId && { id: { [Op.ne]: studentId } })
      },
      attributes: ['id']
    });
    if (conflictDoc) throw new Error("A student with this ID number already exists.");
  }

  if (userId) {
    const user = await User.findByPk(userId, { attributes: ['id', 'role'] });
    if (!user) throw new Error("The user linked to this student was not found.");
    if (user.role !== "STUDENT") throw new Error("The linked user must have the role of STUDENT.");

    const conflictUser = await Student.findOne({
      where: {
        userId,
        ...(studentId && { id: { [Op.ne]: studentId } })
      },
      attributes: ['id']
    });
    if (conflictUser) throw new Error("This user is already linked to another student.");
  }
}

function errorTreatment(res, error, standardMessage) {
  const map = {
    "A student with this ID number already exists.": { status: 400, message: error.message },
    "The user linked to this student was not found.": { status: 404, message: error.message },
    "The linked user must have the role of STUDENT.": { status: 400, message: error.message },
    "This user is already linked to another student.": { status: 400, message: error.message },
  };

  const knownError = map[error.message];
  if (knownError) {
    return res.status(knownError.status).json({ message: knownError.message });
  }

  console.error('[Error]: ${standardMessage}', error);
  return res.status(500).json({ message: standardMessage });
}


// Listar todos os estudantes
async function getAllStudents(req, res) {
  try {
    const students = await Student.findAll({
      include: [{ model: User, as: "user", required: false, attributes: ["id", "name", "email", "role", "active"] }],
      order: [["id", "DESC"]],
    });
    return res.status(200).json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    return res.status(500).json({
      message: "An error occurred while fetching students." });
  }
}

// Buscar estudante por ID
async function getStudentById(req, res) {
  try {
    const student = await Student.findByPk(req.params.id, {
      include: [{ model: User, as: "user", required: false, attributes: ["id", "name", "email", "role", "active"] }],
    });

    if (!student) return res.status(404).json({ message: "Student not found." });
    return res.status(200).json(student);
  } catch (error) {
    console.error("[Error fetching student]:", error);
    return res.status(500).json({ message: "An error occurred while fetching the student." });
  }
}

// Atualizar estudante
async function updateStudent(req, res) {
  try {
    const { id } = req.params;
    const student = await Student.findByPk(id);
    if (!student) return res.status(404).json({ message: "Student not found." });
    

    const {
      name,
      age,
      grade,
      email,
      telephone,
      idCard,
      idNumber,
      notes,
      userId,
    } = req.body;

    await validateStudentData({
      idNumber: idNumber !== undefined ? idNumber : student.idNumber,
      userId: userId !== undefined ? userId : student.userId,
      studentId: student.id,
    });

    await student.update({
      name: name ?? student.name,
      age: age ?? student.age,
      grade: grade ?? student.grade,
      email: email ?? student.email,
      telephone: telephone ?? student.telephone,
      idCard: idCard ?? student.idCard,
      idNumber: idNumber ?? student.idNumber,
      notes: notes ?? student.notes,
      userId: userId ?? student.userId,
    });

    await registerLogAudit({
      userId: req.user.id,
      action: "UPDATE",
      entity: "Student",
      entityId: student.id,
      description: `Updated student with ID ${student.id}`,
    });

    return res.status(200).json({ message: "Student updated successfully.", student});
  } catch (error) {
    return errorTreatment(res, error, "An error occurred while updating the student.");
  }
}

// Apagar estudante
async function deleteStudent(req, res) {
  try {
    
    const student = await Student.findByPk(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found." });
    
    await student.destroy();

    await registerLogAudit({
      userId: req.user.id,
      action: "DELETE",
      entity: "Student",
      entityId: student.id,
      description: `Deleted student with ID ${student.id}`,
    });

    return res.status(200).json({ message: "Student deleted successfully." });
  } catch (error) {
    console.error("[Error deleting student]:", error);
    return res.status(500).json({ message: "An error occurred while deleting the student." });
  }
}

module.exports = {
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
};