// Organization-based rate limiting middleware
const orgLimits = new Map();

export const organizationRateLimit = (options = {}) => {
  const {
    windowMs = 60000, // 1 minute
    maxRequests = {
      free: 10,
      starter: 100,
      professional: 500,
      enterprise: 1000
    }
  } = options;

  return async (req, res, next) => {
    if (!req.organizationId) {
      return next();
    }

    const organization = req.organization || await getOrganization(req.organizationId);
    const plan = organization?.plan || 'free';
    const limit = maxRequests[plan] || maxRequests.free;

    const key = `${req.organizationId}:${Math.floor(Date.now() / windowMs)}`;

    if (!orgLimits.has(key)) {
      orgLimits.set(key, { count: 0, resetAt: Date.now() + windowMs });

      // Clean up old entries
      setTimeout(() => {
        orgLimits.delete(key);
      }, windowMs);
    }

    const limitData = orgLimits.get(key);
    limitData.count++;

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - limitData.count));
    res.setHeader('X-RateLimit-Reset', new Date(limitData.resetAt).toISOString());

    if (limitData.count > limit) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `Your ${plan} plan allows ${limit} requests per minute. Please upgrade or try again later.`,
        retryAfter: Math.ceil((limitData.resetAt - Date.now()) / 1000)
      });
    }

    next();
  };
};

// Helper to get organization (cached)
const orgCache = new Map();

async function getOrganization(organizationId) {
  if (orgCache.has(organizationId)) {
    return orgCache.get(organizationId);
  }

  try {
    const { Organization } = await import('../models/index.js');
    const org = await Organization.findByPk(organizationId);

    if (org) {
      orgCache.set(organizationId, org);
      // Clear cache after 5 minutes
      setTimeout(() => orgCache.delete(organizationId), 300000);
    }

    return org;
  } catch (error) {
    console.error('Error fetching organization:', error);
    return null;
  }
}
