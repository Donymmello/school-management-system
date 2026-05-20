const { Course } = require("../models");
const generateCourseCode = require("../utils/generateCourseCode");

async function createCourse(req, res) {
  try {
    const { name, displayName, faculty, durationYears, degreeLevel, active } = req.body;

    if (!name || !displayName || !faculty) {
      return res.status(400).json({
        message: "Name, displayName and faculty are required.",
      });
    }

    const existingCourse = await Course.findOne({ where: { name, faculty } });

    if (existingCourse) {
      return res.status(409).json({
        message: "This course already exists in this faculty.",
      });
    }

    const code = generateCourseCode({ faculty, name });

    const courseWithCode = await Course.findOne({ where: { code } });

    if (courseWithCode) {
      return res.status(409).json({
        message: "A course with this generated code already exists.",
        code,
      });
    }

    const course = await Course.create({
      code,
      name,
      displayName,
      faculty,
      durationYears: durationYears || null,
      degreeLevel: degreeLevel || "BACHELOR",
      active: active ?? true,
    });

    return res.status(201).json({
      message: "Course created successfully.",
      course,
    });
  } catch (error) {
    console.error("Error creating course:", error);

    return res.status(500).json({
      message: "An error occurred while creating the course.",
      error: error.message,
    });
  }
}

async function getAllCourses(req, res) {
  try {
    const { active, faculty, degreeLevel } = req.query;

    const where = {};

    if (active !== undefined) where.active = active === "true";
    if (faculty) where.faculty = faculty;
    if (degreeLevel) where.degreeLevel = degreeLevel;

    const courses = await Course.findAll({
      where,
      order: [
        ["faculty", "ASC"],
        ["displayName", "ASC"],
      ],
    });

    return res.status(200).json(courses);
  } catch (error) {
    return res.status(500).json({
      message: "An error occurred while fetching courses.",
      error: error.message,
    });
  }
}

async function getCourseById(req, res) {
  try {
    const course = await Course.findByPk(req.params.id);

    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    return res.status(200).json(course);
  } catch (error) {
    return res.status(500).json({
      message: "An error occurred while fetching the course.",
      error: error.message,
    });
  }
}

async function updateCourse(req, res) {
  try {
    const { id } = req.params;
    const { displayName, durationYears, degreeLevel, active } = req.body;

    const course = await Course.findByPk(id);

    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    await course.update({
      displayName: displayName ?? course.displayName,
      durationYears: durationYears ?? course.durationYears,
      degreeLevel: degreeLevel ?? course.degreeLevel,
      active: active ?? course.active,
    });

    return res.status(200).json({
      message: "Course updated successfully.",
      course,
    });
  } catch (error) {
    return res.status(500).json({
      message: "An error occurred while updating the course.",
      error: error.message,
    });
  }
}

async function deactivateCourse(req, res) {
  try {
    const course = await Course.findByPk(req.params.id);

    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    await course.update({ active: false });

    return res.status(200).json({
      message: "Course deactivated successfully.",
      course,
    });
  } catch (error) {
    return res.status(500).json({
      message: "An error occurred while deactivating the course.",
      error: error.message,
    });
  }
}

async function deleteCourse(req, res) {
  try {
    const course = await Course.findByPk(req.params.id);

    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    await course.destroy();

    return res.status(200).json({
      message: "Course deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      message: "An error occurred while deleting the course.",
      error: error.message,
    });
  }
}

module.exports = {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deactivateCourse,
  deleteCourse,
};