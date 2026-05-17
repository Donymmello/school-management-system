const { Subject } = require("../models");
const generateSubjectCode = require("../utils/generateSubjectCode");

async function createSubject(req, res) {
  try {
    const {
      name,
      description,
      workloadHours,
      credits,
      level,
      active,
    } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Name is required.",
      });
    }

    const existingSubjectByName = await Subject.findOne({
      where: { name },
    });

    if (existingSubjectByName) {
      return res.status(409).json({
        message: "A subject with this name already exists.",
      });
    }

    const code = await generateSubjectCode();

    const subject = await Subject.create({
      code,
      name,
      description: description || null,
      workloadHours: workloadHours || null,
      credits: credits || null,
      level: level || null,
      active: active ?? true,
    });

    return res.status(201).json({
      message: "Subject created successfully.",
      subject,
    });
  } catch (error) {
    console.error("Error creating subject:", error);

    return res.status(500).json({
      message: "An error occurred while creating the subject.",
      error: error.message,
    });
  }
}

async function getAllSubjects(req, res) {
  try {
    const { active, search } = req.query;

    const where = {};

    if (active !== undefined) {
      where.active = active === "true";
    }

    const subjects = await Subject.findAll({
      where,
      order: [["name", "ASC"]],
    });

    let filteredSubjects = subjects;

    if (search) {
      const normalizedSearch = search.toLowerCase();

      filteredSubjects = subjects.filter((subject) => {
        return (
          subject.name.toLowerCase().includes(normalizedSearch) ||
          subject.code.toLowerCase().includes(normalizedSearch)
        );
      });
    }

    return res.status(200).json(filteredSubjects);
  } catch (error) {
    console.error("Error fetching subjects:", error);

    return res.status(500).json({
      message: "An error occurred while fetching subjects.",
      error: error.message,
    });
  }
}

async function getSubjectById(req, res) {
  try {
    const { id } = req.params;

    const subject = await Subject.findByPk(id);

    if (!subject) {
      return res.status(404).json({
        message: "Subject not found.",
      });
    }

    return res.status(200).json(subject);
  } catch (error) {
    console.error("Error fetching subject:", error);

    return res.status(500).json({
      message: "An error occurred while fetching the subject.",
      error: error.message,
    });
  }
}

async function updateSubject(req, res) {
  try {
    const { id } = req.params;

    const {
      code,
      name,
      description,
      workloadHours,
      credits,
      level,
      active,
    } = req.body;

    const subject = await Subject.findByPk(id);

    if (!subject) {
      return res.status(404).json({
        message: "Subject not found.",
      });
    }

    if (code && code !== subject.code) {
      const existingSubjectByCode = await Subject.findOne({
        where: { code },
      });

      if (existingSubjectByCode) {
        return res.status(409).json({
          message: "A subject with this code already exists.",
        });
      }
    }

    if (name && name !== subject.name) {
      const existingSubjectByName = await Subject.findOne({
        where: { name },
      });

      if (existingSubjectByName) {
        return res.status(409).json({
          message: "A subject with this name already exists.",
        });
      }
    }

    await subject.update({
      code: code ?? subject.code,
      name: name ?? subject.name,
      description: description ?? subject.description,
      workloadHours: workloadHours ?? subject.workloadHours,
      credits: credits ?? subject.credits,
      level: level ?? subject.level,
      active: active ?? subject.active,
    });

    return res.status(200).json({
      message: "Subject updated successfully.",
      subject,
    });
  } catch (error) {
    console.error("Error updating subject:", error);

    return res.status(500).json({
      message: "An error occurred while updating the subject.",
      error: error.message,
    });
  }
}

async function deactivateSubject(req, res) {
  try {
    const { id } = req.params;

    const subject = await Subject.findByPk(id);

    if (!subject) {
      return res.status(404).json({
        message: "Subject not found.",
      });
    }

    await subject.update({
      active: false,
    });

    return res.status(200).json({
      message: "Subject deactivated successfully.",
      subject,
    });
  } catch (error) {
    console.error("Error deactivating subject:", error);

    return res.status(500).json({
      message: "An error occurred while deactivating the subject.",
      error: error.message,
    });
  }
}

async function deleteSubject(req, res) {
  try {
    const { id } = req.params;

    const subject = await Subject.findByPk(id);

    if (!subject) {
      return res.status(404).json({
        message: "Subject not found.",
      });
    }

    await subject.destroy();

    return res.status(200).json({
      message: "Subject deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting subject:", error);

    return res.status(500).json({
      message: "An error occurred while deleting the subject.",
      error: error.message,
    });
  }
}

module.exports = {
  createSubject,
  getAllSubjects,
  getSubjectById,
  updateSubject,
  deactivateSubject,
  deleteSubject,
};