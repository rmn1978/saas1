import sequelize from '../config/database.js';
import User from './User.js';
import Organization from './Organization.js';
import Contact from './Contact.js';
import Campaign from './Campaign.js';
import EmailEvent from './EmailEvent.js';
import Workflow from './Workflow.js';
import Segment from './Segment.js';
import Template from './Template.js';
import ScheduledReport from './ScheduledReport.js';

// Define associations
Organization.hasMany(User, { foreignKey: 'organizationId', as: 'users' });
User.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });

Organization.hasMany(Contact, { foreignKey: 'organizationId', as: 'contacts' });
Contact.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });

Organization.hasMany(Campaign, { foreignKey: 'organizationId', as: 'campaigns' });
Campaign.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });

Campaign.belongsTo(Template, { foreignKey: 'templateId', as: 'template' });
Template.hasMany(Campaign, { foreignKey: 'templateId', as: 'campaigns' });

Campaign.hasMany(EmailEvent, { foreignKey: 'campaignId', as: 'events' });
EmailEvent.belongsTo(Campaign, { foreignKey: 'campaignId', as: 'campaign' });

Contact.hasMany(EmailEvent, { foreignKey: 'contactId', as: 'events' });
EmailEvent.belongsTo(Contact, { foreignKey: 'contactId', as: 'contact' });

Organization.hasMany(Workflow, { foreignKey: 'organizationId', as: 'workflows' });
Workflow.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });

Organization.hasMany(Segment, { foreignKey: 'organizationId', as: 'segments' });
Segment.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });

Organization.hasMany(Template, { foreignKey: 'organizationId', as: 'templates' });
Template.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });

Organization.hasMany(ScheduledReport, { foreignKey: 'organizationId', as: 'scheduledReports' });
ScheduledReport.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });

// Sync database
const syncDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Sync all models
    await sequelize.sync({ alter: true });
    console.log('All models were synchronized successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
};

export {
  sequelize,
  User,
  Organization,
  Contact,
  Campaign,
  EmailEvent,
  Workflow,
  Segment,
  Template,
  ScheduledReport,
  syncDatabase
};
