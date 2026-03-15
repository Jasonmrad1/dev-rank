const userService = require("../services/userService");
const asyncHandler = require("../middleware/asyncHandler");

// Register a new user
exports.register = asyncHandler(async (req, res) => {
  const user = await userService.registerUser(req.body);
  res.status(201).json({ message: "User registered successfully.", user });
});

// Get all users
exports.getAllUsers = asyncHandler(async (req, res) => {
  const users = await userService.getAllUsers();
  res.status(200).json({ users });
});

// Get user profile
exports.getUser = asyncHandler(async (req, res) => {
  const user = await userService.getUser(req.params.id);
  res.status(200).json({ user });
});

// Get user by name
exports.getUserByName = asyncHandler(async (req, res) => {
  const user = await userService.getUserByName(req.params.name);
  res.status(200).json({ user });
});

// Update user
exports.updateUser = asyncHandler(async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body);
  res.status(200).json({ message: "User updated successfully.", user });
});

// Delete user
exports.deleteUser = asyncHandler(async (req, res) => {
  await userService.deleteUser(req.params.id);
  res.status(200).json({ message: "User deleted successfully." });
});

// Add skills to user
exports.addSkill = asyncHandler(async (req, res) => {
  const { user, count } = await userService.addSkills(req.params.id, req.body.skills);
  res.status(200).json({ message: `${count} skill(s) assigned successfully.`, user });
});

// Remove a single skill from user (via URL param)
exports.removeSkill = asyncHandler(async (req, res) => {
  const { user, count } = await userService.removeSkill(req.params.id, req.params.skill);
  res.status(200).json({ message: `${count} skill(s) removed successfully.`, user });
});

// Remove multiple skills from user (via body)
exports.removeSkills = asyncHandler(async (req, res) => {
  const { user, count } = await userService.removeSkills(req.params.id, req.body.skills);
  res.status(200).json({ message: `${count} skill(s) removed successfully.`, user });
});
