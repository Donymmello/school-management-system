const {
    StudentAssessment,
    Assessment,
    Enrollment,
    Student,
    CourseOfferingSubject,
    Subject,
} = require("../models");
const { tenantWhere } = require("../utils/tenantScope");
const { isUniqueConstraintError, respondUniqueConstraint } = require("../utils/dbErrors");

async function recordScore(req, res) {
    try {
        const {
            enrollmentId,
            assessmentId,
            score,
            remarks,
        } = req.body;

        const enrollment = await Enrollment.findOne({
            where: { id: enrollmentId },
            include: [{ model: Student, as: "student", required: true, where: tenantWhere(req) }],
        });

        if (!enrollment) {
            return res.status(404).json({
                message: "Enrollment not found in this school.",
            });
        }

        const assessment = await Assessment.findOne({
            where: { id: assessmentId },
            include: [
                {
                    model: CourseOfferingSubject,
                    as: "courseOfferingSubject",
                    required: true,
                    include: [{ model: Subject, as: "subject", required: true, where: tenantWhere(req) }],
                },
            ],
        });

        if (!assessment) {
            return res.status(404).json({
                message: "Assessment not found in this school.",
            });
        }

        if (score > assessment.maxScore) {
            return res.status(400).json({
                message: "Score exceeds maximum score.",
            });
        }

        const result = await StudentAssessment.create({
            enrollmentId,
            assessmentId,
            score,
            remarks,
            gradeAt: new Date(),
        });

        return res.status(201).json({
            message: "Score recorded successfully",
            result,
        });
    } catch (error) {
        if (isUniqueConstraintError(error)) return respondUniqueConstraint(res, error);
        console.error("[Error recording score]:", error);
        return res.status(500).json({
            message: "An error occurred while recording the score.",
        });
    }
}

module.exports = {
    recordScore,
};
