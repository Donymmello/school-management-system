const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const StudentAssessment = sequelize.define(
    "StudentAssessment",
     {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },

        enrollmentId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "enrollment_id",        
        },

        assessmentId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "assessment_id",        
        },

        score: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: true,
        },

        remarks: {
            type: DataTypes.TEXT,
            allowNull: true,
        },

        gradeAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "grade_at",
        },
    },
    {
        tableName: "student_assessments",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);

module.exports = StudentAssessment;