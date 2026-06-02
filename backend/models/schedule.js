const {DataTypes} = require('sequelize');
const sequelize = require('../config/db');

const Schedule = sequelize.define('Schedule', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  courseOfferingSubjectId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'course_offering_subject_id',
  },

  classroomId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'classroom_id'
  },

  dayOfWeek: {
    type: DataTypes.ENUM(
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"
    ),
    allowNull: false,
    field: 'day_of_week'
  },

  startTime: {
    type: DataTypes.TIME,
    allowNull: false,
    field: 'start_time'
  },

  endTime: {
    type: DataTypes.TIME,
    allowNull: false,
    field: 'end_time'
  },

  status: {
    type: DataTypes.ENUM(
        "ACTIVE",
        "INACTIVE"
    ),
    defaultValue: "ACTIVE",
},
},
{
  tableName: 'schedules',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Schedule;