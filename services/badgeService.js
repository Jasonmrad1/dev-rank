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

exports.getBadge = async (badgeId) => {
  const badge = await Badge.findById(badgeId).populate("users", "name email avatarUrl");
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

exports.updateBadge = async (badgeId, { name, description, icon, category, criteria, isActive }) => {
  if (name) {
    const existing = await Badge.findOne({
      name: { $regex: `^${name}$`, $options: "i" },
      _id: { $ne: badgeId },
    });

    if (existing) {
      throw new AppError("A badge with this name already exists.", 409, ERROR_CODES.DUPLICATE);
    }
  }

  const badge = await Badge.findByIdAndUpdate(
    badgeId,
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

exports.deleteBadge = async (badgeId) => {
  const badge = await Badge.findById(badgeId);
  if (!badge) {
    throw new AppError("Badge not found.", 404, ERROR_CODES.NOT_FOUND);
  }

  // Remove badge from all users that have it
  await User.updateMany({ badges: badgeId }, { $pull: { badges: badgeId } });

  await Badge.findByIdAndDelete(badgeId);
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
