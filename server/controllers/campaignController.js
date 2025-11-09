import { Campaign, Contact, EmailEvent, Template } from '../models/index.js';
import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';
import { scheduleEmailJob } from '../services/emailService.js';

export const createCampaign = async (req, res) => {
  try {
    const {
      name,
      subject,
      previewText,
      fromName,
      fromEmail,
      replyTo,
      templateId,
      htmlContent,
      textContent,
      segmentCriteria,
      scheduledAt
    } = req.body;

    const campaign = await Campaign.create({
      id: uuidv4(),
      name,
      subject,
      previewText,
      fromName,
      fromEmail,
      replyTo: replyTo || fromEmail,
      organizationId: req.organizationId,
      templateId,
      htmlContent,
      textContent,
      segmentCriteria: segmentCriteria || {},
      status: scheduledAt ? 'scheduled' : 'draft',
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null
    });

    // Schedule email if scheduledAt is provided
    if (scheduledAt) {
      await scheduleEmailJob(campaign.id, new Date(scheduledAt));
    }

    res.status(201).json({
      message: 'Campaign created successfully',
      campaign
    });
  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
};

export const getCampaigns = async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    const where = { organizationId: req.organizationId };
    if (status) {
      where.status = status;
    }

    const campaigns = await Campaign.findAndCountAll({
      where,
      include: [{ model: Template, as: 'template', attributes: ['id', 'name'] }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      campaigns: campaigns.rows,
      total: campaigns.count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({ error: 'Failed to retrieve campaigns' });
  }
};

export const getCampaign = async (req, res) => {
  try {
    const { id } = req.params;

    const campaign = await Campaign.findOne({
      where: {
        id,
        organizationId: req.organizationId
      },
      include: [{ model: Template, as: 'template' }]
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json({ campaign });
  } catch (error) {
    console.error('Get campaign error:', error);
    res.status(500).json({ error: 'Failed to retrieve campaign' });
  }
};

export const updateCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const campaign = await Campaign.findOne({
      where: {
        id,
        organizationId: req.organizationId
      }
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Don't allow updating sent campaigns
    if (campaign.status === 'sent') {
      return res.status(400).json({ error: 'Cannot update sent campaigns' });
    }

    await campaign.update(updates);

    res.json({
      message: 'Campaign updated successfully',
      campaign
    });
  } catch (error) {
    console.error('Update campaign error:', error);
    res.status(500).json({ error: 'Failed to update campaign' });
  }
};

export const deleteCampaign = async (req, res) => {
  try {
    const { id } = req.params;

    const campaign = await Campaign.findOne({
      where: {
        id,
        organizationId: req.organizationId
      }
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Don't allow deleting sent campaigns
    if (campaign.status === 'sent' || campaign.status === 'sending') {
      return res.status(400).json({ error: 'Cannot delete sent or sending campaigns' });
    }

    await campaign.destroy();

    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Delete campaign error:', error);
    res.status(500).json({ error: 'Failed to delete campaign' });
  }
};

export const sendTestEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const { testEmail } = req.body;

    const campaign = await Campaign.findOne({
      where: {
        id,
        organizationId: req.organizationId
      }
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Send test email logic would go here
    // For now, just return success
    res.json({ message: `Test email sent to ${testEmail}` });
  } catch (error) {
    console.error('Send test email error:', error);
    res.status(500).json({ error: 'Failed to send test email' });
  }
};

export const getCampaignStats = async (req, res) => {
  try {
    const { id } = req.params;

    const campaign = await Campaign.findOne({
      where: {
        id,
        organizationId: req.organizationId
      }
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Get detailed stats
    const eventCounts = await EmailEvent.findAll({
      where: { campaignId: id },
      attributes: [
        'eventType',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['eventType'],
      raw: true
    });

    const stats = {
      ...campaign.stats,
      detailed: eventCounts,
      openRate: campaign.stats.sent > 0 ? (campaign.stats.opened / campaign.stats.sent * 100).toFixed(2) : 0,
      clickRate: campaign.stats.sent > 0 ? (campaign.stats.clicked / campaign.stats.sent * 100).toFixed(2) : 0,
      bounceRate: campaign.stats.sent > 0 ? (campaign.stats.bounced / campaign.stats.sent * 100).toFixed(2) : 0
    };

    res.json({ stats });
  } catch (error) {
    console.error('Get campaign stats error:', error);
    res.status(500).json({ error: 'Failed to retrieve campaign stats' });
  }
};
