require("dotenv").config({ path: ".env.test" });
const { connectTestMongoDB, createTestSequelize, syncTestDb, clearMongoDB, disconnectMongoDB } = require("./config/testDb");

let sequelize;

beforeAll(async () => {
  try {
    // Connect to test MongoDB
    await connectTestMongoDB();

    // Initialize and sync test SQLite database
    sequelize = createTestSequelize();
    await syncTestDb(sequelize);

    // Make sequelize available globally
    global.testSequelize = sequelize;
  } catch (error) {
    console.error("Test setup failed:", error);
    throw error;
  }
});

beforeEach(async () => {
  // Clear all data before each test
  try {
    await clearMongoDB();
  } catch (error) {
    console.warn("Error clearing MongoDB:", error);
  }
});

afterAll(async () => {
  try {
    // Disconnect from test MongoDB
    await disconnectMongoDB();

    // Close sequelize connection
    if (sequelize) {
      await sequelize.close();
    }
  } catch (error) {
    console.error("Test cleanup failed:", error);
  }
});

module.exports = {
  sequelize,
};
