const { Course, CourseOffering } = require("../models");
const generateCourseOfferingCode = require("../utils/generateCourseOfferingCode");

async function createCourseOffering(req, res) {
  try {
    const { courseId, academicYear, semester, capacity, active } = req.body;

    if (!courseId || !academicYear || !semester) {
      return res.status(400).json({
        message: "courseId, academicYear and semester are required.",
      });
    }

    if (!["S1", "S2"].includes(semester)) {
      return res.status(400).json({
        message: "Invalid semester. Use S1 or S2.",
      });
    }

    const course = await Course.findByPk(courseId);

    if (!course) {
      return res.status(404).json({
        message: "Course not found.",
      });
    }

    const code = generateCourseOfferingCode({
      courseCode: course.code,
      academicYear,
      semester,
    });

    const existingOffering = await CourseOffering.findOne({ where: { code } });

    if (existingOffering) {
      return res.status(409).json({
        message: "This course offering already exists.",
        code,
      });
    }

    const offering = await CourseOffering.create({
      code,
      courseId,
      academicYear,
      semester,
      capacity: capacity || 30,
      active: active ?? true,
    });

    return res.status(201).json({
      message: "Course offering created successfully.",
      offering,
    });
  } catch (error) {
    console.error("Error creating course offering:", error);

    return res.status(500).json({
      message: "An error occurred while creating the course offering.",
      error: error.message,
    });
  }
}

async function getAllCourseOfferings(req, res) {
  try {
    const { active, academicYear, semester, courseId } = req.query;

    const where = {};

    if (active !== undefined) where.active = active === "true";
    if (academicYear) where.academicYear = academicYear;
    if (semester) where.semester = semester;
    if (courseId) where.courseId = courseId;

    const offerings = await CourseOffering.findAll({
      where,
      include: [{ model: Course, as: "course" }],
      order: [
        ["academicYear", "DESC"],
        ["semester", "ASC"],
        ["code", "ASC"],
      ],
    });

    return res.status(200).json(offerings);
  } catch (error) {
    return res.status(500).json({
      message: "An error occurred while fetching course offerings.",
      error: error.message,
    });
  }
}

async function getCourseOfferingById(req, res) {
  try {
    const offering = await CourseOffering.findByPk(req.params.id, {
      include: [{ model: Course, as: "course" }],
    });

    if (!offering) {
      return res.status(404).json({
        message: "Course offering not found.",
      });
    }

    return res.status(200).json(offering);
  } catch (error) {
    return res.status(500).json({
      message: "An error occurred while fetching the course offering.",
      error: error.message,
    });
  }
}

async function updateCourseOffering(req, res) {
  try {
    const { id } = req.params;
    const { academicYear, semester, capacity, active } = req.body;

    const offering = await CourseOffering.findByPk(id, {
      include: [{ model: Course, as: "course" }],
    });

    if (!offering) {
      return res.status(404).json({
        message: "Course offering not found.",
      });
    }

    const nextAcademicYear = academicYear ?? offering.academicYear;
    const nextSemester = semester ?? offering.semester;

    if (!["S1", "S2"].includes(nextSemester)) {
      return res.status(400).json({
        message: "Invalid semester. Use S1 or S2.",
      });
    }

    const nextCode = generateCourseOfferingCode({
      courseCode: offering.course.code,
      academicYear: nextAcademicYear,
      semester: nextSemester,
    });

    if (nextCode !== offering.code) {
      const existingOffering = await CourseOffering.findOne({
        where: { code: nextCode },
      });

      if (existingOffering) {
        return res.status(409).json({
          message: "This course offering already exists.",
          code: nextCode,
        });
      }
    }

    await offering.update({
      code: nextCode,
      academicYear: nextAcademicYear,
      semester: nextSemester,
      capacity: capacity ?? offering.capacity,
      active: active ?? offering.active,
    });

    return res.status(200).json({
      message: "Course offering updated successfully.",
      offering,
    });
  } catch (error) {
    return res.status(500).json({
      message: "An error occurred while updating the course offering.",
      error: error.message,
    });
  }
}

async function deactivateCourseOffering(req, res) {
  try {
    const offering = await CourseOffering.findByPk(req.params.id);

    if (!offering) {
      return res.status(404).json({
        message: "Course offering not found.",
      });
    }

    await offering.update({ active: false });

    return res.status(200).json({
      message: "Course offering deactivated successfully.",
      offering,
    });
  } catch (error) {
    return res.status(500).json({
      message: "An error occurred while deactivating the course offering.",
      error: error.message,
    });
  }
}

module.exports = {
  createCourseOffering,
  getAllCourseOfferings,
  getCourseOfferingById,
  updateCourseOffering,
  deactivateCourseOffering,
};