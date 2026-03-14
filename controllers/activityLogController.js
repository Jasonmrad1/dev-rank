const activityLogService = require("../services/activityLogService");
// Get all activity logs
exports.getAllLogs = async (req, res) => {
  try {
    const logs = await activityLogService.getAllLogs(req.query);
    res.status(200).json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get logs by user email
exports.getLogsByUser = async (req, res) => {
  try {
    const logs = await activityLogService.getLogsByUser(req.params.email);
    res.status(200).json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete all logs
exports.deleteLogs = async (req, res) => {
  try {
    const result = await activityLogService.deleteLogs();
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//Delete old logs

exports.deleteOldLogs = async (req, res) => {
  try {
    const result = await activityLogService.deleteOldLogs(req.query.beforeDate);
    res.status(200).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

//Added old logs filter and delete