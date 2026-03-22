const badgeService = require('../../services/badgeService');
const Badge = require('../../models/mongo/Badge');
const User = require('../../models/mongo/User');
const AppError = require('../../utils/AppError');
const { createBadge } = require('../factories/badgeFactory');
const { createUser } = require('../factories/userFactory');
const { clearMongoCollection } = require('../helpers/db');


describe('badgeService', () => {
  beforeEach(async () => {
    await clearMongoCollection(Badge);
    await clearMongoCollection(User);
  });

  it('should get all badges with and without filters', async () => {
    await createBadge({ name: 'Badge1', category: 'achievement', isActive: true });
    await createBadge({ name: 'Badge2', category: 'reviewer', isActive: false });
    await createBadge({ name: 'Badge3', category: 'achievement', isActive: false });

    // No filters
    let all = await badgeService.getAllBadges({});
    expect(all.length).toBe(3);

    // category filter
    let achievement = await badgeService.getAllBadges({ category: 'achievement' });
    expect(achievement.length).toBe(2);
    expect(achievement.every(b => b.category === 'achievement')).toBe(true);

    // isActive filter (true)
    let active = await badgeService.getAllBadges({ isActive: 'true' });
    expect(active.length).toBe(1);
    expect(active[0].isActive).toBe(true);

    // isActive filter (false)
    let inactive = await badgeService.getAllBadges({ isActive: 'false' });
    expect(inactive.length).toBe(2);
    expect(inactive.every(b => b.isActive === false)).toBe(true);

    // Both filters
    let achievementInactive = await badgeService.getAllBadges({ category: 'achievement', isActive: 'false' });
    expect(achievementInactive.length).toBe(1);
    expect(achievementInactive[0].category).toBe('achievement');
    expect(achievementInactive[0].isActive).toBe(false);

    // isActive undefined: should return all
    let allUndefined = await badgeService.getAllBadges({ isActive: undefined });
    expect(allUndefined.length).toBe(3);
  });


  it('should not allow duplicate badge creation', async () => {
    await createBadge({ name: 'UniqueBadge' });
    await expect(badgeService.createBadge({ name: 'UniqueBadge', description: 'Master coder badge', icon: '🎖️', criteria: 'Complete 10 projects' })).rejects.toThrow(AppError);
  });


  it('should update badge by name and handle duplicate name', async () => {
    await createBadge({ name: 'Badge1' });
    await createBadge({ name: 'Badge2' });
    await expect(badgeService.updateBadgeByName('Badge1', { name: 'Badge2' })).rejects.toThrow(AppError);
  });


  it('should delete badge by name and remove from users', async () => {
    const badge = await createBadge({ name: 'BadgeDel' });
    const user = await createUser({ name: 'U', email: 'btest@test.com', badges: [badge._id] });
    await badgeService.deleteBadgeByName('BadgeDel');
    const updatedUser = await User.findById(user._id);
    expect(updatedUser.badges).not.toContainEqual(badge._id);
  });

    it('should throw if badge not found on update by name', async () => {
    await expect(badgeService.updateBadgeByName('Nonexistent', { name: 'NewName' })).rejects.toThrow('Badge not found');
  });

  it('should throw if badge not found on delete by name', async () => {
    await expect(badgeService.deleteBadgeByName('Nonexistent')).rejects.toThrow('Badge not found');
  });

  it('should throw if updating badge to a duplicate name', async () => {
    const badge1 = await createBadge({ name: 'BadgeA', description: 'desc', icon: 'i', criteria: 'c' });
    await createBadge({ name: 'BadgeB', description: 'desc', icon: 'i', criteria: 'c' });
    await expect(badgeService.updateBadge(badge1._id, { name: 'BadgeB' })).rejects.toThrow('already exists');
  });
});
