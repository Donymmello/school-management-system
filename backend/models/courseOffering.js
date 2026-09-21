const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const CourseOffering = sequelize.define(
  "CourseOffering",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

    // Mesmo raciocínio de models/course.js: o código é gerado do código do curso
    // + ano + semestre, logo repete-se entre escolas. CourseOffering não tem
    // schoolId próprio — o isolamento faz-se pelo Course (ver
    // docs/project-rules.md, seção 5) — por isso a unicidade é por curso, que
    // já pertence a uma escola.
    code: {
      type: DataTypes.STRING(80),
      allowNull: false,
    },

    courseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "course_id",
    },

    academicYear: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "academic_year",
    },

    semester: {
      type: DataTypes.ENUM("S1", "S2"),
      allowNull: false,
    },

    capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 30,
    },

    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "course_offerings",
    indexes: [{ unique: true, name: "offering_course_code", fields: ["course_id", "code"] }],
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = CourseOffering;