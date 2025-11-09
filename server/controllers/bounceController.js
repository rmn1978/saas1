import bounceHandlingService from '../services/bounceHandlingService.js';

export const processBounceWebhook = async (req, res) => {
  try {
    const { provider = 'generic' } = req.query;
    let bounceData;

    // Parse based on provider
    switch (provider.toLowerCase()) {
      case 'ses':
      case 'aws':
        const sesNotification = JSON.parse(req.body.Message || '{}');
        const bounces = bounceHandlingService.parseSESBounce(sesNotification);
        for (const bounce of bounces) {
          await bounceHandlingService.processBounce(bounce);
        }
        break;

      case 'sendgrid':
        bounceData = bounceHandlingService.parseSendGridBounce(req.body);
        if (bounceData) {
          await bounceHandlingService.processBounce(bounceData);
        }
        break;

      default:
        // Generic bounce format
        await bounceHandlingService.processBounce(req.body);
        break;
    }

    res.json({ message: 'Bounce processed successfully' });
  } catch (error) {
    console.error('Process bounce webhook error:', error);
    res.status(500).json({ error: 'Failed to process bounce' });
  }
};

export const getBounceStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const stats = await bounceHandlingService.getBounceStats(
      req.organizationId,
      startDate,
      endDate
    );

    res.json(stats);
  } catch (error) {
    console.error('Get bounce stats error:', error);
    res.status(500).json({ error: 'Failed to get bounce statistics' });
  }
};

export const getBouncedContacts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      includeHardBounces = true,
      includeSoftBounces = true
    } = req.query;

    const offset = (page - 1) * limit;

    const contacts = await bounceHandlingService.getBouncedContacts(
      req.organizationId,
      {
        limit: parseInt(limit),
        offset: parseInt(offset),
        includeHardBounces: includeHardBounces === 'true',
        includeSoftBounces: includeSoftBounces === 'true'
      }
    );

    res.json({
      contacts,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Get bounced contacts error:', error);
    res.status(500).json({ error: 'Failed to get bounced contacts' });
  }
};

export const getRetryEligibleContacts = async (req, res) => {
  try {
    const contacts = await bounceHandlingService.getRetryEligibleContacts(
      req.organizationId
    );

    res.json({
      contacts,
      count: contacts.length
    });
  } catch (error) {
    console.error('Get retry eligible contacts error:', error);
    res.status(500).json({ error: 'Failed to get retry eligible contacts' });
  }
};

export const resetContactBounce = async (req, res) => {
  try {
    const { id } = req.params;

    const contact = await bounceHandlingService.resetBounceCount(id);

    res.json({
      message: 'Bounce count reset successfully',
      contact
    });
  } catch (error) {
    console.error('Reset contact bounce error:', error);
    if (error.message === 'Contact not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to reset bounce count' });
  }
};

export const cleanupBouncedContacts = async (req, res) => {
  try {
    const { daysOld = 90 } = req.body;

    const result = await bounceHandlingService.cleanupBouncedContacts(
      req.organizationId,
      parseInt(daysOld)
    );

    res.json({
      message: `Cleaned up ${result.deletedCount} bounced contacts`,
      ...result
    });
  } catch (error) {
    console.error('Cleanup bounced contacts error:', error);
    res.status(500).json({ error: 'Failed to cleanup bounced contacts' });
  }
};

export const manualBounceReport = async (req, res) => {
  try {
    const { email, bounceType, bounceReason, campaignId } = req.body;

    if (!email || !bounceType) {
      return res.status(400).json({
        error: 'email and bounceType are required'
      });
    }

    if (!['hard', 'soft'].includes(bounceType)) {
      return res.status(400).json({
        error: 'bounceType must be either "hard" or "soft"'
      });
    }

    const result = await bounceHandlingService.processBounce({
      email,
      bounceType,
      bounceReason: bounceReason || 'Manually reported',
      campaignId,
      timestamp: new Date()
    });

    res.json({
      message: 'Bounce reported successfully',
      ...result
    });
  } catch (error) {
    console.error('Manual bounce report error:', error);
    res.status(500).json({ error: 'Failed to report bounce' });
  }
};
