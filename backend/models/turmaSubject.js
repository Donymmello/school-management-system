const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

/*
  Atribuição de disciplina+professor a uma Turma — equivalente pro lado
  SECONDARY do que CourseOfferingSubject é pro HIGHER_ED (ver
  backend/models/courseOfferingSubject.js). É essa tabela que resolve a
  relação professor↔turma↔disciplina que faltava pro Portal do Professor
  (ver docs/project-rules.md, seção 6, item 7) — hoje só isso: quem
  leciona o quê pra qual turma. Sem Horário/Avaliação (fica pra quando/se
  o Portal do Professor for construído de verdade).
*/
const TurmaSubject = sequelize.define(
  "TurmaSubject",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    turmaId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "turma_id",
    },

    subjectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "subject_id",
    },

    teacherId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "teacher_id",
    },

    weeklyHours: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 2,
      field: "weekly_hours",
    },
  },
  {
    tableName: "turma_subjects",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    // Uma disciplina não pode ser atribuída duas vezes à mesma turma —
    // mesma garantia que CourseOfferingSubject tem pro lado HIGHER_ED.
    indexes: [{ unique: true, fields: ["turma_id", "subject_id"] }],
  }
);

module.exports = TurmaSubject;
