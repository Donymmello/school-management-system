const {
    Schedule,
    CourseOfferingSubject,
    Classroom,
    Subject,
} = require('../models');

const { Op } = require('sequelize');
const { tenantWhere } = require('../utils/tenantScope');

// Schedule não tem schoolId próprio (ver docs/project-rules.md, seção 5) — o
// isolamento por escola é feito via join obrigatório em
// CourseOfferingSubject -> Subject (subjectId nunca é nulo; classroomId é
// opcional, por isso não dá pra confiar só nele).
function courseOfferingSubjectScope(req) {
    return {
        model: CourseOfferingSubject,
        as: "courseOfferingSubject",
        required: true,
        include: [{ model: Subject, as: "subject", required: true, where: tenantWhere(req) }],
    };
}

async function createSchedule(req, res) {
    try {
        const {
            courseOfferingSubjectId,
            classroomId,
            dayOfWeek,
            startTime,
            endTime,
        } = req.body;

        if (
            !courseOfferingSubjectId ||
            !classroomId ||
            !dayOfWeek ||
            !startTime ||
            !endTime
        ) {
            return res.status(400).json({
                message: "All fields are required",
            });
        }

        if (startTime >= endTime) {
            return res.status(400).json({
                message: "End time must be greater than start time.",
            });
        }

        const courseOfferingSubject = await CourseOfferingSubject.findOne({
            where: { id: courseOfferingSubjectId },
            include: [{ model: Subject, as: "subject", required: true, where: tenantWhere(req) }],
        });

        if (!courseOfferingSubject) {
            return res.status(404).json({
                message: "Course offering subject not found in this school",
            });
        }

        const classroom = await Classroom.findOne({ where: tenantWhere(req, { id: classroomId }) });

        if (!classroom) {
            return res.status(404).json({
                message: "Classroom not found in this school",
            });
        }

        const classroomConflict =
            await Schedule.findOne({
                where: {
                    classroomId,
                    dayOfWeek,
                    startTime: {
                        [Op.lt]: endTime,
                    },
                    endTime: {
                        [Op.gt]: startTime,
                    },
                },
            });

        if (classroomConflict) {
            return res.status(400).json({
                message: "Classroom is already booked for the selected time slot.",
            });
        }

        const schedule = await Schedule.create({
            courseOfferingSubjectId,
            classroomId,
            dayOfWeek,
            startTime,
            endTime,
        });

        return res.status(201).json({
            message: "Schedule created successfully",
            schedule,
        });
    } catch (error) {
        console.error(
            "Error creating schedule:",
            error
        );

        return res.status(500).json({
            message:
                "An error occurred while creating the schedule.",
        });
    }
}

async function getAllSchedules(req, res) {
    try {
        const schedules = await Schedule.findAll({
            include: [
                courseOfferingSubjectScope(req),
                { association: "classroom" },
            ],
        });

        return res.status(200).json(
            schedules
        );
    } catch (error) {
        return res.status(500).json({
            message: "An error occurred while fetching schedules.",
        });
    }
}

async function getScheduleById(req, res) {
    try {
        const schedule = await Schedule.findOne({
            where: { id: req.params.id },
            include: [
                courseOfferingSubjectScope(req),
                { association: "classroom" },
            ],
        });

        if (!schedule) {
            return res.status(404).json({
                message: "Schedule not found",
            });
        }

        return res.status(200).json(
            schedule
        );
    } catch (error) {
        return res.status(500).json({
            message: "An error occurred while fetching the schedule.",
        });
    }
}

async function updateSchedule(req, res) {
    try {
        const schedule = await Schedule.findOne({
            where: { id: req.params.id },
            include: [courseOfferingSubjectScope(req)],
        });

        if (!schedule) {
            return res.status(404).json({
                message: "Schedule not found",
            });
        }

        const { classroomId, dayOfWeek, startTime, endTime, status } = req.body;

        if (classroomId) {
            const classroom = await Classroom.findOne({ where: tenantWhere(req, { id: classroomId }) });
            if (!classroom) {
                return res.status(404).json({ message: "Classroom not found in this school" });
            }
        }

        await schedule.update({
            classroomId: classroomId ?? schedule.classroomId,
            dayOfWeek: dayOfWeek ?? schedule.dayOfWeek,
            startTime: startTime ?? schedule.startTime,
            endTime: endTime ?? schedule.endTime,
            status: status ?? schedule.status,
        });

        return res.status(200).json({
            message: "Schedule updated successfully",
            schedule,
        });
    } catch (error) {
        return res.status(500).json({
            message: "An error occurred while updating the schedule.",
        });
    }
}

async function deleteSchedule(req, res) {
    try {
        const schedule = await Schedule.findOne({
            where: { id: req.params.id },
            include: [courseOfferingSubjectScope(req)],
        });

        if (!schedule) {
            return res.status(404).json({
                message: "Schedule not found",
            });
        }

        await schedule.destroy();

        return res.status(200).json({
            message:
             "Schedule deleted successfully",
        });
    } catch (error) {
        return res.status(500).json({
            message: "An error occurred while deleting the schedule.",
        });
    }
}

module.exports = {
    createSchedule,
    getAllSchedules,
    getScheduleById,
    updateSchedule,
    deleteSchedule,
};
