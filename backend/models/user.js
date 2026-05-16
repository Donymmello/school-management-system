const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

/*
  Modelo User:
  representa os utilizadores que entram no sistema.
*/
const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },

    employeeCode: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
      field: "employee_code",
    },

    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "password_hash",
    },

    role: {
      type: DataTypes.ENUM(
        "SUPER_ADMIN",
        "ADMIN",
        "TEACHER",
        "DIRECTOR",
        "SECRETARY",
        "STUDENT",
        "USER"),
      allowNull: false,
      defaultValue: "USER",
    },

    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "users",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = User;