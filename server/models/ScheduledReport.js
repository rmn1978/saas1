import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ScheduledReport = sequelize.define('ScheduledReport', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Organizations',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  reportType: {
    type: DataTypes.ENUM(
      'dashboard',
      'campaign_performance',
      'contact_growth',
      'workflow_performance',
      'engagement_summary',
      'revenue_report'
    ),
    allowNull: false
  },
  frequency: {
    type: DataTypes.ENUM('daily', 'weekly', 'monthly'),
    allowNull: false,
    defaultValue: 'weekly'
  },
  format: {
    type: DataTypes.ENUM('pdf', 'csv', 'excel', 'json'),
    allowNull: false,
    defaultValue: 'pdf'
  },
  recipients: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: false,
    defaultValue: []
  },
  filters: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastRunAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  nextRunAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  executionCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'ScheduledReports',
  timestamps: true,
  indexes: [
    { fields: ['organizationId'] },
    { fields: ['isActive'] },
    { fields: ['nextRunAt'] },
    { fields: ['reportType'] }
  ]
});

export default ScheduledReport;
