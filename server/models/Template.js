import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Template = sequelize.define('Template', {
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
    allowNull: true,
    comment: 'Null for system templates, UUID for custom templates'
  },
  category: {
    type: DataTypes.STRING,
    defaultValue: 'custom'
  },
  thumbnailUrl: {
    type: DataTypes.STRING
  },
  htmlContent: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  textContent: {
    type: DataTypes.TEXT
  },
  designJson: {
    type: DataTypes.JSONB,
    comment: 'Design configuration for drag-and-drop editor'
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  usageCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  timestamps: true
});

export default Template;
