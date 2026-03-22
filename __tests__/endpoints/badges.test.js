/**
 * Badge Endpoint Tests
 * Tests for /api/badges endpoints
 */

const request = require("supertest");
const mongoose = require("mongoose");
const Badge = require("../../models/mongo/Badge");
const badgeRoutes = require("../../routes/badgeRoutes");
const { createTestApp } = require("../helpers/testSetup");
const { clearMongoCollection } = require("../helpers/db");
const { HTTP_STATUS, API_ROUTES } = require("../helpers/testConstants");
const { createBadge, createBadges } = require("../factories/badgeFactory");

const app = createTestApp(API_ROUTES.BADGES, badgeRoutes);

describe("Badge API Endpoints", () => {
  let badgeId;

  beforeEach(async () => {
    await clearMongoCollection(Badge);
  });

  describe("POST /api/badges", () => {
    it("should create a new badge", async () => {
      const badgeData = {
        name: "New Badge",
        description: "A new test badge",
        icon: "⭐",
        criteria: "Test criteria",
      };

      const response = await request(app)
        .post(API_ROUTES.BADGES)
        .send(badgeData);

      expect(response.status).toBe(HTTP_STATUS.CREATED);
      expect(response.body.badge).toBeDefined();
      expect(response.body.badge.name).toBe(badgeData.name);
      badgeId = response.body.badge._id;
    });

    it("should fail when missing required fields", async () => {
      const response = await request(app)
        .post(API_ROUTES.BADGES)
        .send({ name: "Test Badge" });

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    });

    it("should fail when badge name already exists", async () => {
      const badgeData = {
        name: "Duplicate Badge",
        description: "A duplicate test badge",
        icon: "🔄",
        criteria: "Duplicate criteria",
      };

      await request(app)
        .post(API_ROUTES.BADGES)
        .send(badgeData);

      const response = await request(app)
        .post(API_ROUTES.BADGES)
        .send(badgeData);

      expect(response.status).toBe(HTTP_STATUS.CONFLICT);
    });
  });

  describe("GET /api/badges", () => {
    it("should get all badges", async () => {
      await createBadges(2);

      const response = await request(app).get(API_ROUTES.BADGES);

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(Array.isArray(response.body.badges)).toBe(true);
      expect(response.body.badges.length).toBe(2);
    });

    it("should return empty array when no badges exist", async () => {
      const response = await request(app).get(API_ROUTES.BADGES);

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(response.body.badges).toEqual([]);
    });
  });

  describe("GET /api/badges/name/:name", () => {
    it("should get badge by name", async () => {
      const badge = await createBadge({
        name: "Unique Badge",
        description: "A unique badge",
      });

      const response = await request(app).get(`${API_ROUTES.BADGES}/name/${badge.name}`);

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(response.body.badge.name).toBe(badge.name);
    });

    it("should return 404 for non-existent badge", async () => {
      const response = await request(app).get(`${API_ROUTES.BADGES}/name/NonExistent`);

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    });
  });

  describe("GET /api/badges/:badgeId", () => {
    it("should get badge by ID", async () => {
      const badge = await createBadge();

      const response = await request(app).get(`${API_ROUTES.BADGES}/${badge._id}`);

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(response.body.badge._id).toBe(badge._id.toString());
    });

    it("should return 404 for invalid badge ID", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app).get(`${API_ROUTES.BADGES}/${fakeId}`);

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    });
  });

  describe("PUT /api/badges/name/:name", () => {
    it("should update badge by name", async () => {
      const badge = await createBadge({
        name: "Update By Name",
        description: "Original description",
      });

      const response = await request(app)
        .put(`${API_ROUTES.BADGES}/name/${badge.name}`)
        .send({ description: "Updated description" });

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(response.body.badge.description).toBe("Updated description");
    });

    it("should return 404 for non-existent badge", async () => {
      const response = await request(app)
        .put(`${API_ROUTES.BADGES}/name/NonExistent`)
        .send({ description: "Updated" });

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    });
  });

  describe("PUT /api/badges/:badgeId", () => {
    it("should update badge by ID", async () => {
      const badge = await createBadge({
        description: "Original description",
      });

      const response = await request(app)
        .put(`${API_ROUTES.BADGES}/${badge._id}`)
        .send({ description: "Updated description" });

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(response.body.badge.description).toBe("Updated description");
    });

    it("should return 404 for non-existent badge", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`${API_ROUTES.BADGES}/${fakeId}`)
        .send({ description: "Updated" });

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    });
  });

  describe("DELETE /api/badges/name/:name", () => {
    it("should delete badge by name", async () => {
      const badge = await createBadge({
        name: "Delete By Name",
      });

      const response = await request(app).delete(`${API_ROUTES.BADGES}/name/${badge.name}`);

      expect(response.status).toBe(HTTP_STATUS.OK);

      const checkRes = await request(app).get(`${API_ROUTES.BADGES}/name/${badge.name}`);
      expect(checkRes.status).toBe(HTTP_STATUS.NOT_FOUND);
    });

    it("should return 404 for non-existent badge", async () => {
      const response = await request(app).delete(`${API_ROUTES.BADGES}/name/NonExistent`);

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    });
  });

  describe("DELETE /api/badges/:badgeId", () => {
    it("should delete badge by ID", async () => {
      const badge = await createBadge();

      const response = await request(app).delete(`${API_ROUTES.BADGES}/${badge._id}`);

      expect(response.status).toBe(HTTP_STATUS.OK);

      const checkRes = await request(app).get(`${API_ROUTES.BADGES}/${badge._id}`);
      expect(checkRes.status).toBe(HTTP_STATUS.NOT_FOUND);
    });

    it("should remove deleted badge from all users' badges arrays if referenced", async () => {
      // Create badge and user
      const badge = await createBadge();
      const userFactory = require("../factories/userFactory");
      const user = await userFactory.createUser();
      // Simulate badge assignment
      const User = require("../../models/mongo/User");
      user.badges = [badge._id];
      await user.save();
      // Delete badge
      await request(app).delete(`${API_ROUTES.BADGES}/${badge._id}`);
      // Check user no longer has the badge
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.badges ? updatedUser.badges.map(String) : []).not.toContain(badge._id.toString());
    });

    it("should return 404 for non-existent badge", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app).delete(`${API_ROUTES.BADGES}/${fakeId}`);

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    });
  });
});
