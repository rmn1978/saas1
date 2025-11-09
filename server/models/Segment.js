import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Segment = sequelize.define('Segment', {
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
  criteria: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
    comment: 'Filter criteria for contacts (e.g., tags, custom fields, activity)'
  },
  contactCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isDynamic: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'If true, segment updates automatically based on criteria'
  }
}, {
  timestamps: true
});

export default Segment;
