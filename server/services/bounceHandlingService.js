import { Contact, EmailEvent, Campaign } from '../models/index.js';
import { Op } from 'sequelize';

export class BounceHandlingService {
  constructor() {
    this.bounceThreshold = 3; // Number of bounces before marking as permanently bounced
    this.softBounceRetryDays = 7; // Days to wait before retrying soft bounces
  }

  /**
   * Process a bounce notification
   */
  async processBounce(data) {
    try {
      const {
        email,
        bounceType, // 'hard' or 'soft'
        bounceReason,
        campaignId,
        contactId,
        diagnosticCode,
        timestamp
      } = data;

      // Find or create contact
      let contact;
      if (contactId) {
        contact = await Contact.findByPk(contactId);
      } else if (email) {
        contact = await Contact.findOne({ where: { email } });
      }

      if (!contact) {
        console.error('Contact not found for bounce:', email);
        return { success: false, error: 'Contact not found' };
      }

      // Record the bounce event
      await EmailEvent.create({
        eventType: 'bounced',
        contactId: contact.id,
        campaignId: campaignId || null,
        organizationId: contact.organizationId,
        metadata: {
          bounceType,
          bounceReason,
          diagnosticCode,
          timestamp: timestamp || new Date()
        }
      });

      // Update contact based on bounce type
      if (bounceType === 'hard') {
        await this.handleHardBounce(contact, bounceReason);
      } else if (bounceType === 'soft') {
        await this.handleSoftBounce(contact, bounceReason);
      }

      // Update campaign stats if campaignId provided
      if (campaignId) {
        await this.updateCampaignBounceStats(campaignId);
      }

      return {
        success: true,
        contact: contact.email,
        bounceType,
        status: contact.status
      };
    } catch (error) {
      console.error('Process bounce error:', error);
      throw error;
    }
  }

  /**
   * Handle hard bounce - immediately mark as bounced
   */
  async handleHardBounce(contact, reason) {
    await contact.update({
      status: 'bounced',
      bounceCount: (contact.bounceCount || 0) + 1,
      lastBounceAt: new Date(),
      bounceReason: reason,
      metadata: {
        ...contact.metadata,
        hardBounce: true,
        hardBounceReason: reason
      }
    });

    console.log(`Hard bounce recorded for ${contact.email}: ${reason}`);
  }

  /**
   * Handle soft bounce - track and mark as bounced after threshold
   */
  async handleSoftBounce(contact, reason) {
    const newBounceCount = (contact.bounceCount || 0) + 1;
    const updates = {
      bounceCount: newBounceCount,
      lastBounceAt: new Date(),
      bounceReason: reason,
      metadata: {
        ...contact.metadata,
        lastSoftBounce: new Date(),
        softBounceReason: reason
      }
    };

    // If exceeded threshold, mark as bounced
    if (newBounceCount >= this.bounceThreshold) {
      updates.status = 'bounced';
      updates.metadata.permanentBounce = true;
      console.log(`Soft bounce threshold exceeded for ${contact.email}: ${newBounceCount} bounces`);
    }

    await contact.update(updates);
  }

  /**
   * Update campaign bounce statistics
   */
  async updateCampaignBounceStats(campaignId) {
    try {
      const bounceCount = await EmailEvent.count({
        where: {
          campaignId,
          eventType: 'bounced'
        }
      });

      await Campaign.update(
        { bouncedCount: bounceCount },
        { where: { id: campaignId } }
      );
    } catch (error) {
      console.error('Update campaign bounce stats error:', error);
    }
  }

  /**
   * Get bounce statistics for an organization
   */
  async getBounceStats(organizationId, startDate, endDate) {
    try {
      const where = {
        organizationId,
        eventType: 'bounced'
      };

      if (startDate && endDate) {
        where.createdAt = {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        };
      }

      const bounces = await EmailEvent.findAll({
        where,
        attributes: ['metadata', 'createdAt'],
        raw: true
      });

      const stats = {
        total: bounces.length,
        hardBounces: 0,
        softBounces: 0,
        byReason: {},
        byDate: {}
      };

      bounces.forEach(bounce => {
        const bounceType = bounce.metadata?.bounceType || 'unknown';
        const reason = bounce.metadata?.bounceReason || 'unknown';
        const date = new Date(bounce.createdAt).toISOString().split('T')[0];

        if (bounceType === 'hard') {
          stats.hardBounces++;
        } else if (bounceType === 'soft') {
          stats.softBounces++;
        }

        stats.byReason[reason] = (stats.byReason[reason] || 0) + 1;
        stats.byDate[date] = (stats.byDate[date] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Get bounce stats error:', error);
      throw error;
    }
  }

  /**
   * Identify contacts eligible for soft bounce retry
   */
  async getRetryEligibleContacts(organizationId) {
    try {
      const retryDate = new Date();
      retryDate.setDate(retryDate.getDate() - this.softBounceRetryDays);

      const contacts = await Contact.findAll({
        where: {
          organizationId,
          status: 'subscribed',
          bounceCount: {
            [Op.gt]: 0,
            [Op.lt]: this.bounceThreshold
          },
          lastBounceAt: {
            [Op.lt]: retryDate
          }
        }
      });

      return contacts;
    } catch (error) {
      console.error('Get retry eligible contacts error:', error);
      throw error;
    }
  }

  /**
   * Reset bounce count for a contact (manual intervention)
   */
  async resetBounceCount(contactId) {
    try {
      const contact = await Contact.findByPk(contactId);

      if (!contact) {
        throw new Error('Contact not found');
      }

      await contact.update({
        bounceCount: 0,
        bounceReason: null,
        lastBounceAt: null,
        status: 'subscribed',
        metadata: {
          ...contact.metadata,
          bounceReset: true,
          bounceResetAt: new Date()
        }
      });

      return contact;
    } catch (error) {
      console.error('Reset bounce count error:', error);
      throw error;
    }
  }

  /**
   * Get bounced contacts for cleanup
   */
  async getBouncedContacts(organizationId, options = {}) {
    try {
      const { limit = 100, offset = 0, includeHardBounces = true, includeSoftBounces = true } = options;

      const where = {
        organizationId,
        status: 'bounced'
      };

      const contacts = await Contact.findAll({
        where,
        limit,
        offset,
        order: [['lastBounceAt', 'DESC']],
        attributes: [
          'id',
          'email',
          'firstName',
          'lastName',
          'bounceCount',
          'bounceReason',
          'lastBounceAt',
          'metadata'
        ]
      });

      return contacts;
    } catch (error) {
      console.error('Get bounced contacts error:', error);
      throw error;
    }
  }

  /**
   * Clean up old bounced contacts
   */
  async cleanupBouncedContacts(organizationId, daysOld = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await Contact.destroy({
        where: {
          organizationId,
          status: 'bounced',
          lastBounceAt: {
            [Op.lt]: cutoffDate
          }
        }
      });

      return {
        deletedCount: result,
        cutoffDate
      };
    } catch (error) {
      console.error('Cleanup bounced contacts error:', error);
      throw error;
    }
  }

  /**
   * Parse bounce notification from email provider (AWS SES format)
   */
  parseSESBounce(notification) {
    try {
      const bounce = notification.bounce;
      const bounceType = bounce.bounceType === 'Permanent' ? 'hard' : 'soft';

      return bounce.bouncedRecipients.map(recipient => ({
        email: recipient.emailAddress,
        bounceType,
        bounceReason: recipient.diagnosticCode || bounce.bounceSubType,
        diagnosticCode: recipient.diagnosticCode,
        timestamp: new Date(bounce.timestamp)
      }));
    } catch (error) {
      console.error('Parse SES bounce error:', error);
      return [];
    }
  }

  /**
   * Parse bounce notification from email provider (SendGrid format)
   */
  parseSendGridBounce(event) {
    try {
      const bounceType = event.type === 'bounce' ? 'hard' : 'soft';

      return {
        email: event.email,
        bounceType,
        bounceReason: event.reason || event.status,
        diagnosticCode: event.status,
        timestamp: new Date(event.timestamp * 1000)
      };
    } catch (error) {
      console.error('Parse SendGrid bounce error:', error);
      return null;
    }
  }
}

export default new BounceHandlingService();
