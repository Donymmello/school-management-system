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
    },

    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },

    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
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
    // Mesmo raciocínio de models/subject.js: unicidade por escola, declarada
    // em `indexes` porque school_id entra em duas constraints compostas.
    indexes: [
      { unique: true, name: "classroom_school_name", fields: ["school_id", "name"] },
      { unique: true, name: "classroom_school_code", fields: ["school_id", "code"] },
    ],
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = Classroom;