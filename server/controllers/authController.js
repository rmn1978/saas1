import jwt from 'jsonwebtoken';
import { User, Organization } from '../models/index.js';
import { v4 as uuidv4 } from 'uuid';

export const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, organizationName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create organization
    const organization = await Organization.create({
      id: uuidv4(),
      name: organizationName,
      plan: 'free',
      monthlyEmailLimit: 1000,
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days trial
    });

    // Create user
    const user = await User.create({
      id: uuidv4(),
      email,
      password,
      firstName,
      lastName,
      role: 'admin',
      organizationId: organization.id
    });

    // Generate token
    const token = jwt.sign(
      { userId: user.id, organizationId: organization.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      organization: {
        id: organization.id,
        name: organization.name,
        plan: organization.plan
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({
      where: { email },
      include: [{ model: Organization, as: 'organization' }]
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user and organization are active
    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is inactive' });
    }

    if (!user.organization || !user.organization.isActive) {
      return res.status(403).json({ error: 'Organization is inactive' });
    }

    // Update last login
    await user.update({ lastLogin: new Date() });

    // Generate token
    const token = jwt.sign(
      { userId: user.id, organizationId: user.organizationId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      organization: {
        id: user.organization.id,
        name: user.organization.name,
        plan: user.organization.plan,
        emailLimit: user.organization.monthlyEmailLimit,
        emailsUsed: user.organization.emailsSentThisMonth
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{ model: Organization, as: 'organization' }],
      attributes: { exclude: ['password'] }
    });

    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to retrieve profile' });
  }
};
