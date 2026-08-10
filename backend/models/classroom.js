const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Classroom = sequelize.define(
  "Classroom",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    schoolId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "school_id",
      unique: ["classroom_school_code", "classroom_school_name"],
    },

    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: "classroom_school_code",
    },

    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: "classroom_school_name",
    },

    block: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 30,
    },

    type: {
      type: DataTypes.ENUM("NORMAL", "LAB", "AUDITORIUM", "OFFICE", "OTHER"),
      allowNull: false,
      defaultValue: "NORMAL",
    },

    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "classrooms",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = Classroom;