const { DataTypes } = require("sequelize");
const sequelize = require("../../config/sqlite");

const ActivityLog = sequelize.define("ActivityLog", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userEmail: {
    type: DataTypes.STRING,
  },
  userRole: {
    type: DataTypes.STRING,
  },
  action: {
    type: DataTypes.STRING,
  },
  entityType: {
    type: DataTypes.STRING,
  },
  entityId: {
    type: DataTypes.STRING,
  },
  metadata: {
    type: DataTypes.TEXT,
  },
  ipAddress: {
    type: DataTypes.STRING,
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

module.exports = ActivityLog;
