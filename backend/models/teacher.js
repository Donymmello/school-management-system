const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Teacher = sequelize.define(
  "Teacher",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "user_id",
    },

    employeeCode: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
      field: "employee_code",
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    subject: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
  },
  {
    tableName: "teachers",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

module.exports = Teacher;