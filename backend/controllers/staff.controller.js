const { Staff, User } = require("../models");
const registerLogAudit = require("../utils/logAudit");
const { tenantWhere } = require("../utils/tenantScope");
const { isUniqueConstraintError, respondUniqueConstraint } = require("../utils/dbErrors");

// Criação de colaborador passa por POST /api/auth/register-user (role STAFF),
// igual ao padrão de Student/Teacher — cria o User (login) e o Staff juntos.

async function getAllStaff(req, res) {
  try {
    const staff = await Staff.findAll({
      where: tenantWhere(req),
      include: [{ model: User, as: "user", required: false, attributes: ["id", "name", "email", "role", "active"] }],
      order: [["name", "ASC"]],
    });
    return res.status(200).json(staff);
  } catch (error) {
    console.error("[Error fetching staff]:", error);
    return res.status(500).json({ message: "An error occurred while fetching staff." });
  }
}

async function getStaffById(req, res) {
  try {
    const staff = await Staff.findOne({
      where: tenantWhere(req, { id: req.params.id }),
      include: [{ model: User, as: "user", required: false, attributes: ["id", "name", "email", "role", "active"] }],
    });

    if (!staff) return res.status(404).json({ message: "Staff member not found." });
    return res.status(200).json(staff);
  } catch (error) {
    console.error("[Error fetching staff member]:", error);
    return res.status(500).json({ message: "An error occurred while fetching the staff member." });
  }
}

async function updateStaff(req, res) {
  try {
    const { id } = req.params;
    const staff = await Staff.findOne({ where: tenantWhere(req, { id }) });
    if (!staff) return res.status(404).json({ message: "Staff member not found." });

    const { name, position, department, email } = req.body;

    await staff.update({
      name: name ?? staff.name,
      position: position ?? staff.position,
      department: department ?? staff.department,
      email: email ?? staff.email,
    });

    await registerLogAudit({
      userId: req.user.id,
      action: "UPDATE",
      entity: "Staff",
      entityId: staff.id,
      description: `Updated staff member with ID ${staff.id}`,
    });

    return res.status(200).json({ message: "Staff member updated successfully.", staff });
  } catch (error) {
    if (isUniqueConstraintError(error)) return respondUniqueConstraint(res, error);
    console.error("[Error updating staff member]:", error);
    return res.status(500).json({ message: "An error occurred while updating the staff member." });
  }
}

async function deleteStaff(req, res) {
  try {
    const staff = await Staff.findOne({ where: tenantWhere(req, { id: req.params.id }) });
    if (!staff) return res.status(404).json({ message: "Staff member not found." });

    await staff.destroy();

    await registerLogAudit({
      userId: req.user.id,
      action: "DELETE",
      entity: "Staff",
      entityId: staff.id,
      description: `Deleted staff member with ID ${staff.id}`,
    });

    return res.status(200).json({ message: "Staff member deleted successfully." });
  } catch (error) {
    console.error("[Error deleting staff member]:", error);
    return res.status(500).json({ message: "An error occurred while deleting the staff member." });
  }
}

module.exports = {
  getAllStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
};
