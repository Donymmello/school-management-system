const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Teacher = sequelize.define(
  "Teacher",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "name"
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "subject"
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: "email"
    }
  },
  {
    tableName: "teachers",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false
  }
);

module.exports = Teacher;
