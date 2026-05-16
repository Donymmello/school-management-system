const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Grade = sequelize.define(
  "Grade",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "student_id"
    },
    teacherId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "teacher_id"
    },
    subjectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "subject_id"
    },
    score: {
      type: DataTypes.FLOAT,
      allowNull: false,
      field: "score"
    },
    term: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "term"
    }
  },
  {
    tableName: "grades",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

module.exports = Grade;