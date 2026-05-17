const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Staff = sequelize.define(
  "Staff",
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
      allowNull: false,
      unique: true,
      field: "employee_code",
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    position: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    department: {
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
    tableName: "staff",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

module.exports = Staff;