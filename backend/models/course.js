const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Course = sequelize.define(
  "Course",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
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
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = Course;