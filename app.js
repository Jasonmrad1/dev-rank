require("dotenv").config();
const express = require("express");
const connectMongoDB = require("./config/mongodb");
const sequelize = require("./config/sqlite");

const userRoutes = require("./routes/userRoutes");
const projectRoutes = require("./routes/projectRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const skillRoutes = require("./routes/skillRoutes");
const certificationRoutes = require("./routes/certificationRoutes");
const activityLogRoutes = require("./routes/activityLogRoutes");

const app = express();

app.use(express.json());

// Mount routes
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/certifications", certificationRoutes);
app.use("/api/logs", activityLogRoutes);

// Global JSON error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectMongoDB();
    await sequelize.sync();
    console.log("SQLite synced successfully");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
};

startServer();
