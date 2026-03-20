const Badge = require("../models/mongo/Badge");
const User = require("../models/mongo/User");
const AppError = require("../utils/AppError");
const ERROR_CODES = require("../utils/errorCodes");

exports.createBadge = async ({ name, description, icon, category, criteria, isActive }) => {
  const existing = await Badge.findOne({ name: { $regex: `^${name}$`, $options: "i" } });
  if (existing) {
    throw new AppError("A badge with this name already exists.", 409, ERROR_CODES.DUPLICATE);
  }
  return await Badge.create({
    name,
    description,
    icon,
    category: category || "achievement",
    criteria,
    isActive: isActive !== undefined ? isActive : true,
  });
};

exports.getAllBadges = async ({ category, isActive }) => {
  const filter = {};
  if (category) filter.category = category;
  if (isActive !== undefined) filter.isActive = isActive === "true";
  return await Badge.find(filter).sort({ createdAt: -1 });
};

exports.getBadge = async (id) => {
  const badge = await Badge.findById(id).populate("users", "name email avatarUrl");
  if (!badge) {
    throw new AppError("Badge not found.", 404, ERROR_CODES.NOT_FOUND);
  }
  return badge;
};

exports.getBadgeByName = async (name) => {
  const badge = await Badge.findOne({
    name: { $regex: `^${name}$`, $options: "i" }
  }).populate("users", "name email avatarUrl");

  if (!badge) {
    throw new AppError("Badge not found.", 404, ERROR_CODES.NOT_FOUND);
  }

  return badge;
};

exports.updateBadge = async (id, { name, description, icon, category, criteria, isActive }) => {
  if (name) {
    const existing = await Badge.findOne({
      name: { $regex: `^${name}$`, $options: "i" },
      _id: { $ne: id },
    });

    if (existing) {
      throw new AppError("A badge with this name already exists.", 409, ERROR_CODES.DUPLICATE);
    }
  }

  const badge = await Badge.findByIdAndUpdate(
    id,
    {
      name,
      description,
      icon,
      category,
      criteria,
      isActive,
      updatedAt: Date.now(),
    },
    { returnDocument: "after", runValidators: true }
  );

  if (!badge) {
    throw new AppError("Badge not found.", 404, ERROR_CODES.NOT_FOUND);
  }

  return badge;
};

exports.deleteBadge = async (id) => {
  const badge = await Badge.findById(id);
  if (!badge) {
    throw new AppError("Badge not found.", 404, ERROR_CODES.NOT_FOUND);
  }

  // Remove badge from all users that have it
  await User.updateMany({ badges: id }, { $pull: { badges: id } });

  await Badge.findByIdAndDelete(id);
};

exports.updateBadgeByName = async (name, { name: newName, description, icon, category, criteria, isActive }) => {
  const badge = await Badge.findOne({ name: { $regex: `^${name}$`, $options: "i" } });
  if (!badge) {
    throw new AppError("Badge not found.", 404, ERROR_CODES.NOT_FOUND);
  }

  if (newName && newName !== name) {
    const existing = await Badge.findOne({
      name: { $regex: `^${newName}$`, $options: "i" },
      _id: { $ne: badge._id },
    });
    if (existing) {
      throw new AppError("A badge with this name already exists.", 409, ERROR_CODES.DUPLICATE);
    }
  }

  return await Badge.findByIdAndUpdate(
    badge._id,
    {
      name: newName || name,
      description,
      icon,
      category,
      criteria,
      isActive,
      updatedAt: Date.now(),
    },
    { returnDocument: "after", runValidators: true }
  );
};

exports.deleteBadgeByName = async (name) => {
  const badge = await Badge.findOne({ name: { $regex: `^${name}$`, $options: "i" } });
  if (!badge) {
    throw new AppError("Badge not found.", 404, ERROR_CODES.NOT_FOUND);
  }

  // Remove badge from all users that have it
  await User.updateMany({ badges: badge._id }, { $pull: { badges: badge._id } });

  await Badge.findByIdAndDelete(badge._id);
};

exports.awardBadgeToUser = async (userId, badgeId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found.", 404, ERROR_CODES.NOT_FOUND);
  }

  const badge = await Badge.findById(badgeId);
  if (!badge) {
    throw new AppError("Badge not found.", 404, ERROR_CODES.NOT_FOUND);
  }

  if (user.badges && user.badges.includes(badgeId)) {
    throw new AppError("User already has this badge.", 409, ERROR_CODES.DUPLICATE);
  }

  await User.findByIdAndUpdate(userId, { $push: { badges: badgeId } });
  await Badge.findByIdAndUpdate(badgeId, { $push: { users: userId } });

  return { message: "Badge awarded successfully." };
};

exports.removeBadgeFromUser = async (userId, badgeId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found.", 404, ERROR_CODES.NOT_FOUND);
  }

  const badge = await Badge.findById(badgeId);
  if (!badge) {
    throw new AppError("Badge not found.", 404, ERROR_CODES.NOT_FOUND);
  }

  await User.findByIdAndUpdate(userId, { $pull: { badges: badgeId } });
  await Badge.findByIdAndUpdate(badgeId, { $pull: { users: userId } });

  return { message: "Badge removed successfully." };
};

exports.getUserBadges = async (userId) => {
  const user = await User.findById(userId).populate("badges");
  if (!user) {
    throw new AppError("User not found.", 404, ERROR_CODES.NOT_FOUND);
  }
  return user.badges || [];
};
