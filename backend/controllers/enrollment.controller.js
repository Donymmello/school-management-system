const {Enrollment, CourseOffering, Student} = require('../models');

async function enrollStudent(req, res) {
    try {
        const { studentId, courseOfferingId } = req.body;

        if (!studentId || !courseOfferingId) {
            return res.status(400).json({
                message: "studentId and courseOfferingId are required.",
            });
        }