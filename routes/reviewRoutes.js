const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");

// POST /api/reviews - Create a new review
router.post("/", reviewController.createReview);

// GET /api/reviews - Get all reviews
router.get("/", reviewController.getAllReviews);

// GET /api/reviews/:id - Get review by ID
router.get("/:id", reviewController.getReview);

// PUT /api/reviews/:id - Update review
router.put("/:id", reviewController.updateReview);

// DELETE /api/reviews/:id - Delete review
router.delete("/:id", reviewController.deleteReview);

module.exports = router;
