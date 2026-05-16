const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");


const LogAudit = sequelize.define(
  "LogAudit",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "user_id",
    },

    action: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    entity: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    entityId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "entidade_id",
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "logs_auditoria",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

module.exports = LogAudit;