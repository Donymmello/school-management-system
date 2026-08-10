const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Subject = sequelize.define(
  "Subject",
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
      unique: ["subject_school_code", "subject_school_name"],
    },

    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: "subject_school_name",
    },

    code: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: "subject_school_code",
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    level: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    workloadHours: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "workload_hours",
    },

    credits: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "subjects",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = Subject;