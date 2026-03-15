const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const {
  validateRegister,
  validateUpdateUser,
  validateAddSkills,
  validateRemoveSkills,
} = require("../middleware/validators/userValidators");

// POST /api/users/register - Register a new user
router.post("/register", validateRegister, userController.register);

// GET /api/users - Get all users
router.get("/", userController.getAllUsers);

// GET /api/users/name/:name - Get user by name
router.get("/name/:name", userController.getUserByName);

// GET /api/users/:id - Get user
router.get("/:id", userController.getUser);

// PUT /api/users/:id - Update user
router.put("/:id", validateUpdateUser, userController.updateUser);

// DELETE /api/users/:id - Delete user
router.delete("/:id", userController.deleteUser);

// POST /api/users/:id/skills - Add skills to user (body: { skills: [...] })
router.post("/:id/skills", validateAddSkills, userController.addSkill);

// DELETE /api/users/:id/skills/:skill - Remove a single skill by ID or name
router.delete("/:id/skills/:skill", userController.removeSkill);

// DELETE /api/users/:id/skills - Remove multiple skills (body: { skills: [...] })
router.delete("/:id/skills", validateRemoveSkills, userController.removeSkills);

module.exports = router;
