const express = require("express");
const router = express.Router();
const certificationController = require("../controllers/certificationController");

// POST /api/certifications/apply - Apply for certification
router.post("/apply", certificationController.apply);

// GET /api/certifications - Get all certification requests
router.get("/", certificationController.getAllRequests);

// PATCH /api/certifications/:id/approve - Approve certification
router.patch("/:id/approve", certificationController.approve);

// PATCH /api/certifications/:id/reject - Reject certification
router.patch("/:id/reject", certificationController.reject);

module.exports = router;
