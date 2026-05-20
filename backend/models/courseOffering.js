const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const CourseOffering = sequelize.define(
  "CourseOffering",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

    code: {
      type: DataTypes.STRING(80),
      allowNull: false,
      unique: true,
    },

    courseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "course_id",
    },

    academicYear: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "academic_year",
    },

    semester: {
      type: DataTypes.ENUM("S1", "S2"),
      allowNull: false,
    },

    capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 30,
    },

    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "course_offerings",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = CourseOffering;