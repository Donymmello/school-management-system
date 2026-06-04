const {
    CourseOfferingSubject,
    CourseOffering,
    Subject,
    Teacher,
} = require('../models');

async function createCourseOfferingSubject(req, res) {
    try {
        const {
            courseOfferingId,
            subjectId,
            teacherId,
            weeklyHours,
            startDate,
            endDate,
        } = req.body;

        const offering = await CourseOffering.findByPk(courseOfferingId);
        
        if (!offering) {
            return res.status(404).json({
              message: "Course offering not found",
            });
        }

        const subject = await Subject.findByPk(subjectId);
        
        if (!subject) {
            return res.status(404).json({
              message: "Subject not found",
            });
        }

        const exists = await CourseOfferingSubject.findOne({
            where: {
                courseOfferingId,
                subjectId,
            },
        });

        if (exists) {
            return res.status(400).json({
              message: "This subject is already assigned to the course offering",
            });
        }

        const item = await CourseOfferingSubject.create({
            courseOfferingId,
            subjectId,
            teacherId,
            weeklyHours,
            startDate,
            endDate,
        });

        return res.status(201).json({
            message: "Subject assigned to course offering successfully",
            data: item,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: error.message,
        });
    }
}

async function getAllCourseOfferingSubjects(req, res) {
    try {
        const data = await CourseOfferingSubject.findAll({
            include: [
                {
                    model: CourseOffering,
                    as: "courseOffering",
                },
                {
                    model: Subject,
                    as: "subject",
                },
                {
                    model: Teacher,
                    as: "teacher",
                },
                
            ],
        });

        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
}

async function getCourseOfferingSubjectById(req, res) {
    try {
        const item = await CourseOfferingSubject.findByPk(
            req.params.id,
            {
                include: [
                    {
                        model: CourseOffering,
                        as: "courseOffering",
                    },
                    {
                        model: Subject,
                        as: "subject",
                    },
                    {
                        model: Teacher,
                        as: "teacher",
                    },
                    
                ],
            }
        );

        if (!item) {
            return res.status(404).json({
                message: "Course offering subject not found",
            });
        }

        return res.status(200).json(item);
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
}

async function updateCourseOfferingSubject(req, res) {
    try {
        const { id } = req.params;
        const { teacherId, weeklyHours, startDate, endDate, status } = req.body;

        const item = await CourseOfferingSubject.findByPk(id);

        if (!item) {
            return res.status(404).json({
                message: "Course offering subject not found",
            });
        }

        await item.update({
            teacherId,
            weeklyHours,
            startDate,
            endDate,
            status,
        });

        return res.status(200).json({
            message: "Course offering subject updated successfully",
            data: item,
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
}

module.exports = {
    createCourseOfferingSubject,
    getAllCourseOfferingSubjects,
    getCourseOfferingSubjectById,
    updateCourseOfferingSubject,
};