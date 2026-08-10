const { AcademicPolicy } = require("../models");
const { tenantWhere } = require("../utils/tenantScope");

// Uma escola nova já ganha uma política default no registro (ver
// school.controller.js). Este controller só permite consultar/ajustar.
async function getActivePolicy(req, res) {
  try {
    const policy = await AcademicPolicy.findOne({
      where: tenantWhere(req, { active: true }),
      order: [["created_at", "DESC"]],
    });

    if (!policy) {
      return res.status(404).json({ message: "No active academic policy found for this school." });
    }

    return res.status(200).json(policy);
  } catch (error) {
    console.error("[Error fetching academic policy]:", error);
    return res.status(500).json({ message: "An error occurred while fetching the academic policy." });
  }
}

async function updateActivePolicy(req, res) {
  try {
    const { minimumExamExemption, passingGrade } = req.body;

    const policy = await AcademicPolicy.findOne({
      where: tenantWhere(req, { active: true }),
      order: [["created_at", "DESC"]],
    });

    if (!policy) {
      return res.status(404).json({ message: "No active academic policy found for this school." });
    }

    await policy.update({
      minimumExamExemption: minimumExamExemption ?? policy.minimumExamExemption,
      passingGrade: passingGrade ?? policy.passingGrade,
    });

    return res.status(200).json({ message: "Academic policy updated successfully.", policy });
  } catch (error) {
    console.error("[Error updating academic policy]:", error);
    return res.status(500).json({ message: "An error occurred while updating the academic policy." });
  }
}

module.exports = { getActivePolicy, updateActivePolicy };
