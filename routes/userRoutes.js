const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

// POST /api/users/register - Register a new user
router.post("/register", userController.register);

// GET /api/users - Get all users
router.get("/", userController.getAllUsers);

// GET /api/users/:id/profile - Get user profile
router.get("/:id/profile", userController.getUserProfile);

// PUT /api/users/:id - Update user
router.put("/:id", userController.updateUser);

// DELETE /api/users/:id - Delete user
router.delete("/:id", userController.deleteUser);

// POST /api/users/:id/skills - Add skill to user
router.post("/:id/skills", userController.addSkill);

// DELETE /api/users/:id/skills/:skillId - Remove skill from user
router.delete("/:id/skills/:skillId", userController.removeSkill);

module.exports = router;
