const {DataTypes} = require("sequelize");
const sequelize = require("../config/db");

const AcademicPolicy = sequelize.define(
    "AcademicPolicy",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },

        minimumExamExemption: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: false,
            defaultValue: 14,
            field: "minimum_exam_exemption",
        },

        passingGrade: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: false,
            defaultValue: 10,
            field: "passing_grade",
        },
    },
    {
        tableName: "academic_policies",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);

module.exports = AcademicPolicy;
