const {
    StudentAssessment,    Enrollment,
    Assessment,
    Enrollment,
} = require("../models");

async function recordScore(req, res) {
    try {
        const {
            enrollmentId,
            assessmentId,
            score,
            remarks,
        } = req.body;

        const enrollment =
      await Enrollment.findByPk(
        enrollmentId
      );

    if (!enrollment) {
      return res.status(404).json({
        message:
          "Enrollment not found.",
      });
    }

    const assessment =
      await Assessment.findByPk(
        assessmentId
      );

    if (!assessment) {
      return res.status(404).json({
        message:
          "Assessment not found.",
      });
    }

    if (score > assessment.maxScore) {
      return res.status(400).json({
        message:
          "Score exceeds maximum score.",
      });
    }

    const result =
        await StudentAssessment.create({
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
        return res.status(500).json({
            message: error.message,
        });
    }
}

module.exports = {
    recordScore,
};