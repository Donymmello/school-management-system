const { Student, User } = require("../models");
const generateStudentCode = require("../utils/generateStudentCod");

// Criar estudante internamente: ADMIN / DIRETOR
async function createStudent(req, res) {
  try {
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

    if (!name || !email) {
      return res.status(400).json({
        message: "Name and email are required.",
      });
    }

    // Verifica se já existe estudante com o mesmo email
    const existingStudentByEmail = await Student.findOne({
      where: { email },
    });

    if (existingStudentByEmail) {
      return res.status(409).json({
        message: "A student with this email already exists.",
      });
    }

    // Verifica BI, se for enviado
    if (idNumber) {
      const existingStudentByIdNumber = await Student.findOne({
        where: { idNumber },
      });

      if (existingStudentByIdNumber) {
        return res.status(409).json({
          message: "A student with this ID number already exists.",
        });
      }
    }

    // Se vier userId, confirma se o User existe
    if (userId) {
      const user = await User.findByPk(userId);

      if (!user) {
        return res.status(404).json({
          message: "User linked to this student was not found.",
        });
      }
    }

    const studentCode = generateStudentCod();

    const student = await Student.create({
      studentCode,
      name,
      age: age || null,
      grade: grade || null,
      email,
      telephone: telephone || null,
      idCard: idCard || null,
      idNumber: idNumber || null,
      notes: notes || [],
      userId: userId || null,
    });

    return res.status(201).json({
      message: "Student created successfully.",
      student,
    });
  } catch (error) {
    console.error("Error creating student:", error);

    return res.status(500).json({
      message: "An error occurred while creating the student.",
      error: error.message,
    });
  }
}

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
  createStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
};