const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

// Tipos de documento de identidade aceites. Lista partilhada com o frontend
// (pages/students/StudentFormDialog.jsx) — os rótulos vivem lá, aqui ficam
// só os códigos guardados em base de dados.
const ID_DOCUMENT_TYPES = ["BI", "PASSPORT", "OTHER"];

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
      unique: true,
      field: "user_id",
    },

    schoolId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "school_id",
    },

    classroomId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "classroom_id",
    },

    // Turma pedagógica (SECONDARY) — ver backend/models/turma.js. Separado
    // de classroomId (sala física) de propósito: um é "a que turma o aluno
    // pertence", outro é "em que sala". Nulo pra alunos HIGHER_ED (que usam
    // Enrollment/CourseOffering em vez de turma) ou SECONDARY ainda sem
    // turma atribuída — campo aditivo, não obrigatório, pra não quebrar
    // alunos já cadastrados antes desta rodada.
    turmaId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "turma_id",
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

    // TIPO do documento, não o número (o número é o idNumber abaixo). Guardado
    // como código e não como ENUM de propósito: no PostgreSQL um ENUM é um tipo
    // e acrescentar um valor exige ALTER TYPE — aqui é esperado que a lista
    // cresça (cédula, carta de condução, DIRE...) sem migração.
    // NÃO tem unique: era único global quando servia de número, o que agora
    // deixaria uma única pessoa no sistema inteiro poder ter "BI".
    idCard: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: "id_card",
      validate: {
        isIn: {
          args: [ID_DOCUMENT_TYPES],
          msg: `idCard must be one of: ${ID_DOCUMENT_TYPES.join(", ")}.`,
        },
      },
    },

    // Número do documento escolhido em idCard.
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
    // Por escola, não global: a mesma pessoa pode estar inscrita em duas
    // escolas da plataforma, e um único global impedia a segunda. Mesmo
    // raciocínio do models/subject.js — ver docs/project-rules.md, secção 5.
    indexes: [{ unique: true, name: "student_school_id_number", fields: ["school_id", "id_number"] }],
  }
);

module.exports = Student;
module.exports.ID_DOCUMENT_TYPES = ID_DOCUMENT_TYPES;