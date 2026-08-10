const {
    Assessment,
    StudentAssessment,
    AcademicPolicy,
    Enrollment,
    Student,
    CourseOfferingSubject,
    Subject,
} = require('../models');
const { tenantWhere } = require('../utils/tenantScope');

function notFound(message) {
    const error = new Error(message);
    error.status = 404;
    return error;
}

// Calcula o resultado final de um aluno numa disciplina ofertada. `req` traz
// o req.schoolId (setado pelo requireSchool) usado pra confirmar que a
// matrícula e a disciplina pertencem à mesma escola de quem está chamando,
// antes de misturar dado de tenants diferentes numa única conta.
async function calculateStudentResult(req, { enrollmentId, courseOfferingSubjectId }) {
    const enrollment = await Enrollment.findOne({
        where: { id: enrollmentId },
        include: [{ model: Student, as: "student", required: true, where: tenantWhere(req) }],
    });

    if (!enrollment) {
        throw notFound("Enrollment not found in this school.");
    }

    const courseOfferingSubject = await CourseOfferingSubject.findOne({
        where: { id: courseOfferingSubjectId },
        include: [{ model: Subject, as: "subject", required: true, where: tenantWhere(req) }],
    });

    if (!courseOfferingSubject) {
        throw notFound("Course offering subject not found in this school.");
    }

    const policy = await AcademicPolicy.findOne({
        where: tenantWhere(req, { active: true }),
        order: [["created_at", "DESC"]],
    });

    if (!policy) {
        throw notFound("No active academic policy found for this school.");
    }

    const records = await StudentAssessment.findAll({
        where: { enrollmentId },
        include: [
            {
                model: Assessment,
                as: "assessment",
                required: true,
                where: { courseOfferingSubjectId },
            },
        ],
    });

    let continuousScore = 0;
    let examScore = null;

    for (const record of records) {
        if (record.score === null || record.score === undefined) continue;

        const assessment = record.assessment;

        if (assessment.category === "CONTINUOUS") {
            continuousScore +=
                (Number(record.score) / Number(assessment.maxScore)) *
                Number(assessment.weight);
        }

        if (assessment.category === "EXAM") {
            examScore = Number(record.score);
        }
    }

    const exempted = continuousScore >= Number(policy.minimumExamExemption);

    let finalGrade = continuousScore;

    if (!exempted && examScore !== null) {
        finalGrade = (continuousScore + examScore) / 2;
    }

    return {
        continuousScore: Number(continuousScore.toFixed(2)),
        exempted,
        examRequired: !exempted,
        examScore,
        finalGrade: Number(finalGrade.toFixed(2)),
        passed: finalGrade >= Number(policy.passingGrade),
    };
}

module.exports = {
    calculateStudentResult,
};
