import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const EmailEvent = sequelize.define('EmailEvent', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  campaignId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  contactId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  eventType: {
    type: DataTypes.ENUM('sent', 'delivered', 'opened', 'clicked', 'bounced', 'unsubscribed', 'complained'),
    allowNull: false
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Additional data like link clicked, device info, etc.'
  },
  ipAddress: {
    type: DataTypes.STRING
  },
  userAgent: {
    type: DataTypes.STRING
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['campaignId', 'contactId']
    },
    {
      fields: ['eventType']
    },
    {
      fields: ['createdAt']
    }
  ]
});

export default EmailEvent;
