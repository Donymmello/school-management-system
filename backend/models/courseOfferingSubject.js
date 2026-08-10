const {DataTypes} = require('sequelize');
const sequelize = require('../config/db');

const CourseOfferingSubject = sequelize.define(
    "CourseOfferingSubject",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },

        courseOfferingId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "course_offering_id"
        },

        subjectId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "subject_id"
        },

        teacherId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: "teacher_id"
        },

        weeklyHours: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 4,
            field: "weekly_hours"
        },

        startDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            field: "start_date"
        },

        endDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            field: "end_date"
        },

        status: {
            type: DataTypes.ENUM("PLANNED", "ACTIVE", "COMPLETED", "CANCELED"),
            defaultValue: "PLANNED",
        },
    },
    {
        tableName: "course_offering_subjects",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        // Uma disciplina não pode ser atribuída duas vezes à mesma oferta —
        // garantia real é essa constraint (ver docs/project-rules.md, seção 0).
        indexes: [{ unique: true, fields: ["course_offering_id", "subject_id"] }],
    }
);

module.exports = CourseOfferingSubject;
