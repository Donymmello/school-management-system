const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Student = sequelize.define(
  "Student",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    studentCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: "student_code",
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "user_id",
    },

    classroomId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "classroom_id",
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "name",
    },

    birthday: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: "birthday",
    },

    grade: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "grade",
    },

    email: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "email",
    },

    telephone: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    idCard: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "id_card",
    },
    
    idNumber: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "id_number",
    },

    notes: {
      type: DataTypes.FLOAT,
      allowNull: true,
      field: "notes",
    },
  },
  {
    tableName: "students",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

module.exports = Student;