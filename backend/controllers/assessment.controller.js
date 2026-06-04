const {
    Assessment,
    CourseOfferingSubject,
} = require('../models');

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

        const subject =
            await CourseOfferingSubject.findByPk(
                courseOfferingSubjectId
            );

        if (!subject) {
            return res.status(404).json({ message: "Course offering subject not found" });
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
            message: error.message,
        });
    }
}

async function getAssessments(req, res) {
    try {
        const assessments =
            await Assessment.findAll({
                include: [
                    {
                        association:
                            "courseOfferingSubject",
                    },
                ],
            });

        return res.status(200).json({
            assessments
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
}

module.exports = {
    createAssessment,
    getAssessments,
};