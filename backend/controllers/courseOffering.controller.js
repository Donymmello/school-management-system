const { Course, CourseOffering } = require("../models");
const generateCourseOfferingCode = require("../utils/generateCourseOfferingCode");
const { tenantWhere } = require("../utils/tenantScope");
const { isUniqueConstraintError, respondUniqueConstraint } = require("../utils/dbErrors");

// CourseOffering não tem schoolId próprio (ver docs/project-rules.md, seção 5)
// — o isolamento por escola é feito via join obrigatório no Course dono da
// oferta. `courseScope` também serve pra confirmar que o courseId informado
// pertence à escola de quem está fazendo a chamada.
function courseScope(req, extra = {}) {
  return {
    model: Course,
    as: "course",
    required: true,
    where: tenantWhere(req, extra),
  };
}

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

    const course = await Course.findOne({ where: tenantWhere(req, { id: courseId }) });

    if (!course) {
      return res.status(404).json({
        message: "Course not found in this school.",
      });
    }

    const code = generateCourseOfferingCode({
      courseCode: course.code,
      academicYear,
      semester,
    });

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
    if (isUniqueConstraintError(error)) return respondUniqueConstraint(res, error);
    console.error("Error creating course offering:", error);

    return res.status(500).json({
      message: "An error occurred while creating the course offering.",
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
      include: [courseScope(req)],
      order: [
        ["academicYear", "DESC"],
        ["semester", "ASC"],
        ["code", "ASC"],
      ],
    });

    return res.status(200).json(offerings);
  } catch (error) {
    console.error("Error fetching course offerings:", error);
    return res.status(500).json({
      message: "An error occurred while fetching course offerings.",
    });
  }
}

async function getCourseOfferingById(req, res) {
  try {
    const offering = await CourseOffering.findOne({
      where: { id: req.params.id },
      include: [courseScope(req)],
    });

    if (!offering) {
      return res.status(404).json({
        message: "Course offering not found.",
      });
    }

    return res.status(200).json(offering);
  } catch (error) {
    console.error("Error fetching course offering:", error);
    return res.status(500).json({
      message: "An error occurred while fetching the course offering.",
    });
  }
}

async function updateCourseOffering(req, res) {
  try {
    const { id } = req.params;
    const { academicYear, semester, capacity, active } = req.body;

    const offering = await CourseOffering.findOne({
      where: { id },
      include: [courseScope(req)],
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
    if (isUniqueConstraintError(error)) return respondUniqueConstraint(res, error);
    console.error("Error updating course offering:", error);
    return res.status(500).json({
      message: "An error occurred while updating the course offering.",
    });
  }
}

async function deactivateCourseOffering(req, res) {
  try {
    const offering = await CourseOffering.findOne({
      where: { id: req.params.id },
      include: [courseScope(req)],
    });

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
    console.error("Error deactivating course offering:", error);
    return res.status(500).json({
      message: "An error occurred while deactivating the course offering.",
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
