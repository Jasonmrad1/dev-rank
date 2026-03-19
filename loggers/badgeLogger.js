const { log } = require("./logBuilder");
const { LOG_ACTIONS, LOG_ENTITIES } = require("../constants/activityLogEnums");

const logBadgeCreated = (userId, badgeName) => {
  log(userId, LOG_ACTIONS.CREATE_BADGE, LOG_ENTITIES.BADGE, userId, { badgeName });
};

const logBadgeUpdated = (userId, badgeName) => {
  log(userId, LOG_ACTIONS.UPDATE_BADGE, LOG_ENTITIES.BADGE, userId, { badgeName });
};

const logBadgeDeleted = (userId, badgeName) => {
  log(userId, LOG_ACTIONS.DELETE_BADGE, LOG_ENTITIES.BADGE, userId, { badgeName });
};

const logBadgeAwarded = (userId, targetUserId, badgeName) => {
  log(userId, LOG_ACTIONS.AWARD_BADGE, LOG_ENTITIES.BADGE, targetUserId, { badgeName });
};

const logBadgeRevoked = (userId, targetUserId, badgeName) => {
  log(userId, LOG_ACTIONS.REVOKE_BADGE, LOG_ENTITIES.BADGE, targetUserId, { badgeName });
};

module.exports = {
  logBadgeCreated,
  logBadgeUpdated,
  logBadgeDeleted,
  logBadgeAwarded,
  logBadgeRevoked,
};
