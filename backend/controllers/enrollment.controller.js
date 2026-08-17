const { Enrollment, CourseOffering, Student, Course } = require('../models');
const { tenantWhere } = require('../utils/tenantScope');
const { isUniqueConstraintError, respondUniqueConstraint } = require('../utils/dbErrors');
const { resolveOwnStudentId } = require('../utils/selfScope');

// Enrollment não tem schoolId próprio (ver docs/project-rules.md, seção 5) —
// o isolamento por escola é feito via join obrigatório no Student dono da
// matrícula.
function studentScope(req, extra = {}) {
    return {
        model: Student,
        as: "student",
        required: true,
        where: tenantWhere(req, extra),
    };
}

function courseOfferingScope(req) {
    return {
        model: CourseOffering,
        as: "courseOffering",
        required: true,
        include: [{ model: Course, as: "course", required: true, where: tenantWhere(req) }],
    };
}

async function enrollStudent(req, res) {
    try {
        const { studentId, courseOfferingId } = req.body;

        if (!studentId || !courseOfferingId) {
            return res.status(400).json({
                message: "studentId and courseOfferingId are required.",
            });
        }

        const student = await Student.findOne({ where: tenantWhere(req, { id: studentId }) });

        if (!student) {
            return res.status(404).json({
                message: "Student not found in this school.",
            });
        }

        const courseOffering = await CourseOffering.findOne({
            where: { id: courseOfferingId },
            include: [{ model: Course, as: "course", required: true, where: tenantWhere(req) }],
        });

        if (!courseOffering) {
            return res.status(404).json({
                message: "Course offering not found in this school.",
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
        if (isUniqueConstraintError(error)) {
            return res.status(409).json({ message: "Student is already enrolled in this course offering." });
        }
        console.error("Error enrolling student:", error);

        return res.status(500).json({
            message: "An error occurred while enrolling the student.",
        });
    }
}

async function getEnrollments(req, res) {
    try {
        const { studentId, courseOfferingId, status } = req.query;

        const where = {};

        // Portal do aluno: ignora studentId da query e força o próprio
        // registro (ver docs/project-rules.md, seção 6, item 5).
        if (req.user.role === "STUDENT") {
            const ownStudentId = await resolveOwnStudentId(req);
            if (!ownStudentId) return res.status(403).json({ message: "Student profile not found for this user." });
            where.studentId = ownStudentId;
        } else if (studentId) {
            where.studentId = studentId;
        }

        if (courseOfferingId) where.courseOfferingId = courseOfferingId;
        if (status) where.status = status;

        const enrollments = await Enrollment.findAll({
            where,
            include: [studentScope(req), courseOfferingScope(req)],
            order: [["created_at", "DESC"]],
        });

        return res.status(200).json(enrollments);
    } catch (error) {
        console.error("Error fetching enrollments:", error);

        return res.status(500).json({
            message: "An error occurred while fetching enrollments.",
        });
    }
}

async function getEnrollmentById(req, res) {
    try {
        const { id } = req.params;

        const enrollment = await Enrollment.findOne({
            where: { id },
            include: [studentScope(req), courseOfferingScope(req)],
        });

        if (!enrollment) {
            return res.status(404).json({
                message: "Enrollment not found.",
            });
        }

        // Portal do aluno: rota já permite STUDENT (histórico, ver
        // enrollment.routes.js), mas sem isso um aluno poderia ler a
        // matrícula de outro só adivinhando o :id.
        if (req.user.role === "STUDENT") {
            const ownStudentId = await resolveOwnStudentId(req);
            if (!ownStudentId || enrollment.studentId !== ownStudentId) {
                return res.status(404).json({ message: "Enrollment not found." });
            }
        }

        return res.status(200).json(enrollment);
    } catch (error) {
        console.error("Error fetching enrollment:", error);

        return res.status(500).json({
            message: "An error occurred while fetching the enrollment.",
        });
    }
}

async function approveEnrollment(req, res) {
    try {
        const { id } = req.params;

        const enrollment = await Enrollment.findOne({
            where: { id },
            include: [studentScope(req)],
        });

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
        });
    }
}

async function rejectEnrollment(req, res) {
    try {
        const { id } = req.params;
        const { rejectionReason } = req.body;

        const enrollment = await Enrollment.findOne({
            where: { id },
            include: [studentScope(req)],
        });

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
        });
    }
}

async function cancelEnrollment(req, res) {
    try {
        const { id } = req.params;

        const enrollment = await Enrollment.findOne({
            where: { id },
            include: [studentScope(req)],
        });

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
