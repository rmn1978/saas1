import { Campaign, Contact, EmailEvent, Organization, Workflow } from '../models/index.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';

export const getDashboardStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const organizationId = req.organizationId;

    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    // Get overall stats
    const [
      totalCampaigns,
      totalContacts,
      totalWorkflows,
      activeWorkflows,
      subscribedContacts
    ] = await Promise.all([
      Campaign.count({ where: { organizationId, ...dateFilter } }),
      Contact.count({ where: { organizationId, ...dateFilter } }),
      Workflow.count({ where: { organizationId, ...dateFilter } }),
      Workflow.count({ where: { organizationId, isActive: true } }),
      Contact.count({ where: { organizationId, status: 'subscribed' } })
    ]);

    // Get email stats
    const emailStats = await EmailEvent.findAll({
      where: { organizationId, ...dateFilter },
      attributes: [
        'eventType',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['eventType'],
      raw: true
    });

    const emailStatsByType = emailStats.reduce((acc, stat) => {
      acc[stat.eventType] = parseInt(stat.count);
      return acc;
    }, {});

    // Calculate rates
    const sent = emailStatsByType.sent || 0;
    const opened = emailStatsByType.opened || 0;
    const clicked = emailStatsByType.clicked || 0;
    const bounced = emailStatsByType.bounced || 0;

    const openRate = sent > 0 ? ((opened / sent) * 100).toFixed(2) : 0;
    const clickRate = sent > 0 ? ((clicked / sent) * 100).toFixed(2) : 0;
    const bounceRate = sent > 0 ? ((bounced / sent) * 100).toFixed(2) : 0;

    // Get campaign performance
    const topCampaigns = await Campaign.findAll({
      where: { organizationId, status: 'sent' },
      attributes: ['id', 'name', 'stats'],
      order: [[sequelize.literal("(stats->>'opened')::int"), 'DESC']],
      limit: 5
    });

    // Get contact growth over time
    const contactGrowth = await Contact.findAll({
      where: { organizationId },
      attributes: [
        [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
      order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'DESC']],
      limit: 30,
      raw: true
    });

    res.json({
      overview: {
        totalCampaigns,
        totalContacts,
        subscribedContacts,
        totalWorkflows,
        activeWorkflows
      },
      emailStats: {
        sent,
        delivered: emailStatsByType.delivered || 0,
        opened,
        clicked,
        bounced,
        unsubscribed: emailStatsByType.unsubscribed || 0,
        complained: emailStatsByType.complained || 0,
        openRate: parseFloat(openRate),
        clickRate: parseFloat(clickRate),
        bounceRate: parseFloat(bounceRate)
      },
      topCampaigns,
      contactGrowth
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to retrieve dashboard stats' });
  }
};

export const getCampaignAnalytics = async (req, res) => {
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

    // Get detailed event breakdown
    const events = await EmailEvent.findAll({
      where: { campaignId: id },
      attributes: [
        'eventType',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('DATE', sequelize.col('createdAt')), 'date']
      ],
      group: ['eventType', sequelize.fn('DATE', sequelize.col('createdAt'))],
      order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']],
      raw: true
    });

    // Get link clicks breakdown
    const linkClicks = await EmailEvent.findAll({
      where: {
        campaignId: id,
        eventType: 'clicked'
      },
      attributes: [
        [sequelize.literal("metadata->>'linkUrl'"), 'url'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'clicks']
      ],
      group: [sequelize.literal("metadata->>'linkUrl'")],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      limit: 10,
      raw: true
    });

    // Get device/browser stats
    const deviceStats = await EmailEvent.findAll({
      where: {
        campaignId: id,
        eventType: 'opened'
      },
      attributes: [
        'userAgent',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['userAgent'],
      limit: 10,
      raw: true
    });

    // Get geographic data
    const geographicData = await EmailEvent.findAll({
      where: {
        campaignId: id,
        eventType: 'opened',
        ipAddress: { [Op.ne]: null }
      },
      attributes: ['ipAddress'],
      limit: 100,
      raw: true
    });

    res.json({
      campaign: {
        id: campaign.id,
        name: campaign.name,
        subject: campaign.subject,
        stats: campaign.stats,
        sentAt: campaign.sentAt
      },
      eventTimeline: events,
      linkClicks,
      deviceStats,
      geographicData: geographicData.map(g => g.ipAddress)
    });
  } catch (error) {
    console.error('Get campaign analytics error:', error);
    res.status(500).json({ error: 'Failed to retrieve campaign analytics' });
  }
};

export const getContactEngagement = async (req, res) => {
  try {
    const { id } = req.params;

    const contact = await Contact.findOne({
      where: {
        id,
        organizationId: req.organizationId
      }
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Get all email events for this contact
    const events = await EmailEvent.findAll({
      where: { contactId: id },
      include: [
        {
          model: Campaign,
          as: 'campaign',
          attributes: ['id', 'name', 'subject']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 100
    });

    // Calculate engagement score
    const eventCounts = events.reduce((acc, event) => {
      acc[event.eventType] = (acc[event.eventType] || 0) + 1;
      return acc;
    }, {});

    const engagementScore = (
      (eventCounts.opened || 0) * 10 +
      (eventCounts.clicked || 0) * 20 -
      (eventCounts.bounced || 0) * 5 -
      (eventCounts.unsubscribed || 0) * 50
    );

    // Get campaign participation
    const campaignParticipation = await EmailEvent.findAll({
      where: {
        contactId: id,
        eventType: 'sent'
      },
      attributes: [
        'campaignId',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['campaignId'],
      include: [
        {
          model: Campaign,
          as: 'campaign',
          attributes: ['name']
        }
      ],
      raw: true
    });

    res.json({
      contact: {
        id: contact.id,
        email: contact.email,
        firstName: contact.firstName,
        lastName: contact.lastName,
        leadScore: contact.leadScore
      },
      engagementScore,
      eventCounts,
      recentActivity: events,
      campaignParticipation
    });
  } catch (error) {
    console.error('Get contact engagement error:', error);
    res.status(500).json({ error: 'Failed to retrieve contact engagement' });
  }
};

export const getWorkflowAnalytics = async (req, res) => {
  try {
    const { id } = req.params;

    const workflow = await Workflow.findOne({
      where: {
        id,
        organizationId: req.organizationId
      }
    });

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    // In a real implementation, you'd have a WorkflowExecution table
    // For now, return the workflow stats
    res.json({
      workflow: {
        id: workflow.id,
        name: workflow.name,
        isActive: workflow.isActive,
        stats: workflow.stats
      },
      successRate: workflow.stats.triggered > 0
        ? ((workflow.stats.completed / workflow.stats.triggered) * 100).toFixed(2)
        : 0,
      averageExecutionTime: '2.5s', // Mock data
      lastExecution: workflow.updatedAt
    });
  } catch (error) {
    console.error('Get workflow analytics error:', error);
    res.status(500).json({ error: 'Failed to retrieve workflow analytics' });
  }
};

export const exportReport = async (req, res) => {
  try {
    const { type, format = 'json', startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    let data;

    switch (type) {
      case 'campaigns':
        data = await Campaign.findAll({
          where: { organizationId: req.organizationId, ...dateFilter },
          attributes: ['id', 'name', 'subject', 'status', 'stats', 'createdAt', 'sentAt']
        });
        break;

      case 'contacts':
        data = await Contact.findAll({
          where: { organizationId: req.organizationId, ...dateFilter },
          attributes: ['email', 'firstName', 'lastName', 'company', 'status', 'tags', 'leadScore', 'createdAt']
        });
        break;

      case 'events':
        data = await EmailEvent.findAll({
          where: { organizationId: req.organizationId, ...dateFilter },
          include: [
            { model: Campaign, as: 'campaign', attributes: ['name'] },
            { model: Contact, as: 'contact', attributes: ['email'] }
          ],
          limit: 10000
        });
        break;

      default:
        return res.status(400).json({ error: 'Invalid report type' });
    }

    if (format === 'csv') {
      // Convert to CSV
      const csv = convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${type}-report.csv"`);
      return res.send(csv);
    }

    res.json({
      type,
      count: data.length,
      data
    });
  } catch (error) {
    console.error('Export report error:', error);
    res.status(500).json({ error: 'Failed to export report' });
  }
};

// Helper function to convert JSON to CSV
function convertToCSV(data) {
  if (!data || data.length === 0) return '';

  const jsonData = data.map(item => item.toJSON ? item.toJSON() : item);
  const headers = Object.keys(jsonData[0]);
  const csvRows = [headers.join(',')];

  for (const row of jsonData) {
    const values = headers.map(header => {
      const value = row[header];
      if (typeof value === 'object') {
        return JSON.stringify(value).replace(/"/g, '""');
      }
      return `"${String(value).replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}
