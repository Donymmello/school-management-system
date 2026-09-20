const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

/*
  Turma pedagógica — só faz sentido pra escolas SECONDARY (ver
  requireAcademicModel("SECONDARY") nas rotas). Não confundir com
  Classroom (sala física, ver backend/models/classroom.js) — Turma é o
  agrupamento aluno+professor+disciplina (ex: "9ºA"), Classroom é só a
  sala onde as aulas acontecem. Uma Turma pode opcionalmente ter uma sala
  "principal" via classroomId.

  Escopo desta rodada (fase 6 do roadmap de execução, ver
  docs/project-rules.md): só a turma em si + a atribuição de
  disciplina/professor (TurmaSubject). Sem ano letivo formal ainda —
  academicYear aqui é texto livre, mesmo tratamento que Grade.term já
  tinha antes desta rodada. Sem Horário/Avaliação pra SECONDARY ainda
  (isso ficou só do lado HIGHER_ED via Schedule/Assessment) — decisão
  explícita de escopo, não esquecimento.
*/
const Turma = sequelize.define(
  "Turma",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    schoolId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "school_id",
      unique: "turma_school_name",
    },

    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: "turma_school_name",
    },

    grade: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    classroomId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "classroom_id",
    },

    academicYear: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: "academic_year",
    },

    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "turmas",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = Turma;
