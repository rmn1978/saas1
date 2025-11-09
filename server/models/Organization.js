import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Organization = sequelize.define('Organization', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  domain: {
    type: DataTypes.STRING,
    unique: true
  },
  plan: {
    type: DataTypes.ENUM('free', 'starter', 'professional', 'enterprise'),
    defaultValue: 'free'
  },
  monthlyEmailLimit: {
    type: DataTypes.INTEGER,
    defaultValue: 1000
  },
  emailsSentThisMonth: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  settings: {
    type: DataTypes.JSONB,
    defaultValue: {
      timezone: 'UTC',
      dateFormat: 'MM/DD/YYYY',
      customDomain: null,
      brandingEnabled: false
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  trialEndsAt: {
    type: DataTypes.DATE
  }
}, {
  timestamps: true
});

export default Organization;
