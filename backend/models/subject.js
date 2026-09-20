const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Subject = sequelize.define(
  "Subject",
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
    },

    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    code: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    level: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    workloadHours: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "workload_hours",
    },

    credits: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "subjects",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    // Unicidade é POR ESCOLA, nunca global: duas escolas podem ter ambas uma
    // "Matemática". Tem de ser declarada aqui e não em `unique:` na coluna,
    // porque a mesma coluna (school_id) participa em duas constraints
    // compostas diferentes e a forma abreviada não sabe exprimir isso — ver
    // docs/project-rules.md, secção 0.
    indexes: [
      { unique: true, name: "subject_school_name", fields: ["school_id", "name"] },
      { unique: true, name: "subject_school_code", fields: ["school_id", "code"] },
    ],
  }
);

module.exports = Subject;