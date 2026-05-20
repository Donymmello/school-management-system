const {DataTypes} = require('sequelize');
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
        enrollmentDate: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            field: "enrollment_date",
        },
        status: {
            type: DataTypes.ENUM("ENROLLED", "COMPLETED", "DROPPED"),
            allowNull: false,
            defaultValue: "ENROLLED",
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