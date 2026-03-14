const express = require("express");
const router = express.Router();
const activityLogController = require("../controllers/activityLogController");

// GET /api/logs - Get all activity logs
router.get("/", activityLogController.getAllLogs);

// GET /api/logs/user/:email - Get logs by user email
router.get("/user/:email", activityLogController.getLogsByUser);

//DELETE  /api.old?beforeDate=xxxx-xx-xx - Delete old logs
router.delete("/old", activityLogController.deleteOldLogs);

// DELETE /api/logs - Delete all logs
router.delete("/", activityLogController.deleteLogs);

module.exports = router;