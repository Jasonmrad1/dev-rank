const badgeService = require("../services/badgeService");
const asyncHandler = require("../middleware/asyncHandler");

// Create a new badge
exports.createBadge = asyncHandler(async (req, res) => {
  const badge = await badgeService.createBadge(req.body);
  res.status(201).json({ message: "Badge created successfully.", badge });
});

// Get all badges
exports.getAllBadges = asyncHandler(async (req, res) => {
  const badges = await badgeService.getAllBadges(req.query);
  res.status(200).json({ badges });
});

// Get badge by ID
exports.getBadge = asyncHandler(async (req, res) => {
  const badge = await badgeService.getBadge(req.params.id);
  res.status(200).json({ badge });
});

// Get badge by name
exports.getBadgeByName = asyncHandler(async (req, res) => {
  const badge = await badgeService.getBadgeByName(req.params.name);
  res.status(200).json({ badge });
});

// Update badge
exports.updateBadge = asyncHandler(async (req, res) => {
  const badge = await badgeService.updateBadge(req.params.id, req.body);
  res.status(200).json({ message: "Badge updated successfully.", badge });
});

// Delete badge
exports.deleteBadge = asyncHandler(async (req, res) => {
  await badgeService.deleteBadge(req.params.id);
  res.status(200).json({ message: "Badge deleted successfully." });
});

// Update badge by name
exports.updateBadgeByName = asyncHandler(async (req, res) => {
  const badge = await badgeService.updateBadgeByName(req.params.name, req.body);
  res.status(200).json({ message: "Badge updated successfully.", badge });
});

// Delete badge by name
exports.deleteBadgeByName = asyncHandler(async (req, res) => {
  await badgeService.deleteBadgeByName(req.params.name);
  res.status(200).json({ message: "Badge deleted successfully." });
});

// Award badge to user
exports.awardBadgeToUser = asyncHandler(async (req, res) => {
  const result = await badgeService.awardBadgeToUser(req.params.userId, req.params.badgeId);
  res.status(200).json(result);
});

// Remove badge from user
exports.removeBadgeFromUser = asyncHandler(async (req, res) => {
  const result = await badgeService.removeBadgeFromUser(req.params.userId, req.params.badgeId);
  res.status(200).json(result);
});

// Get user's badges
exports.getUserBadges = asyncHandler(async (req, res) => {
  const badges = await badgeService.getUserBadges(req.params.userId);
  res.status(200).json({ badges });
});
