const { Enrollment, CourseOffering, Student, Course } = require('../models');

async function enrollStudent(req, res) {
    try {
        const { studentId, courseOfferingId } = req.body;

        if (!studentId || !courseOfferingId) {
            return res.status(400).json({
                message: "studentId and courseOfferingId are required.",
            });
        }

        const student = await Student.findByPk(studentId);

        if (!student) {
            return res.status(404).json({
                message: "Student not found.",
            });
        }

        const courseOffering = await CourseOffering.findByPk(courseOfferingId);

        if (!courseOffering) {
            return res.status(404).json({
                message: "Course offering not found.",
            });
        }

        const existingEnrollment = await Enrollment.findOne({

            where: { 
                studentId, 
                courseOfferingId 
            },
        });

        if (existingEnrollment) {
            return res.status(409).json({
                message: "Student is already enrolled in this course offering.",
            });
        }

        const enrollment = await Enrollment.create({
            studentId,
            courseOfferingId,
            status: "PENDING",
        });

        return res.status(201).json({
            message: "Enrollment request created successfully.",
            enrollment,
        });
    } catch (error) {
        console.error("Error enrolling student:", error);

        return res.status(500).json({
            message: "An error occurred while enrolling the student.",
            error: error.message,
        });
    }
}

async function getEnrollments(req, res) {
    try {
        const { studentId, courseOfferingId, status } = req.query;

        const where = {};

        if (studentId) where.studentId = studentId;
        if (courseOfferingId) where.courseOfferingId = courseOfferingId;
        if (status) where.status = status;

        const enrollments = await Enrollment.findAll({
            where,
            include: [
                {
                    model: Student,
                    as: "student",
                },
                {
                    model: CourseOffering,
                    as: "courseOffering",
                    include: [
                        {
                            model: Course,
                            as: "course",
                        },
                    ],
                },
            ],
            order: [["created_at", "DESC"]],
        });

        return res.status(200).json(enrollments);
    } catch (error) {
        console.error("Error fetching enrollments:", error);

        return res.status(500).json({
            message: "An error occurred while fetching enrollments.",
            error: error.message,
        });
    }
}

async function getEnrollmentById(req, res) {
    try {
        const { id } = req.params;

        const enrollment = await Enrollment.findByPk(id, {
            include: [
                {
                    model: Student,
                    as: "student",
                },
                {
                    model: CourseOffering,
                    as: "courseOffering",
                    include: [
                        {
                            model: Course,
                            as: "course",
                        },
                    ],
                },
            ],
        });

        if (!enrollment) {
            return res.status(404).json({
                message: "Enrollment not found.",
            });
        }

        return res.status(200).json(enrollment);
    } catch (error) {
        console.error("Error fetching enrollment:", error);

        return res.status(500).json({
            message: "An error occurred while fetching the enrollment.",
            error: error.message,
        });
    }
}

async function approveEnrollment(req, res) {
    try {
        const { id } = req.params;

        const enrollment = await Enrollment.findByPk(id);

        if (!enrollment) {
            return res.status(404).json({
                message: "Enrollment not found.",
            });
        }

        if (enrollment.status !== "PENDING") {
            return res.status(400).json({
                message: "Only pending enrollments can be approved.",
            });
        }

        await enrollment.update({
            status: "APPROVED",
            approvedBy: req.user.id,
            approvedAt: new Date(),
            rejectionReason: null,
        });

        return res.status(200).json({
            message: "Enrollment approved successfully.",
            enrollment,
        });
    } catch (error) {
        console.error("Error approving enrollment:", error);

        return res.status(500).json({
            message: "An error occurred while approving the enrollment.",
            error: error.message,
        });
    }
}

async function rejectEnrollment(req, res) {
    try {
        const { id } = req.params;
        const { rejectionReason } = req.body;

        const enrollment = await Enrollment.findByPk(id);

        if (!enrollment) {
            return res.status(404).json({
                message: "Enrollment not found.",
            });
        }

        if (enrollment.status !== "PENDING") {
            return res.status(400).json({
                message: "Only pending enrollments can be rejected.",
            });
        }

        await enrollment.update({
            status: "REJECTED",
            rejectionReason: rejectionReason || "No reason provided.",
            approvedBy: req.user.id,
            approvedAt: new Date(),
        });

        return res.status(200).json({
            message: "Enrollment rejected successfully.",
            enrollment,
        });
    } catch (error) {
        console.error("Error rejecting enrollment:", error);

        return res.status(500).json({
            message: "An error occurred while rejecting the enrollment.",
            error: error.message,
        });
    }
}

async function cancelEnrollment(req, res) {
    try {
        const { id } = req.params;

        const enrollment = await Enrollment.findByPk(id);

        if (!enrollment) {
            return res.status(404).json({
                message: "Enrollment not found.",
            });
        }

        if (enrollment.status === "CANCELLED") {
            return res.status(400).json({
                message: "Enrollment is already cancelled.",
            });
        }

        await enrollment.update({
            status: "CANCELLED",
        });

        return res.status(200).json({
            message: "Enrollment cancelled successfully.",
            enrollment,
        });
    } catch (error) {
        console.error("Error cancelling enrollment:", error);

        return res.status(500).json({
            message: "An error occurred while cancelling the enrollment.",
            error: error.message,
        });
    }
}

module.exports = {
    enrollStudent,
    getEnrollments,
    getEnrollmentById,
    approveEnrollment,
    rejectEnrollment,
    cancelEnrollment,
};