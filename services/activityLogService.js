const ActivityLog = require("../models/sql/ActivityLog");

exports.createLog = async ({ userEmail, action, entity, entityId, metadata }) => {
    return await ActivityLog.create({ userEmail, action, entity, entityId, metadata });
}

exports.getAllLogs = async (filters = {}) => {
    const where = {};
    if (filters.userEmail) where.userEmail = filters.userEmail;
    if (filters.action) where.action = filters.action;

    return await ActivityLog.findAll({
        where,
        order: [["timestamp", "DESC"]]
    });
};

exports.getLogsByUser = async (email) => {
    return await ActivityLog.findAll({
        where: { userEmail: email},
        order: [["timestamp", "DESC"]],
    });

};


exports.deleteLogs = async () => {
    await ActivityLog.destroy({
        where: {},
        truncate: true,
    });

    return {message: "All activity logs have been deleted successfully."}

};