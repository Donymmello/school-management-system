const { Classroom } = require("../models");
const generateClassroomCode = require("../utils/generateClassroomCode");

const allowedTypes = ["NORMAL", "LAB", "AUDITORIUM", "OFFICE", "OTHER"];

async function createClassroom(req, res) {
  try {
    const { name, block, capacity, type, active } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Classroom name is required.",
      });
    }

    const normalizedType = type || "NORMAL";

    if (!allowedTypes.includes(normalizedType)) {
      return res.status(400).json({
        message: "Invalid classroom type.",
        allowedTypes,
      });
    }

    const normalizedBlock = block ? String(block).trim().toUpperCase() : null;

    const existingClassroom = await Classroom.findOne({
      where: { name },
    });

    if (existingClassroom) {
      return res.status(409).json({
        message: "A classroom with this name already exists.",
      });
    }

    const code = await generateClassroomCode({
      block: normalizedBlock,
      type: normalizedType,
    });

    const classroom = await Classroom.create({
      code,
      name,
      block: normalizedBlock,
      capacity: capacity || 30,
      type: normalizedType,
      active: active ?? true,
    });

    return res.status(201).json({
      message: "Classroom created successfully.",
      classroom,
    });
  } catch (error) {
    console.error("Error creating classroom:", error);

    return res.status(500).json({
      message: "An error occurred while creating the classroom.",
      error: error.message,
    });
  }
}

async function getAllClassrooms(req, res) {
  try {
    const { active, type, block } = req.query;

    const where = {};

    if (active !== undefined) {
      where.active = active === "true";
    }

    if (type) {
      where.type = type;
    }

    if (block) {
      where.block = String(block).trim().toUpperCase();
    }

    const classrooms = await Classroom.findAll({
      where,
      order: [
        ["block", "ASC"],
        ["type", "ASC"],
        ["name", "ASC"],
      ],
    });

    return res.status(200).json(classrooms);
  } catch (error) {
    console.error("Error fetching classrooms:", error);

    return res.status(500).json({
      message: "An error occurred while fetching classrooms.",
      error: error.message,
    });
  }
}

async function getClassroomById(req, res) {
  try {
    const { id } = req.params;

    const classroom = await Classroom.findByPk(id);

    if (!classroom) {
      return res.status(404).json({
        message: "Classroom not found.",
      });
    }

    return res.status(200).json(classroom);
  } catch (error) {
    console.error("Error fetching classroom:", error);

    return res.status(500).json({
      message: "An error occurred while fetching the classroom.",
      error: error.message,
    });
  }
}

async function updateClassroom(req, res) {
  try {
    const { id } = req.params;
    const { name, block, capacity, type, active } = req.body;

    const classroom = await Classroom.findByPk(id);

    if (!classroom) {
      return res.status(404).json({
        message: "Classroom not found.",
      });
    }

    if (type && !allowedTypes.includes(type)) {
      return res.status(400).json({
        message: "Invalid classroom type.",
        allowedTypes,
      });
    }

    if (name && name !== classroom.name) {
      const existingClassroom = await Classroom.findOne({
        where: { name },
      });

      if (existingClassroom) {
        return res.status(409).json({
          message: "A classroom with this name already exists.",
        });
      }
    }

    const normalizedBlock =
      block !== undefined ? String(block).trim().toUpperCase() : classroom.block;

    const normalizedType = type ?? classroom.type;

    let newCode = classroom.code;

    if (
      normalizedBlock !== classroom.block ||
      normalizedType !== classroom.type
    ) {
      newCode = await generateClassroomCode({
        block: normalizedBlock,
        type: normalizedType,
      });
    }

    await classroom.update({
      code: newCode,
      name: name ?? classroom.name,
      block: normalizedBlock,
      capacity: capacity ?? classroom.capacity,
      type: normalizedType,
      active: active ?? classroom.active,
    });

    return res.status(200).json({
      message: "Classroom updated successfully.",
      classroom,
    });
  } catch (error) {
    console.error("Error updating classroom:", error);

    return res.status(500).json({
      message: "An error occurred while updating the classroom.",
      error: error.message,
    });
  }
}

async function deactivateClassroom(req, res) {
  try {
    const { id } = req.params;

    const classroom = await Classroom.findByPk(id);

    if (!classroom) {
      return res.status(404).json({
        message: "Classroom not found.",
      });
    }

    await classroom.update({
      active: false,
    });

    return res.status(200).json({
      message: "Classroom deactivated successfully.",
      classroom,
    });
  } catch (error) {
    console.error("Error deactivating classroom:", error);

    return res.status(500).json({
      message: "An error occurred while deactivating the classroom.",
      error: error.message,
    });
  }
}

async function deleteClassroom(req, res) {
  try {
    const { id } = req.params;

    const classroom = await Classroom.findByPk(id);

    if (!classroom) {
      return res.status(404).json({
        message: "Classroom not found.",
      });
    }

    await classroom.destroy();

    return res.status(200).json({
      message: "Classroom deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting classroom:", error);

    return res.status(500).json({
      message: "An error occurred while deleting the classroom.",
      error: error.message,
    });
  }
}

module.exports = {
  createClassroom,
  getAllClassrooms,
  getClassroomById,
  updateClassroom,
  deactivateClassroom,
  deleteClassroom,
};