const {
    Assessment,
    StudentAssessment,
    AcademicPolicy,
} = require('../models');

async function calculateStudentResult(
    enrollmentId,
    courseOfferingSemesterId
) {
    const policy =
        await AcademicPolicy.findOne({
            where: { active: true },
        });

    if (!policy) {
        throw new Error(
            "No active academic policy found."
        );
    }

    const assessments =
        await Assessment.findAll({
            where: {
                enrollmentId,
            },
            include: [
                {
                    model: Assessment,
                    as: "assessment",
                    where: {
                        courseOfferingSubjectId,
                    },
                },
            ],
        });

    let continuousScore = 0;
    let examScore = null;

    for (const item of assessments) {
        const assessment = item.assessment;

        if (assessment.category ===
            "CONTINUOUS"
        ) {
            continuousScore +=
                (Number(item.score) /
                    Number(assessment.maxScore)) *
                Number(assessment.weight);
        }

        if (
            assessment.category === "EXAM"
        ) {
            exameScore = Number(item.score);
        }
    }

    const exempted =
        continuousScore >=
        Number(policy.minimumExamExemption);

    let finalGrade = continuousScore;

    if (!exempted && examScore !== null) {
        finalGrade =
            (continuousScore + examScore) / 2;
    }

    return {
        continuousScore:
            Number(
                continuousScore.toFixed(2)
            ),

        exempted,

        examRequired: !exempted,

        examScore,

        finalGrade:
            Number(finalGrade.toFixed(2)),

        passed:
            finalGrade >=
            Number(policy.passingGrade),
    };
}

module.exports = {
    calculateStudentResult,
};