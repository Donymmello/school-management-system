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
        // Um aluno não pode ter duas matrículas na mesma oferta — a garantia
        // real é essa constraint (ver docs/project-rules.md, seção 0), o
        // catch de SequelizeUniqueConstraintError no controller é só UX.
        indexes: [{ unique: true, fields: ["student_id", "course_offering_id"] }],
    }
);

module.exports = Enrollment;