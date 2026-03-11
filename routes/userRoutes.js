const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

// POST /api/users/register - Register a new user
router.post("/register", userController.register);

// GET /api/users - Get all users
router.get("/", userController.getAllUsers);

// GET /api/users/:id - Get user
router.get("/:id", userController.getUser);

// PUT /api/users/:id - Update user
router.put("/:id", userController.updateUser);

// DELETE /api/users/:id - Delete user
router.delete("/:id", userController.deleteUser);

// POST /api/users/:id/skills - Add skills to user (body: { skills: [...] })
router.post("/:id/skills", userController.addSkill);

// DELETE /api/users/:id/skills/:skill - Remove a single skill by ID or name
router.delete("/:id/skills/:skill", userController.removeSkill);

// DELETE /api/users/:id/skills - Remove multiple skills (body: { skills: [...] })
router.delete("/:id/skills", userController.removeSkills);

module.exports = router;
