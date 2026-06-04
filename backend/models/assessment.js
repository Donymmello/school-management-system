const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Assessment = sequelize.define(
    "Assessment",
     {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },

        courseOfferingSubjectId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "course_offering_subject_id",
        },

        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        type: {
            type: DataTypes.ENUM("TEST", "ASSIGNMENT", "PROJECT", "EXAM"),
            allowNull: false,
        },

        category: {
            type: DataTypes.ENUM(
                "CONTINUOUS",
                "EXAM"
            ),
            allowNull: false,
            defaultValue: "CONTINUOUS",
        },

        maxScore: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: false,
            defaultValue: 20,
            field: "max_score",
        },

        weight: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: false,
            comment: "Percentage",
        },

        assessmentDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            field: "assessment_date",
        },

        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },

        status: {
            type: DataTypes.ENUM("DRAFT", "PUBLISHED", "CLOSED"),
            defaultValue: "DRAFT",
        },
    },
    {
        tableName: "assessments",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);

module.exports = Assessment;
