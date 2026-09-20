const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

/*
  Horário de aula pra Turma pedagógica (SECONDARY, Fase 9a — ver
  docs/project-rules.md, seção 6). Espelha backend/models/schedule.js
  (o Schedule ligado a CourseOfferingSubject, exclusivo de HIGHER_ED) —
  criado como model separado em vez de reaproveitar Schedule com um FK a
  mais, mesmo padrão já usado em Turma/TurmaSubject na Fase 6 (paralelo a
  Classroom/CourseOfferingSubject, não uma fusão dos dois). Isso evita
  nullable-FK-soup (Schedule teria dois FKs mutuamente exclusivos) e não
  arrisca a lógica de conflito de sala do HIGHER_ED que já está em produção.
*/
const TurmaSchedule = sequelize.define(
  "TurmaSchedule",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    turmaSubjectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "turma_subject_id",
    },
    classroomId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "classroom_id",
    },
    dayOfWeek: {
      type: DataTypes.ENUM("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"),
      allowNull: false,
      field: "day_of_week",
    },
    startTime: {
      type: DataTypes.TIME,
      allowNull: false,
      field: "start_time",
    },
    endTime: {
      type: DataTypes.TIME,
      allowNull: false,
      field: "end_time",
    },
    status: {
      type: DataTypes.ENUM("ACTIVE", "INACTIVE"),
      defaultValue: "ACTIVE",
    },
  },
  {
    tableName: "turma_schedules",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = TurmaSchedule;
