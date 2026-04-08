const userService = require('../../services/userService');
const { createUser } = require('../factories/userFactory');
const { createSkill } = require('../factories/skillFactory');
const { createBadge } = require('../factories/badgeFactory');
const { createProject } = require('../factories/projectFactory');
const { createReview } = require('../factories/reviewFactory');
const User = require('../../models/mongo/User');
const Skill = require('../../models/mongo/Skill');
const Badge = require('../../models/mongo/Badge');
const Project = require('../../models/mongo/Project');
const Review = require('../../models/mongo/Review');
const AppError = require('../../utils/AppError');

describe('userService', () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await Skill.deleteMany({});
    await Badge.deleteMany({});
    await Project.deleteMany({});
    await Review.deleteMany({});
  });

  it('should not allow duplicate email registration', async () => {
    await userService.registerUser({ name: 'A', email: 'dup@test.com', password: 'pw' });
    await expect(userService.registerUser({ name: 'A', email: 'dup@test.com', password: 'pw' })).rejects.toThrow(AppError);
  });

  it('should throw if user not found for add/remove skill/badge', async () => {
    const skill = await createSkill({ name: 'S' });
    const badge = await createBadge({ name: 'B' });
    await expect(userService.addSkills('000000000000000000000000', [skill._id])).rejects.toThrow(AppError);
    await expect(userService.removeSkill('000000000000000000000000', skill._id)).rejects.toThrow(AppError);
    await expect(userService.awardBadge('000000000000000000000000', badge._id)).rejects.toThrow(AppError);
    await expect(userService.removeBadge('000000000000000000000000', badge._id)).rejects.toThrow(AppError);
  });

  it('should throw if skill/badge not found or already assigned/removed', async () => {
    const user = await createUser({ name: 'U', email: 'u@test.com' });
    await expect(userService.addSkills(user._id, ['000000000000000000000000'])).rejects.toThrow(AppError);
    await expect(userService.removeSkill(user._id, '000000000000000000000000')).rejects.toThrow(AppError);
    await expect(userService.awardBadge(user._id, '000000000000000000000000')).rejects.toThrow(AppError);
    await expect(userService.removeBadge(user._id, '000000000000000000000000')).rejects.toThrow(AppError);
  });

  it('should throw if badge/skill already assigned or not assigned', async () => {
    const user = await createUser({ name: 'U', email: 'u2@test.com' });
    const skill = await createSkill({ name: 'S2-unique-always' });
    const badge = await createBadge({ name: 'B2-unique-always' });
    await userService.addSkills(user._id, [skill._id.toString()]);
    // Debug: check if skill exists in DB before second addSkills
    const foundSkill = await Skill.findById(skill._id);
    expect(foundSkill).not.toBeNull();
    // Assert 'already assigned' immediately after first add
    await expect(userService.addSkills(user._id, [skill._id.toString()])).rejects.toThrow('All provided skills are already assigned to this user.');
    // Robust error assertion for addSkills
    await expect(userService.removeSkill(user._id, skill._id.toString())).resolves.toBeDefined();
    // After removal, skill exists in DB but not assigned to user: should throw 'not assigned' error
    await expect(userService.removeSkill(user._id, skill._id.toString())).rejects.toThrow('not assigned');
    await userService.awardBadge(user._id, badge._id);
    await expect(userService.awardBadge(user._id, badge._id)).rejects.toThrow(AppError);
    await expect(userService.removeBadge(user._id, badge._id)).resolves.toBeDefined();
    await expect(userService.removeBadge(user._id, badge._id)).rejects.toThrow(AppError);
  });

  it('should throw if skill does not exist in DB when removing', async () => {
    const user = await createUser({ name: 'U3', email: 'u3@test.com' });
    const skill = await createSkill({ name: 'S3' });
    await userService.addSkills(user._id, [skill._id.toString()]);
    await userService.removeSkill(user._id, skill._id.toString()); // remove from user
    await Skill.deleteOne({ _id: skill._id }); // remove from DB
    await expect(userService.removeSkill(user._id, skill._id.toString())).rejects.toThrow('One or more skills were not found.');
  });

  // --- Additional negative/edge-case tests for full coverage ---

  it('should throw if trying to follow yourself', async () => {
    const user = await createUser({ name: 'Self', email: 'self@test.com' });
    await expect(userService.followUser(user._id.toString(), user._id.toString())).rejects.toThrow('Cannot follow yourself.');
  });

  it('should throw if user or target not found on follow', async () => {
    const user = await createUser({ name: 'A', email: 'a@test.com' });
    await expect(userService.followUser(user._id.toString(), '000000000000000000000000')).rejects.toThrow('User not found');
    await expect(userService.followUser('000000000000000000000000', user._id.toString())).rejects.toThrow('User not found');
  });

  it('should throw if already following user', async () => {
    const user = await createUser({ name: 'A', email: 'a2@test.com' });
    const target = await createUser({ name: 'B', email: 'b2@test.com' });
    await userService.followUser(user._id.toString(), target._id.toString());
    await expect(userService.followUser(user._id.toString(), target._id.toString())).rejects.toThrow('Already following this user.');
  });

  it('should throw if trying to unfollow yourself', async () => {
    const user = await createUser({ name: 'Self2', email: 'self2@test.com' });
    await expect(userService.unfollowUser(user._id.toString(), user._id.toString())).rejects.toThrow('Cannot unfollow yourself.');
  });

  it('should throw if user or target not found on unfollow', async () => {
    const user = await createUser({ name: 'A', email: 'a3@test.com' });
    await expect(userService.unfollowUser(user._id.toString(), '000000000000000000000000')).rejects.toThrow('User not found');
    await expect(userService.unfollowUser('000000000000000000000000', user._id.toString())).rejects.toThrow('User not found');
  });

  it('should throw if user not found on getFollowers/getFollowing', async () => {
    await expect(userService.getFollowers('000000000000000000000000')).rejects.toThrow('User not found');
    await expect(userService.getFollowing('000000000000000000000000')).rejects.toThrow('User not found');
  });

  it('should throw if user not found on removeSkills', async () => {
    await expect(userService.removeSkills('000000000000000000000000', ['000000000000000000000000'])).rejects.toThrow('User not found');
  });

  it('should throw if none of the provided skills are assigned to user in removeSkills', async () => {
    const user = await createUser({ name: 'U4', email: 'u4@test.com' });
    const skill = await createSkill({ name: 'S4' });
    await expect(userService.removeSkills(user._id, [skill._id.toString()])).rejects.toThrow('None of the provided skills are assigned to this user.');
  });

  it('should throw if user not found on awardBadgeByName/removeBadgeByName', async () => {
    await expect(userService.awardBadgeByName('000000000000000000000000', 'Nonexistent')).rejects.toThrow('User not found');
    await expect(userService.removeBadgeByName('000000000000000000000000', 'Nonexistent')).rejects.toThrow('User not found');
  });

  it('should throw if badge not found on awardBadgeByName/removeBadgeByName', async () => {
    const user = await createUser({ name: 'U5', email: 'u5@test.com' });
    await expect(userService.awardBadgeByName(user._id, 'Nonexistent')).rejects.toThrow('Badge not found');
    await expect(userService.removeBadgeByName(user._id, 'Nonexistent')).rejects.toThrow('Badge not found');
  });

  it('should throw if user already has badge on awardBadgeByName', async () => {
    const user = await createUser({ name: 'U6', email: 'u6@test.com' });
    const badge = await createBadge({ name: 'B6' });
    await userService.awardBadgeByName(user._id, badge.name);
    await expect(userService.awardBadgeByName(user._id, badge.name)).rejects.toThrow('User already has this badge.');
  });

  it('should throw if user does not have badge on removeBadgeByName', async () => {
    const user = await createUser({ name: 'U7', email: 'u7@test.com' });
    const badge = await createBadge({ name: 'B7' });
    await expect(userService.removeBadgeByName(user._id, badge.name)).rejects.toThrow('User does not have this badge.');
  });

  it('should remove assigned skill from user (positive path)', async () => {
    const user = await createUser({ name: 'U8', email: 'u8@test.com' });
    const skill = await createSkill({ name: 'S8' });
    // Assign skill
    user.skills.push(skill._id);
    await user.save();
    // Remove skill
    const result = await userService.removeSkills(user._id, [skill._id.toString()]);
    expect(result.user.skills.map(s => s.toString())).not.toContain(skill._id.toString());
    expect(result.count).toBe(1);
  });

  it('should remove badge by name from user (positive path)', async () => {
    const user = await createUser({ name: 'U9', email: 'u9@test.com' });
    const badge = await createBadge({ name: 'B9' });
    // Assign badge
    user.badges.push(badge._id);
    await user.save();
    // Remove badge by name
    const result = await userService.removeBadgeByName(user._id, badge.name);
    expect(result.badges.map(b => b.toString())).not.toContain(badge._id.toString());
  });

  it('should delete reviews for projects owned by a deleted user', async () => {
    const owner = await createUser({ name: 'DeleteOwner', email: 'delete-owner@test.com' });
    const reviewer = await createUser({ name: 'DeleteReviewer', email: 'delete-reviewer@test.com' });
    const project = await createProject(owner._id.toString(), { title: 'Owned Project To Delete' });

    await createReview(reviewer._id.toString(), project._id.toString(), {
      overallRating: 4,
      codeQualityScore: 4,
      creativityScore: 4,
      cleanCodeScore: 4,
      status: 'published',
    });

    expect(await Review.countDocuments({ project: project._id })).toBe(1);

    await userService.deleteUser(owner._id.toString());

    expect(await Review.countDocuments({ project: project._id })).toBe(0);
  });

  it('should remove deleted user from badge users arrays', async () => {
    const user = await createUser({ name: 'BadgeCleanupUser', email: 'badge-cleanup@test.com' });
    const badge = await createBadge({ name: 'Badge Cleanup' });

    badge.users.push(user._id);
    await badge.save();

    await userService.deleteUser(user._id.toString());

    const updatedBadge = await Badge.findById(badge._id);
    expect(updatedBadge.users.map(String)).not.toContain(user._id.toString());
  });
});
