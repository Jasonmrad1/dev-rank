const express = require("express");
const router = express.Router();
const badgeController = require("../controllers/badgeController");
const {validateCreateBadge, validateUpdateBadge, validateGetAllBadgesQuery} = require("../middleware/validators/badgeValidators");

// POST /api/badges - Create a new badge
router.post("/", validateCreateBadge, badgeController.createBadge);

// GET /api/badges - Get all badges
router.get("/", validateGetAllBadgesQuery, badgeController.getAllBadges);

// GET /api/badges/name/:name - Get badge by name
router.get("/name/:name", badgeController.getBadgeByName);

// PUT /api/badges/name/:name - Update badge by name
router.put("/name/:name", validateUpdateBadge, badgeController.updateBadgeByName);

// DELETE /api/badges/name/:name - Delete badge by name
router.delete("/name/:name", badgeController.deleteBadgeByName);

// GET /api/badges/:badgeId - Get badge by ID
router.get("/:badgeId", badgeController.getBadge);

// PUT /api/badges/:badgeId - Update badge
router.put("/:badgeId", validateUpdateBadge, badgeController.updateBadge);

// DELETE /api/badges/:badgeId - Delete badge
router.delete("/:badgeId", badgeController.deleteBadge);

module.exports = router;
