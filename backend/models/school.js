const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const School = sequelize.define("School", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  logo: {
    type: DataTypes.STRING,
    allowNull: true
  },
  plan: {
    type: DataTypes.ENUM("FREE", "BASIC", "PREMIUM"),
    allowNull: false,
  },
  // Decide se a escola opera no modelo de ensino secundário (turma fixa por
  // série, Classroom/Student.grade/Grade/Attendance) ou técnico/superior
  // (créditos/ofertas, Course/CourseOffering/Enrollment/Assessment). Fixo no
  // cadastro de propósito — ver docs/project-rules.md, seção 5: os dois
  // modelos de dado são incompatíveis o suficiente pra não valer a pena um
  // toggle editável depois sem uma migração de dado real por trás.
  academicModel: {
    type: DataTypes.ENUM("SECONDARY", "HIGHER_ED"),
    allowNull: false,
    field: "academic_model",
  },
  status: {
    type: DataTypes.ENUM("ACTIVE", "INACTIVE"),
    defaultValue: "ACTIVE"
  },
},
{
    tableName: "schools",
    underscored: true,
    timestamps: true,
});

module.exports = School;