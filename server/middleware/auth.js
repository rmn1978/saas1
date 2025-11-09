import jwt from 'jsonwebtoken';
import { User, Organization } from '../models/index.js';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId, {
      include: [{ model: Organization, as: 'organization' }]
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid or inactive user' });
    }

    if (!user.organization || !user.organization.isActive) {
      return res.status(403).json({ error: 'Organization is inactive' });
    }

    req.user = user;
    req.organizationId = user.organizationId;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

export const checkEmailLimit = async (req, res, next) => {
  try {
    const organization = await Organization.findByPk(req.organizationId);

    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    if (organization.emailsSentThisMonth >= organization.monthlyEmailLimit) {
      return res.status(429).json({
        error: 'Monthly email limit reached',
        limit: organization.monthlyEmailLimit,
        used: organization.emailsSentThisMonth
      });
    }

    req.organization = organization;
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Failed to check email limit' });
  }
};
