const {
    calculateStudentResult,
} = require(
    "../services/gradeCalculation.service"
);

async function getStudentResult(req, res) {
    try {
        const {
            enrollmentId,
            courseOfferingStudentId,
        } = req.params;

        const result =
            await calculateStudentResult(
                enrollmentId,
                courseOfferingStudentId
            );

            return res.status(200).json(
                result
            );
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
}

module.exports = {
    getStudentResult,
};