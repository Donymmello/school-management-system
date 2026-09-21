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
const { resolveOwnStudentId } = require("../utils/selfScope");
const logger = require("../utils/logger");

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

        // Só validava o teto (score > maxScore) — nada impedia um score
        // negativo. Bug pego ao completar este controller pra fase 5 do
        // roadmap de execução (docs/project-rules.md, seção 6).
        if (score !== undefined && score !== null && (Number.isNaN(Number(score)) || Number(score) < 0)) {
            return res.status(400).json({
                message: "Score must be a non-negative number.",
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
        logger.requestError("[Error recording score]", req, error);
        return res.status(500).json({
            message: "An error occurred while recording the score.",
        });
    }
}

// Não existia nenhum GET aqui — impossível saber quem já tinha nota
// lançada numa avaliação sem consultar o banco direto. Bug de escopo pego
// ao desenhar a tela de lançamento de notas (fase 5 do roadmap de
// execução, docs/project-rules.md seção 6): sem isso, a tela lançaria
// notas às cegas, sem mostrar o que já existe.
async function getStudentAssessments(req, res) {
    try {
        const { assessmentId, enrollmentId } = req.query;

        if (!assessmentId && !enrollmentId) {
            return res.status(400).json({
                message: "assessmentId or enrollmentId query parameter is required.",
            });
        }

        const where = {};
        if (assessmentId) where.assessmentId = assessmentId;
        if (enrollmentId) where.enrollmentId = enrollmentId;

        // Portal do aluno: força o próprio registro independente do que veio
        // na query, mesmo padrão de Grades/Attendance/Fees (ver
        // docs/project-rules.md, seção 6, item 5) — senão um STUDENT
        // conseguiria ver a nota de outro aluno só trocando enrollmentId.
        let studentWhere = tenantWhere(req);
        if (req.user.role === "STUDENT") {
            const ownStudentId = await resolveOwnStudentId(req);
            if (!ownStudentId) return res.status(403).json({ message: "Student profile not found for this user." });
            studentWhere = { ...studentWhere, id: ownStudentId };
        }

        const results = await StudentAssessment.findAll({
            where,
            include: [
                {
                    model: Assessment,
                    as: "assessment",
                    required: true,
                    include: [
                        {
                            model: CourseOfferingSubject,
                            as: "courseOfferingSubject",
                            required: true,
                            include: [{ model: Subject, as: "subject", required: true, where: tenantWhere(req) }],
                        },
                    ],
                },
                {
                    model: Enrollment,
                    as: "enrollment",
                    required: true,
                    include: [
                        {
                            model: Student,
                            as: "student",
                            required: true,
                            attributes: ["id", "name", "studentCode"],
                            where: studentWhere,
                        },
                    ],
                },
            ],
            order: [["created_at", "ASC"]],
        });

        return res.status(200).json({ results });
    } catch (error) {
        logger.requestError("[Error fetching student assessments]", req, error);
        return res.status(500).json({
            message: "An error occurred while fetching student assessments.",
        });
    }
}

module.exports = {
    recordScore,
    getStudentAssessments,
};
