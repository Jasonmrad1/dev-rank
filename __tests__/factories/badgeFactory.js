/**
 * Badge Factory
 * Creates test Badge instances with sensible defaults
 */

const Badge = require("../../models/mongo/Badge");

/**
 * Default badge data
 */
const DEFAULT_BADGE = {
  name: "Code Master",
  description: "Master coder badge",
  icon: "🎖️",
  criteria: "Complete 10 projects",
};

/**
 * Creates a single test badge
 * @param {Object} overrides - Property overrides for the default badge
 * @returns {Promise<Object>} Created badge
 */
async function createBadge(overrides = {}) {
  const data = { ...DEFAULT_BADGE, ...overrides };
  return Badge.create(data);
}

/**
 * Creates multiple test badges
 * @param {number} count - Number of badges to create
 * @param {Function} overrideFn - Function to generate unique overrides per badge
 * @returns {Promise<Array>} Array of created badges
 */
async function createBadges(count = 1, overrideFn) {
  const badges = [];
  const defaultBadges = [
    {
      name: "Code Master",
      description: "Master coder badge",
      icon: "🎖️",
      criteria: "Complete 10 projects",
    },
    {
      name: "Skill Summit",
      description: "Peak skill achievement",
      icon: "🏔️",
      criteria: "Learn 5 skills",
    },
    {
      name: "Collaboration Champion",
      description: "Great team player",
      icon: "🤝",
      criteria: "Collaborate on 5 projects",
    },
  ];

  for (let i = 0; i < count; i++) {
    const base = defaultBadges[i] || DEFAULT_BADGE;
    const overrides = overrideFn ? overrideFn(i) : {};
    badges.push(await createBadge({ ...base, ...overrides }));
  }
  return badges;
}

module.exports = {
  createBadge,
  createBadges,
  DEFAULT_BADGE,
};
