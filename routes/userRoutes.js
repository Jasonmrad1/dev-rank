const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const {validateRegister, validateUpdateUser, validateAddSkills, validateRemoveSkills, validateFollowTarget, validateUserIdParam, validateFollowRequest, validateAwardBadge, validateAwardBadgeByName,} = require("../middleware/validators/userValidators");

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

// POST /api/users/:id/badges - Award a badge to user (body: { badgeId })
router.post("/:id/badges", validateAwardBadge, userController.awardBadge);

// POST /api/users/:id/badges/name - Award a badge to user by name (body: { badgeName })
router.post("/:id/badges/name", validateAwardBadgeByName, userController.awardBadgeByName);

// DELETE /api/users/:id/badges/:badgeId - Remove a badge from user by ID
router.delete("/:id/badges/:badgeId", userController.removeBadge);

// DELETE /api/users/:id/badges/name/:badgeName - Remove a badge from user by name
router.delete("/:id/badges/name/:badgeName", userController.removeBadgeByName);

// POST /api/users/follow/:targetId - Follow a user (body: { userId })
router.post("/follow/:targetId", validateFollowRequest, validateFollowTarget, userController.followUser);

// POST /api/users/unfollow/:targetId - Unfollow a user (body: { userId })
router.post("/unfollow/:targetId", validateFollowRequest, validateFollowTarget, userController.unfollowUser);

// GET /api/users/:userId/followers - Get followers
router.get("/:userId/followers", validateUserIdParam, userController.getFollowers);

// GET /api/users/:userId/following - Get following
router.get("/:userId/following", validateUserIdParam, userController.getFollowing);

module.exports = router;
