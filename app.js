require("dotenv").config();
const express = require("express");
const connectMongoDB = require("./config/mongodb");
const sequelize = require("./config/sqlite");

const userRoutes = require("./routes/userRoutes");
const projectRoutes = require("./routes/projectRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const skillRoutes = require("./routes/skillRoutes");
const certificationRoutes = require("./routes/certificationRoutes");
const badgeRoutes = require("./routes/badgeRoutes");
const activityLogRoutes = require("./routes/activityLogRoutes");
const { registerEventListeners } = require("./listeners/registerEventListeners");
const { swaggerUi, swaggerDocument } = require("./docs/swagger.config.js");

const app = express();
//middleware
app.use(express.json());

registerEventListeners();

// Swagger/OpenAPI documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Mount routes
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/certifications", certificationRoutes);
app.use("/api/badges", badgeRoutes);
app.use("/api/logs", activityLogRoutes);

// Global JSON error handler
app.use((err, req, res, next) => {
  if (err.isAppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      errorCode: err.errorCode || "ERR_GENERIC",
    });
  }
  console.error("[Unhandled Error]", err.stack);
  res.status(500).json({ error: "Internal Server Error", errorCode: "ERR_INTERNAL" });
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
