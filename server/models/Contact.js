import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Contact = sequelize.define('Contact', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  firstName: {
    type: DataTypes.STRING
  },
  lastName: {
    type: DataTypes.STRING
  },
  phone: {
    type: DataTypes.STRING
  },
  company: {
    type: DataTypes.STRING
  },
  jobTitle: {
    type: DataTypes.STRING
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('subscribed', 'unsubscribed', 'bounced', 'complained'),
    defaultValue: 'subscribed'
  },
  source: {
    type: DataTypes.STRING,
    comment: 'Where the contact came from (e.g., landing page, import, API)'
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  customFields: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  leadScore: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lastActivityAt: {
    type: DataTypes.DATE
  },
  bounceCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  bounceReason: {
    type: DataTypes.STRING,
    allowNull: true
  },
  lastBounceAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['email', 'organizationId']
    },
    {
      fields: ['status']
    },
    {
      fields: ['bounceCount']
    }
  ]
});

export default Contact;
