import express from 'express';
import { register, login, getProfile } from '../controllers/authController.js';
import {
  createCampaign,
  getCampaigns,
  getCampaign,
  updateCampaign,
  deleteCampaign,
  sendTestEmail,
  getCampaignStats
} from '../controllers/campaignController.js';
import {
  createContact,
  getContacts,
  getContact,
  updateContact,
  deleteContact,
  importContacts,
  addTags,
  removeTags
} from '../controllers/contactController.js';
import {
  createWorkflow,
  getWorkflows,
  getWorkflow,
  updateWorkflow,
  deleteWorkflow,
  toggleWorkflow
} from '../controllers/workflowController.js';
import {
  getDashboardStats,
  getCampaignAnalytics,
  getContactEngagement,
  getWorkflowAnalytics,
  exportReport
} from '../controllers/analyticsController.js';
import {
  createSegment,
  getSegments,
  getSegment,
  updateSegment,
  deleteSegment,
  getSegmentContacts,
  testSegment
} from '../controllers/segmentController.js';
import {
  createTemplate,
  getTemplates,
  getTemplate,
  updateTemplate,
  deleteTemplate,
  duplicateTemplate,
  getTemplateCategories
} from '../controllers/templateController.js';
import {
  createWebhook,
  getWebhooks,
  getWebhook,
  updateWebhook,
  deleteWebhook,
  testWebhook,
  regenerateSecret,
  getWebhookEvents
} from '../controllers/webhookController.js';
import {
  bulkUpdateContacts,
  bulkDeleteContacts,
  bulkAddTags,
  bulkRemoveTags,
  bulkUpdateLeadScore,
  bulkExportContacts,
  bulkUnsubscribe,
  bulkResubscribe,
  bulkSearchAndReplace
} from '../controllers/bulkController.js';
import { authenticate, authorize, checkEmailLimit } from '../middleware/auth.js';

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Auth routes
router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/profile', authenticate, getProfile);

// Campaign routes
router.post('/campaigns', authenticate, authorize('admin', 'user'), checkEmailLimit, createCampaign);
router.get('/campaigns', authenticate, getCampaigns);
router.get('/campaigns/:id', authenticate, getCampaign);
router.put('/campaigns/:id', authenticate, authorize('admin', 'user'), updateCampaign);
router.delete('/campaigns/:id', authenticate, authorize('admin', 'user'), deleteCampaign);
router.post('/campaigns/:id/test', authenticate, authorize('admin', 'user'), sendTestEmail);
router.get('/campaigns/:id/stats', authenticate, getCampaignStats);

// Contact routes
router.post('/contacts', authenticate, authorize('admin', 'user'), createContact);
router.get('/contacts', authenticate, getContacts);
router.get('/contacts/:id', authenticate, getContact);
router.put('/contacts/:id', authenticate, authorize('admin', 'user'), updateContact);
router.delete('/contacts/:id', authenticate, authorize('admin', 'user'), deleteContact);
router.post('/contacts/import', authenticate, authorize('admin', 'user'), importContacts);
router.post('/contacts/:id/tags', authenticate, authorize('admin', 'user'), addTags);
router.delete('/contacts/:id/tags', authenticate, authorize('admin', 'user'), removeTags);

// Workflow routes
router.post('/workflows', authenticate, authorize('admin', 'user'), createWorkflow);
router.get('/workflows', authenticate, getWorkflows);
router.get('/workflows/:id', authenticate, getWorkflow);
router.put('/workflows/:id', authenticate, authorize('admin', 'user'), updateWorkflow);
router.delete('/workflows/:id', authenticate, authorize('admin', 'user'), deleteWorkflow);
router.post('/workflows/:id/toggle', authenticate, authorize('admin', 'user'), toggleWorkflow);

// Analytics routes
router.get('/analytics/dashboard', authenticate, getDashboardStats);
router.get('/analytics/campaigns/:id', authenticate, getCampaignAnalytics);
router.get('/analytics/contacts/:id', authenticate, getContactEngagement);
router.get('/analytics/workflows/:id', authenticate, getWorkflowAnalytics);
router.get('/analytics/export', authenticate, exportReport);

// Segment routes
router.post('/segments', authenticate, authorize('admin', 'user'), createSegment);
router.get('/segments', authenticate, getSegments);
router.get('/segments/:id', authenticate, getSegment);
router.put('/segments/:id', authenticate, authorize('admin', 'user'), updateSegment);
router.delete('/segments/:id', authenticate, authorize('admin', 'user'), deleteSegment);
router.get('/segments/:id/contacts', authenticate, getSegmentContacts);
router.post('/segments/test', authenticate, testSegment);

// Template routes
router.post('/templates', authenticate, authorize('admin', 'user'), createTemplate);
router.get('/templates', authenticate, getTemplates);
router.get('/templates/categories', authenticate, getTemplateCategories);
router.get('/templates/:id', authenticate, getTemplate);
router.put('/templates/:id', authenticate, authorize('admin', 'user'), updateTemplate);
router.delete('/templates/:id', authenticate, authorize('admin', 'user'), deleteTemplate);
router.post('/templates/:id/duplicate', authenticate, duplicateTemplate);

// Webhook routes
router.post('/webhooks', authenticate, authorize('admin'), createWebhook);
router.get('/webhooks', authenticate, getWebhooks);
router.get('/webhooks/events', authenticate, getWebhookEvents);
router.get('/webhooks/:id', authenticate, getWebhook);
router.put('/webhooks/:id', authenticate, authorize('admin'), updateWebhook);
router.delete('/webhooks/:id', authenticate, authorize('admin'), deleteWebhook);
router.post('/webhooks/:id/test', authenticate, authorize('admin'), testWebhook);
router.post('/webhooks/:id/regenerate', authenticate, authorize('admin'), regenerateSecret);

// Bulk operations routes
router.post('/bulk/contacts/update', authenticate, authorize('admin', 'user'), bulkUpdateContacts);
router.post('/bulk/contacts/delete', authenticate, authorize('admin'), bulkDeleteContacts);
router.post('/bulk/contacts/tags/add', authenticate, authorize('admin', 'user'), bulkAddTags);
router.post('/bulk/contacts/tags/remove', authenticate, authorize('admin', 'user'), bulkRemoveTags);
router.post('/bulk/contacts/lead-score', authenticate, authorize('admin', 'user'), bulkUpdateLeadScore);
router.post('/bulk/contacts/export', authenticate, bulkExportContacts);
router.post('/bulk/contacts/unsubscribe', authenticate, authorize('admin', 'user'), bulkUnsubscribe);
router.post('/bulk/contacts/resubscribe', authenticate, authorize('admin', 'user'), bulkResubscribe);
router.post('/bulk/contacts/search-replace', authenticate, authorize('admin', 'user'), bulkSearchAndReplace);

export default router;
