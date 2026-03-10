const userService = require("../services/userService");

// Register a new user
exports.register = async (req, res) => {
  try {
    const user = await userService.registerUser(req.body);
    res.status(201).json({ message: "User registered successfully.", user });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.status(200).json({ users });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

// Get user profile
exports.getUserProfile = async (req, res) => {
  try {
    const user = await userService.getUserProfile(req.params.id);
    res.status(200).json({ user });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    res.status(200).json({ message: "User updated successfully.", user });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    await userService.deleteUser(req.params.id);
    res.status(200).json({ message: "User deleted successfully." });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

// Add skills to user
exports.addSkill = async (req, res) => {
  try {
    const { user, count } = await userService.addSkills(req.params.id, req.body.skillIds);
    res.status(200).json({ message: `${count} skill(s) assigned successfully.`, user });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

// Remove skills from user
exports.removeSkill = async (req, res) => {
  try {
    const { user, count } = await userService.removeSkills(req.params.id, req.params.skillId, req.body.skillIds);
    res.status(200).json({ message: `${count} skill(s) removed successfully.`, user });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};
