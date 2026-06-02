const {
    Schedule,
    CourseOfferingSubject,
    Classroom,
} = require('../models');

const { Op } = require('sequelize');

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

        const courseOfferingSubject =
            await CourseOfferingSubject.findByPk(
                courseOfferingSubjectId
            );

        if (!courseOfferingSubject) {
            return res.status(404).json({
                message: "Course offering subject not found",
            });
        }

        const classroom =
            await Classroom.findByPk(classroomId);

        if (!classroom) {
            return res.status(404).json({
                message: "Classroom not found",
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

        const shedule = await Schedule.create({
            courseOfferingSubjectId,
            classroomId,
            dayOfWeek,
            startTime,
            endTime,
        });

        return res.status(201).json({
            message: "Schedule created successfully",
            shedule,
        });
    } catch (error) {
        console.error(
            "Error creating schedule:",
            error
        );

        return res.status(500).json({
            message:
                "An error occurred while creating the schedule.",
            error: error.message,
        });
    }
}

async function getAllSchedules(req, res) {
    try {
        const schedules = await Schedule.findAll({
            include: [
                {
                    association:
                        "courseOfferingSubject",
                },
                {
                    association: "classroom",
                },
            ],
        });

        return res.status(200).json(
            schedules
        );
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }   
}

async function getScheduleById(req, res) {
    try {
        const schedule =
            await Schedule.findByPk(
                req.params.id,
                {
                    include: [
                        {
                            association:
                                "courseOfferingSubject",
                        },
                        {
                            association: 
                            "classroom",
                        },
                    ],
                }
            );

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
            message: error.message,
        });
    }
}

async function updateSchedule(req, res) {
    try {
        const schedule =
            await Schedule.findByPk(
                req.params.id
            );

        if (!schedule) {
            return res.status(404).json({
                message: "Schedule not found",
            });
        }

        await schedule.update(req.body);

        return res.status(200).json({
            message: "Schedule updated successfully",
            schedule,
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
}

async function deleteSchedule(req, res) {
    try {
        const schedule =
            await Schedule.findByPk(
                req.params.id
            );
            
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
            message: error.message,
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