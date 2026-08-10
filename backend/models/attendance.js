const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');


const Attendance = sequelize.define(
  "Attendance",
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
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "date",
    },
    status: {
      type: DataTypes.ENUM("PRESENT", "ABSENT", "LATE", "JUSTIFIED"),
      allowNull: false,
      defaultValue: "PRESENT",
      field: "status",
    },
  },
  {
    tableName: "attendance",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
    // Um aluno só pode ter um registro de frequência por dia.
    indexes: [{ unique: true, fields: ["student_id", "date"] }],
  }
);

module.exports = Attendance;
