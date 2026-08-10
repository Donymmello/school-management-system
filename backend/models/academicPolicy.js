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

        // Cada escola tem sua própria política acadêmica (nota de dispensa de
        // exame, nota de aprovação podem variar por escola). Ver
        // docs/project-rules.md, seção 5.
        schoolId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "school_id",
        },

        active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
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
        indexes: [{ fields: ["school_id"] }],
    }
);

module.exports = AcademicPolicy;
