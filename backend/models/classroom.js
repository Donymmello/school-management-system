const {DataTypes} = require('sequelize');
const sequelize = require('../config/db');

const Classroom = sequelize.define(
    "Classroom",
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
        year: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        gradeId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    },
    {
        tableName: "classrooms",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: false,
    }
);

module.exports = Classroom;