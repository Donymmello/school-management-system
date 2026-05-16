const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Subject = sequelize.define(
    "Subject",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        code: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        gradeId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    },
    {
        tableName: "subjects",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: false,
    }
);

module.exports = Subject;
