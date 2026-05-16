const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');


const Attendance = sequelize.define(
  "Attendace",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "student_id",
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "date",
    },
    present: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "present",
    },
  },
  {
    tableName: "attendance",
    timestamps: true,
    createAt: "created_at",
    updateAt: false,
  }
);

module.exports = Attendance;
