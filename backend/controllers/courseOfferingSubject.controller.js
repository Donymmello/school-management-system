const {
    CourseOfferingSubject,
    CourseOffering,
    Course,
    Subject,
    Teacher,
} = require('../models');
const { tenantWhere } = require('../utils/tenantScope');
const { isUniqueConstraintError, respondUniqueConstraint } = require('../utils/dbErrors');

// CourseOfferingSubject não tem schoolId próprio (ver docs/project-rules.md,
// seção 5) — o isolamento por escola é feito via join obrigatório no
// Subject (subjectId nunca é nulo).
function subjectScope(req) {
    return { model: Subject, as: "subject", required: true, where: tenantWhere(req) };
}

async function createCourseOfferingSubject(req, res) {
    try {
        const {
            courseOfferingId,
            subjectId,
            teacherId,
            weeklyHours,
            startDate,
            endDate,
        } = req.body;

        const offering = await CourseOffering.findOne({
            where: { id: courseOfferingId },
            include: [{ model: Course, as: "course", required: true, where: tenantWhere(req) }],
        });

        if (!offering) {
            return res.status(404).json({
              message: "Course offering not found in this school",
            });
        }

        const subject = await Subject.findOne({ where: tenantWhere(req, { id: subjectId }) });

        if (!subject) {
            return res.status(404).json({
              message: "Subject not found in this school",
            });
        }

        if (teacherId) {
            const teacher = await Teacher.findOne({ where: tenantWhere(req, { id: teacherId }) });
            if (!teacher) {
                return res.status(404).json({ message: "Teacher not found in this school" });
            }
        }

        const item = await CourseOfferingSubject.create({
            courseOfferingId,
            subjectId,
            teacherId,
            weeklyHours,
            startDate,
            endDate,
        });

        return res.status(201).json({
            message: "Subject assigned to course offering successfully",
            data: item,
        });
    } catch (error) {
        if (isUniqueConstraintError(error)) return respondUniqueConstraint(res, error);
        console.error(error);

        return res.status(500).json({
            message: "An error occurred while assigning the subject to the course offering.",
        });
    }
}

async function getAllCourseOfferingSubjects(req, res) {
    try {
        const data = await CourseOfferingSubject.findAll({
            include: [
                {
                    model: CourseOffering,
                    as: "courseOffering",
                },
                subjectScope(req),
                {
                    model: Teacher,
                    as: "teacher",
                },

            ],
        });

        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({
            message: "An error occurred while fetching course offering subjects.",
        });
    }
}

async function getCourseOfferingSubjectById(req, res) {
    try {
        const item = await CourseOfferingSubject.findOne({
            where: { id: req.params.id },
            include: [
                {
                    model: CourseOffering,
                    as: "courseOffering",
                },
                subjectScope(req),
                {
                    model: Teacher,
                    as: "teacher",
                },

            ],
        });

        if (!item) {
            return res.status(404).json({
                message: "Course offering subject not found",
            });
        }

        return res.status(200).json(item);
    } catch (error) {
        return res.status(500).json({
            message: "An error occurred while fetching the course offering subject.",
        });
    }
}

async function updateCourseOfferingSubject(req, res) {
    try {
        const { id } = req.params;
        const { teacherId, weeklyHours, startDate, endDate, status } = req.body;

        const item = await CourseOfferingSubject.findOne({
            where: { id },
            include: [subjectScope(req)],
        });

        if (!item) {
            return res.status(404).json({
                message: "Course offering subject not found",
            });
        }

        if (teacherId) {
            const teacher = await Teacher.findOne({ where: tenantWhere(req, { id: teacherId }) });
            if (!teacher) {
                return res.status(404).json({ message: "Teacher not found in this school" });
            }
        }

        await item.update({
            teacherId: teacherId ?? item.teacherId,
            weeklyHours: weeklyHours ?? item.weeklyHours,
            startDate: startDate ?? item.startDate,
            endDate: endDate ?? item.endDate,
            status: status ?? item.status,
        });

        return res.status(200).json({
            message: "Course offering subject updated successfully",
            data: item,
        });
    } catch (error) {
        if (isUniqueConstraintError(error)) return respondUniqueConstraint(res, error);
        return res.status(500).json({
            message: "An error occurred while updating the course offering subject.",
        });
    }
}

module.exports = {
    createCourseOfferingSubject,
    getAllCourseOfferingSubjects,
    getCourseOfferingSubjectById,
    updateCourseOfferingSubject,
};
