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

    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },

    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
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