const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

/*
  Modelo User:
  representa os utilizadores que entram no sistema.
*/
const User = sequelize.define(
  "User",
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

    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },

    employeeCode: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
      field: "employee_code",
    },

    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "password_hash",
    },

    role: {
      // "STAFF" faltava aqui — o ENUM real do banco não tinha o valor, apesar
      // de auth.controller.js (registerUser) e todas as rotas/middlewares já
      // tratarem STAFF como papel válido há várias rodadas. Qualquer
      // `User.create({ role: "STAFF" })` teria falhado na validação do
      // Sequelize antes mesmo de chegar no banco — bug pego ao formalizar a
      // lista de papéis (ver docs/project-rules.md, seção 4 e 7).
      //
      // "SECRETARY" é legado: foi unificado em STAFF (os dois papéis
      // faziam a mesma coisa administrativa). Continua no ENUM só pra não
      // quebrar linhas antigas do banco que já tenham esse valor — nenhum
      // caminho de cadastro novo oferece SECRETARY mais. Ver
      // docs/project-rules.md, seção 7, e o script de migração em
      // backend/scripts/migrate-secretary-to-staff.js pra converter
      // usuários SECRETARY existentes.
      type: DataTypes.ENUM(
        "SUPER_ADMIN",
        "ADMIN",
        "TEACHER",
        "DIRECTOR",
        "SECRETARY",
        "STAFF",
        "STUDENT",
        "USER"),
      allowNull: false,
      defaultValue: "USER",
    },

    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "users",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = User;