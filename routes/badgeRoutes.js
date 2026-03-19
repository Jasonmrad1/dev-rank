const express = require("express");
const router = express.Router();
const badgeController = require("../controllers/badgeController");
const {validateCreateBadge, validateUpdateBadge} = require("../middleware/validators/badgeValidators");

// POST /api/badges - Create a new badge
router.post("/", validateCreateBadge, badgeController.createBadge);

// GET /api/badges - Get all badges
router.get("/", badgeController.getAllBadges);

// GET /api/badges/name/:name - Get badge by name
router.get("/name/:name", badgeController.getBadgeByName);

// PUT /api/badges/name/:name - Update badge by name
router.put("/name/:name", validateUpdateBadge, badgeController.updateBadgeByName);

// DELETE /api/badges/name/:name - Delete badge by name
router.delete("/name/:name", badgeController.deleteBadgeByName);

// GET /api/badges/users/:userId - Get user's badges
router.get("/users/:userId", badgeController.getUserBadges);

// POST /api/badges/:badgeId/award/:userId - Award badge to user
router.post("/:badgeId/award/:userId", badgeController.awardBadgeToUser);

// DELETE /api/badges/:badgeId/revoke/:userId - Remove badge from user
router.delete("/:badgeId/revoke/:userId", badgeController.removeBadgeFromUser);

// GET /api/badges/:id - Get badge by ID
router.get("/:id", badgeController.getBadge);

// PUT /api/badges/:id - Update badge
router.put("/:id", validateUpdateBadge, badgeController.updateBadge);

// DELETE /api/badges/:id - Delete badge
router.delete("/:id", badgeController.deleteBadge);

module.exports = router;
