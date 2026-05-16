const { Student, User } = require("../models");
const generateStudentCode = require("../utils/generateStudentCode");
const registerLogAudit = require("../utils/logAudit");

// Listar todos os estudantes
async function getAllStudents(req, res) {
  try {
    const students = await Student.findAll({
      order: [["id", "DESC"]],
    });

    return res.status(200).json(students);
  } catch (error) {
    console.error("Error fetching students:", error);

    return res.status(500).json({
      message: "An error occurred while fetching students.",
      error: error.message,
    });
  }
}

// Buscar estudante por ID
async function getStudentById(req, res) {
  try {
    const { id } = req.params;

    const student = await Student.findByPk(id);

    if (!student) {
      return res.status(404).json({
        message: "Student not found.",
      });
    }

    return res.status(200).json(student);
  } catch (error) {
    console.error("Error fetching student:", error);

    return res.status(500).json({
      message: "An error occurred while fetching the student.",
      error: error.message,
    });
  }
}

// Atualizar estudante
async function updateStudent(req, res) {
  try {
    const { id } = req.params;

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

    const student = await Student.findByPk(id);

    if (!student) {
      return res.status(404).json({
        message: "Student not found.",
      });
    }

    if (userId) {
      const user = await User.findByPk(userId);

      if (!user) {
        return res.status(404).json({
          message: "User linked to this student was not found.",
        });
      }
    }

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

    return res.status(200).json({
      message: "Student updated successfully.",
      student,
    });
  } catch (error) {
    console.error("Error updating student:", error);

    return res.status(500).json({
      message: "An error occurred while updating the student.",
      error: error.message,
    });
  }
}

// Apagar estudante
async function deleteStudent(req, res) {
  try {
    const { id } = req.params;

    const student = await Student.findByPk(id);

    if (!student) {
      return res.status(404).json({
        message: "Student not found.",
      });
    }

    await student.destroy();

    return res.status(200).json({
      message: "Student deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting student:", error);

    return res.status(500).json({
      message: "An error occurred while deleting the student.",
      error: error.message,
    });
  }
}

module.exports = {
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
};