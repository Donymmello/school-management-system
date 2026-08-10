const {
    calculateStudentResult,
} = require(
    "../services/gradeCalculation.service"
);

async function getStudentResult(req, res) {
    try {
        const {
            enrollmentId,
            courseOfferingSubjectId,
        } = req.params;

        const result = await calculateStudentResult(req, {
            enrollmentId,
            courseOfferingSubjectId,
        });

        return res.status(200).json(result);
    } catch (error) {
        const status = error.status || 500;
        return res.status(status).json({
            message: status === 500
                ? "An error occurred while calculating the result."
                : error.message,
        });
    }
}

module.exports = {
    getStudentResult,
};
