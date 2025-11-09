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

export default router;
