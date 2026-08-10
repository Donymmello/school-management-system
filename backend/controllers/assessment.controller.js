const {
    Assessment,
    CourseOfferingSubject,
    Subject,
} = require('../models');
const { tenantWhere } = require('../utils/tenantScope');

// Assessment não tem schoolId próprio (ver docs/project-rules.md, seção 5) —
// o isolamento por escola é feito via join obrigatório em
// CourseOfferingSubject -> Subject.
function courseOfferingSubjectScope(req) {
    return {
        model: CourseOfferingSubject,
        as: "courseOfferingSubject",
        required: true,
        include: [{ model: Subject, as: "subject", required: true, where: tenantWhere(req) }],
    };
}

async function createAssessment(req, res) {
    try {
        const {
            courseOfferingSubjectId,
            title,
            type,
            maxScore,
            weight,
            assessmentDate,
            description
        } = req.body;

        const courseOfferingSubject = await CourseOfferingSubject.findOne({
            where: { id: courseOfferingSubjectId },
            include: [{ model: Subject, as: "subject", required: true, where: tenantWhere(req) }],
        });

        if (!courseOfferingSubject) {
            return res.status(404).json({ message: "Course offering subject not found in this school" });
        }

        const totalWeight =
            await Assessment.sum("weight", {
                where: {
                    courseOfferingSubjectId,
                },
            });

        const finalWeight =
            (totalWeight || 0) + Number(weight);

        if (finalWeight > 100) {
            return res.status(400).json({
                message: "Assessment weight cannot exceed 100%",
            });
        }

        const assessment =
            await Assessment.create({
                courseOfferingSubjectId,
                title,
                type,
                maxScore,
                weight,
                assessmentDate,
                description,
            });

        return res.status(201).json({
            message: "Assessment created successfully",
            assessment,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "An error occurred while creating the assessment.",
        });
    }
}

async function getAssessments(req, res) {
    try {
        const { courseOfferingSubjectId } = req.query;
        const where = {};
        if (courseOfferingSubjectId) where.courseOfferingSubjectId = courseOfferingSubjectId;

        const assessments =
            await Assessment.findAll({
                where,
                include: [courseOfferingSubjectScope(req)],
            });

        return res.status(200).json({
            assessments
        });
    } catch (error) {
        return res.status(500).json({
            message: "An error occurred while fetching assessments.",
        });
    }
}

module.exports = {
    createAssessment,
    getAssessments,
};
