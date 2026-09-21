const { Op } = require('sequelize');
const {
    Assessment,
    CourseOfferingSubject,
    Subject,
    StudentAssessment,
} = require('../models');
const { tenantWhere } = require('../utils/tenantScope');
const { validatePositiveNumber } = require('../utils/validators');
const logger = require("../utils/logger");

const CATEGORY_VALUES = ["CONTINUOUS", "EXAM"];
const MAX_WEIGHT = 100;

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

async function findTenantAssessment(req, id) {
    return Assessment.findOne({
        where: { id },
        include: [courseOfferingSubjectScope(req)],
    });
}

async function createAssessment(req, res) {
    try {
        const {
            courseOfferingSubjectId,
            title,
            type,
            category,
            maxScore,
            weight,
            assessmentDate,
            description
        } = req.body;

        // category não vinha no body até esta rodada — sempre caía no
        // default CONTINUOUS do model, o que tornava impossível registrar
        // uma avaliação de EXAM e, por consequência, o cálculo de
        // resultado final (backend/services/gradeCalculation.service.js)
        // nunca encontrava examScore. Ver docs/project-rules.md, seção 6.
        if (category !== undefined && !CATEGORY_VALUES.includes(category)) {
            return res.status(400).json({ message: `category must be one of: ${CATEGORY_VALUES.join(", ")}` });
        }

        // "Number(weight)" cru deixava passar NaN e negativo — NaN > 100 é
        // sempre false, então um weight tipo "abc" furava o guard abaixo e
        // só quebrava mais tarde com um erro de banco cru. Pego em code
        // review (fase 5 do roadmap de execução).
        const weightCheck = validatePositiveNumber(weight, "weight");
        if (weightCheck.error) return res.status(400).json({ message: weightCheck.error });

        const maxScoreCheck = validatePositiveNumber(maxScore, "maxScore");
        if (maxScoreCheck.error) return res.status(400).json({ message: maxScoreCheck.error });

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

        const finalWeight = (totalWeight || 0) + weightCheck.value;

        if (finalWeight > MAX_WEIGHT) {
            return res.status(400).json({
                message: "Assessment weight cannot exceed 100%",
            });
        }

        const assessment =
            await Assessment.create({
                courseOfferingSubjectId,
                title,
                type,
                category: category || "CONTINUOUS",
                maxScore: maxScoreCheck.value,
                weight: weightCheck.value,
                assessmentDate,
                description,
            });

        return res.status(201).json({
            message: "Assessment created successfully",
            assessment,
        });
    } catch (error) {
        logger.requestError("[Error creating assessment]", req, error);

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

async function getAssessmentById(req, res) {
    try {
        const assessment = await findTenantAssessment(req, req.params.id);
        if (!assessment) return res.status(404).json({ message: "Assessment not found." });
        return res.status(200).json({ assessment });
    } catch (error) {
        logger.requestError("[Error fetching assessment]", req, error);
        return res.status(500).json({ message: "An error occurred while fetching the assessment." });
    }
}

async function updateAssessment(req, res) {
    try {
        const { title, type, category, maxScore, weight, assessmentDate, description, status } = req.body;

        if (category !== undefined && !CATEGORY_VALUES.includes(category)) {
            return res.status(400).json({ message: `category must be one of: ${CATEGORY_VALUES.join(", ")}` });
        }

        const assessment = await findTenantAssessment(req, req.params.id);
        if (!assessment) return res.status(404).json({ message: "Assessment not found." });

        let weightValue = assessment.weight;
        if (weight !== undefined) {
            const weightCheck = validatePositiveNumber(weight, "weight");
            if (weightCheck.error) return res.status(400).json({ message: weightCheck.error });
            weightValue = weightCheck.value;

            // Soma o peso das outras avaliações da mesma oferta+disciplina
            // (exclui a própria, senão ela contaria o peso antigo e o novo
            // ao mesmo tempo).
            const totalOtherWeights = await Assessment.sum("weight", {
                where: {
                    courseOfferingSubjectId: assessment.courseOfferingSubjectId,
                    id: { [Op.ne]: assessment.id },
                },
            });
            const finalWeight = (totalOtherWeights || 0) + weightValue;
            if (finalWeight > MAX_WEIGHT) {
                return res.status(400).json({ message: "Assessment weight cannot exceed 100%" });
            }
        }

        let maxScoreValue = assessment.maxScore;
        if (maxScore !== undefined) {
            const maxScoreCheck = validatePositiveNumber(maxScore, "maxScore");
            if (maxScoreCheck.error) return res.status(400).json({ message: maxScoreCheck.error });
            maxScoreValue = maxScoreCheck.value;
        }

        await assessment.update({
            title: title ?? assessment.title,
            type: type ?? assessment.type,
            category: category ?? assessment.category,
            maxScore: maxScoreValue,
            weight: weightValue,
            assessmentDate: assessmentDate ?? assessment.assessmentDate,
            description: description ?? assessment.description,
            status: status ?? assessment.status,
        });

        return res.status(200).json({ message: "Assessment updated successfully.", assessment });
    } catch (error) {
        logger.requestError("[Error updating assessment]", req, error);
        return res.status(500).json({ message: "An error occurred while updating the assessment." });
    }
}

async function deleteAssessment(req, res) {
    try {
        const assessment = await findTenantAssessment(req, req.params.id);
        if (!assessment) return res.status(404).json({ message: "Assessment not found." });

        // Sem CASCADE configurado na FK (ver backend/models/index.js) —
        // apagar uma avaliação com notas já lançadas quebraria com erro de
        // constraint no banco. Verifica antes e devolve uma mensagem clara
        // em vez de deixar vazar um SequelizeForeignKeyConstraintError.
        const scoresCount = await StudentAssessment.count({ where: { assessmentId: assessment.id } });
        if (scoresCount > 0) {
            return res.status(409).json({
                message: "Cannot delete an assessment that already has recorded scores.",
            });
        }

        await assessment.destroy();
        return res.status(200).json({ message: "Assessment deleted successfully." });
    } catch (error) {
        logger.requestError("[Error deleting assessment]", req, error);
        return res.status(500).json({ message: "An error occurred while deleting the assessment." });
    }
}

module.exports = {
    createAssessment,
    getAssessments,
    getAssessmentById,
    updateAssessment,
    deleteAssessment,
};
