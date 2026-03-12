const reviewService = require("../services/reviewService");

// Create a new review
exports.createReview = async (req, res) => {
  try {
    const review = await reviewService.createReview(req.body);
    res.status(201).json(review);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

// Get all reviews
exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await reviewService.getAllReviews(req.query);
    res.status(200).json(reviews);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

// Get review by ID
exports.getReview = async (req, res) => {
  try {
    const review = await reviewService.getReview(req.params.id);
    res.status(200).json(review);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

// Update review
exports.updateReview = async (req, res) => {
  try {
    const review = await reviewService.updateReview(req.params.id, req.body);
    res.status(200).json(review);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

// Delete review
exports.deleteReview = async (req, res) => {
  try {
    const result = await reviewService.deleteReview(req.params.id);
    res.status(200).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};
