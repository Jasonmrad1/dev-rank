const mongoose = require("mongoose");

const badgeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  icon: { type: String }, // URL or emoji
  category: {
    type: String,
    enum: ["achievement", "skill-master", "reviewer", "contributor", "other"],
    default: "achievement",
  },
  criteria: { type: String }, // Description of how to earn the badge
  isActive: { type: Boolean, default: true },
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Badge", badgeSchema);
