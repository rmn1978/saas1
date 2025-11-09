import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Workflow = sequelize.define('Workflow', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  trigger: {
    type: DataTypes.JSONB,
    allowNull: false,
    comment: 'Trigger configuration (e.g., contact created, email opened, tag added)'
  },
  actions: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
    comment: 'Array of actions to perform (e.g., send email, add tag, update field)'
  },
  conditions: {
    type: DataTypes.JSONB,
    defaultValue: [],
    comment: 'Conditional logic for workflow execution'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  stats: {
    type: DataTypes.JSONB,
    defaultValue: {
      triggered: 0,
      completed: 0,
      failed: 0
    }
  }
}, {
  timestamps: true
});

export default Workflow;
