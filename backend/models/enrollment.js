const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Enrollment = sequelize.define(
    "Enrollment",
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

        studentId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "student_id",
        },
        courseOfferingId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "course_offering_id",
        },

        status: {
            type: DataTypes.ENUM("PENDING", "APPROVED", "REJECTED", "CANCELLED"),
            allowNull: false,
            defaultValue: "PENDING",
        },

        enrollmentDate: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            field: "enrollment_date",
        },

        aprovedBy: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: "approved_by",
        },

        approvedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "approved_at",
        },

        rejectionReason: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "rejection_reason",
        },

    },
    {
        tableName: "enrollments",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);

module.exports = Enrollment;