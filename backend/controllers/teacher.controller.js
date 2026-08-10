const { Teacher, User } = require("../models");
const registerLogAudit = require("../utils/logAudit");
const { tenantWhere } = require("../utils/tenantScope");
const { isUniqueConstraintError, respondUniqueConstraint } = require("../utils/dbErrors");

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
    console.error("[Error fetching teachers]:", error);
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
    console.error("[Error fetching teacher]:", error);
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
    console.error("[Error updating teacher]:", error);
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
    console.error("[Error deleting teacher]:", error);
    return res.status(500).json({ message: "An error occurred while deleting the teacher." });
  }
}

module.exports = {
  getAllTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
};
