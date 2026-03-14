const ActivityLog = require("../models/sql/ActivityLog");
const {Op} = require("sequelize");

exports.createLog = async ({ userEmail, action, entity, entityId, metadata }) => {
    return await ActivityLog.create({ userEmail, action, entity, entityId, metadata });
}


exports.getAllLogs = async (filters = {}) => {
    const where = {};
    if (filters.userEmail) where.userEmail = filters.userEmail;
    if (filters.action) where.action = filters.action;
    if (filters.entity) where.entity = filters.entity;

    if (filters.startDate || filters.endDate) {
        where.timestamp = {};

        if (filters.startDate) {
            where.timestamp[Op.gte] = new Date(filters.startDate);
        }

        if (filters.endDate) {
            const end = new Date(filters.endDate);
            end.setHours(23, 59, 59, 999);
            where.timestamp[Op.lte] = end;
        }
    }

    return await ActivityLog.findAll({
        where,
        order: [["timestamp", "DESC"]]
    });
};

exports.getLogsByUser = async (email) => {
    return await ActivityLog.findAll({
        where: { userEmail: email },
        order: [["timestamp", "DESC"]],
    });

};


exports.deleteLogs = async () => {
    await ActivityLog.destroy({
        where: {},
        truncate: true,
    });

    return { message: "All activity logs have been deleted successfully." }

};


exports.deleteOldLogs = async (beforeDate) => {
    if (!beforeDate) {
        const err = new Error("beforeDate query parameter is required.");
        err.status = 400;
        throw err;
    }

    const deletedCount = await ActivityLog.destroy({
        where: {
            timestamp: {
                [Op.lt]: new Date(beforeDate),
            },
        },
    });

    return {
        message: "Old activity logs deleted successfully.",
        deletedCount,
    };
};

//Added delete old logs and it's filter