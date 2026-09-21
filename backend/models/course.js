const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Course = sequelize.define(
  "Course",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

    // Sem `unique` de coluna: o código é gerado de faculty+name
    // (utils/generateCode.js), por isso duas escolas com um curso do mesmo nome
    // na mesma faculdade geram o MESMO código. Enquanto foi único global, a
    // segunda escola ficava impedida de criar o curso. Unicidade por escola em
    // `indexes`, abaixo.
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },

    schoolId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "school_id",
      unique: "course_school_name_faculty",
    },

    name: {
      type: DataTypes.ENUM(
        "SOFTWARE_ENGINEERING",
        "CIVIL_ENGINEERING",
        "COMPUTER_ENGINEERING",
        "DATA_SCIENCE",
        "ACCOUNTING",
        "FINANCE",
        "MEDICINE",
        "NURSING",
        "MATHEMATICS",
        "PHYSICS",
        "OTHER"
      ),
      allowNull: false,
      unique: "course_school_name_faculty",
    },

    displayName: {
      type: DataTypes.STRING(150),
      allowNull: false,
      field: "display_name",
    },

    faculty: {
      type: DataTypes.ENUM(
        "ENGINEERING",
        "ECONOMICS",
        "MEDICINE",
        "SCIENCES",
        "OTHER"
      ),
      allowNull: false,
      unique: "course_school_name_faculty",
    },

    durationYears: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "duration_years",
    },

    degreeLevel: {
      type: DataTypes.ENUM("CERTIFICATE", "DIPLOMA", "BACHELOR", "MASTER", "PHD"),
      allowNull: false,
      defaultValue: "BACHELOR",
      field: "degree_level",
    },

    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "courses",
    indexes: [{ unique: true, name: "course_school_code", fields: ["school_id", "code"] }],
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = Course;