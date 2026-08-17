const bcrypt = require("bcrypt");
const { School, User, AcademicPolicy, sequelize } = require("../models");
const { generateEmployeeCode } = require("../utils/generateCode");
const registerLogAudit = require("../utils/logAudit");
const { isUniqueConstraintError, respondUniqueConstraint } = require("../utils/dbErrors");
const { validateCurrency } = require("../utils/validators");
const { generateToken, mapUserToResponse } = require("./auth.controller");

const ACADEMIC_MODELS = ["SECONDARY", "HIGHER_ED"];

// Auto-cadastro público: escola nova + o primeiro ADMIN dela, numa tacada só.
async function registerSchool(req, res) {
  try {
    const {
      schoolName,
      address,
      schoolEmail,
      slug,
      plan,
      academicModel,
      currency,
      adminName,
      adminEmail,
      adminPassword,
    } = req.body;

    if (!schoolName || !address || !schoolEmail || !slug) {
      return res.status(400).json({
        message: "schoolName, address, schoolEmail and slug are required.",
      });
    }

    // Decide pra sempre se essa escola opera no modelo "ensino secundário"
    // (turma fixa) ou "técnico/superior" (créditos/ofertas) — ver
    // docs/project-rules.md, seção 5. Não é editável depois.
    if (!ACADEMIC_MODELS.includes(academicModel)) {
      return res.status(400).json({
        message: "academicModel is required.",
        allowedValues: ACADEMIC_MODELS,
      });
    }

    if (!adminName || !adminEmail || !adminPassword) {
      return res.status(400).json({
        message: "adminName, adminEmail and adminPassword are required.",
      });
    }

    let currencyValue;
    if (currency !== undefined) {
      const currencyCheck = validateCurrency(currency);
      if (currencyCheck.error) return res.status(400).json({ message: currencyCheck.error });
      currencyValue = currencyCheck.value;
    }

    const result = await sequelize.transaction(async (t) => {
      const school = await School.create(
        {
          name: schoolName,
          address,
          email: schoolEmail,
          slug,
          plan: plan || "FREE",
          academicModel,
          currency: currencyValue || "AOA",
          status: "ACTIVE",
        },
        { transaction: t }
      );

      const passwordHash = await bcrypt.hash(adminPassword, 10);
      const employeeCode = await generateEmployeeCode();

      const admin = await User.create(
        {
          employeeCode,
          name: adminName,
          email: adminEmail,
          passwordHash,
          role: "ADMIN",
          schoolId: school.id,
          active: true,
        },
        { transaction: t }
      );

      // Toda escola nova precisa de uma política acadêmica ativa, senão o
      // cálculo de resultado (results.controller.js) nunca encontra uma
      // (ver docs/project-rules.md, seção 5). Cria com os valores default
      // do model; a escola pode ajustar depois via /api/academic-policies.
      await AcademicPolicy.create(
        { schoolId: school.id, active: true },
        { transaction: t }
      );

      await registerLogAudit(
        {
          userId: admin.id,
          action: "REGISTER_SCHOOL",
          entity: "School",
          entityId: school.id,
          description: `School "${school.name}" registered with admin ${admin.email}.`,
        },
        { transaction: t }
      );

      return { school, admin };
    });

    // result.admin não veio de uma query com include: [School], então
    // mapUserToResponse não teria como montar o `school` sozinho — anexa a
    // instância recém-criada (já em memória, sem round-trip extra).
    result.admin.school = result.school;

    return res.status(201).json({
      message: "School registered successfully.",
      token: generateToken(result.admin),
      school: result.school,
      user: mapUserToResponse(result.admin),
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) return respondUniqueConstraint(res, error);
    console.error("[Error registering school]:", error);
    return res.status(500).json({ message: "An error occurred while registering the school." });
  }
}

async function createSchool(req, res) {
  try {
    const { name, address, email, slug, plan, academicModel, currency } = req.body;

    if (!name || !address || !email || !slug) {
      return res.status(400).json({
        message: "Name, address, email and slug are required.",
      });
    }

    if (!ACADEMIC_MODELS.includes(academicModel)) {
      return res.status(400).json({
        message: "academicModel is required.",
        allowedValues: ACADEMIC_MODELS,
      });
    }

    let currencyValue;
    if (currency !== undefined) {
      const currencyCheck = validateCurrency(currency);
      if (currencyCheck.error) return res.status(400).json({ message: currencyCheck.error });
      currencyValue = currencyCheck.value;
    }

    const existing = await School.findOne({ where: { slug } });
    if (existing) {
      return res.status(409).json({ message: "A school with this slug already exists." });
    }

    const school = await sequelize.transaction(async (t) => {
      const created = await School.create(
        { name, address, email, slug, plan: plan || "FREE", academicModel, currency: currencyValue || "AOA" },
        { transaction: t }
      );
      await AcademicPolicy.create({ schoolId: created.id, active: true }, { transaction: t });
      return created;
    });

    return res.status(201).json({ message: "School created successfully.", school });
  } catch (error) {
    if (isUniqueConstraintError(error)) return respondUniqueConstraint(res, error);
    console.error("[Error creating school]:", error);
    return res.status(500).json({ message: "An error occurred while creating the school." });
  }
}

async function getAllSchools(req, res) {
  try {
    const schools = await School.findAll({ order: [["name", "ASC"]] });
    return res.status(200).json(schools);
  } catch (error) {
    console.error("[Error fetching schools]:", error);
    return res.status(500).json({ message: "An error occurred while fetching schools." });
  }
}

async function getSchoolById(req, res) {
  try {
    const school = await School.findByPk(req.params.id);
    if (!school) return res.status(404).json({ message: "School not found." });

    if (req.user.role !== "SUPER_ADMIN" && req.user.schoolId !== school.id) {
      return res.status(403).json({ message: "Access denied." });
    }

    return res.status(200).json(school);
  } catch (error) {
    console.error("[Error fetching school]:", error);
    return res.status(500).json({ message: "An error occurred while fetching the school." });
  }
}

async function updateSchool(req, res) {
  try {
    const school = await School.findByPk(req.params.id);
    if (!school) return res.status(404).json({ message: "School not found." });

    const { name, address, email, logo, plan, status, currency } = req.body;

    let currencyValue;
    if (currency !== undefined) {
      const currencyCheck = validateCurrency(currency);
      if (currencyCheck.error) return res.status(400).json({ message: currencyCheck.error });
      currencyValue = currencyCheck.value;
    }

    await school.update({
      name: name ?? school.name,
      address: address ?? school.address,
      email: email ?? school.email,
      logo: logo ?? school.logo,
      plan: plan ?? school.plan,
      status: status ?? school.status,
      currency: currencyValue ?? school.currency,
    });

    return res.status(200).json({ message: "School updated successfully.", school });
  } catch (error) {
    console.error("[Error updating school]:", error);
    return res.status(500).json({ message: "An error occurred while updating the school." });
  }
}

module.exports = {
  registerSchool,
  createSchool,
  getAllSchools,
  getSchoolById,
  updateSchool,
};
