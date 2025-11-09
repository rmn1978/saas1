import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Campaign = sequelize.define('Campaign', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false
  },
  previewText: {
    type: DataTypes.STRING
  },
  fromName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fromEmail: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  replyTo: {
    type: DataTypes.STRING,
    validate: {
      isEmail: true
    }
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  templateId: {
    type: DataTypes.UUID
  },
  htmlContent: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  textContent: {
    type: DataTypes.TEXT
  },
  status: {
    type: DataTypes.ENUM('draft', 'scheduled', 'sending', 'sent', 'paused', 'failed'),
    defaultValue: 'draft'
  },
  scheduledAt: {
    type: DataTypes.DATE
  },
  sentAt: {
    type: DataTypes.DATE
  },
  segmentCriteria: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Criteria for selecting contacts'
  },
  abTestConfig: {
    type: DataTypes.JSONB,
    defaultValue: null,
    comment: 'A/B testing configuration'
  },
  stats: {
    type: DataTypes.JSONB,
    defaultValue: {
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      bounced: 0,
      unsubscribed: 0,
      complained: 0
    }
  },
  bouncedCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  timestamps: true
});

export default Campaign;
