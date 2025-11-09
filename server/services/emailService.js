import nodemailer from 'nodemailer';
import { Campaign, Contact, EmailEvent, Organization } from '../models/index.js';
import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });
};

// Get contacts based on segment criteria
export const getSegmentedContacts = async (organizationId, segmentCriteria) => {
  const where = {
    organizationId,
    status: 'subscribed'
  };

  // Apply segment filters
  if (segmentCriteria.tags && segmentCriteria.tags.length > 0) {
    where.tags = { [Op.overlap]: segmentCriteria.tags };
  }

  if (segmentCriteria.leadScoreMin) {
    where.leadScore = { [Op.gte]: segmentCriteria.leadScoreMin };
  }

  if (segmentCriteria.leadScoreMax) {
    where.leadScore = { [Op.lte]: segmentCriteria.leadScoreMax };
  }

  if (segmentCriteria.createdAfter) {
    where.createdAt = { [Op.gte]: new Date(segmentCriteria.createdAfter) };
  }

  return await Contact.findAll({ where });
};

// Replace template variables
const replaceVariables = (content, contact) => {
  let result = content;

  const variables = {
    '{{firstName}}': contact.firstName || '',
    '{{lastName}}': contact.lastName || '',
    '{{email}}': contact.email || '',
    '{{company}}': contact.company || '',
    '{{jobTitle}}': contact.jobTitle || ''
  };

  Object.keys(variables).forEach(key => {
    result = result.replace(new RegExp(key, 'g'), variables[key]);
  });

  return result;
};

// Send campaign emails
export const sendCampaignEmails = async (campaignId) => {
  try {
    const campaign = await Campaign.findByPk(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Update campaign status
    await campaign.update({ status: 'sending' });

    // Get organization
    const organization = await Organization.findByPk(campaign.organizationId);
    if (!organization) {
      throw new Error('Organization not found');
    }

    // Get contacts to send to
    const contacts = await getSegmentedContacts(
      campaign.organizationId,
      campaign.segmentCriteria
    );

    // Check email limit
    const emailsToSend = contacts.length;
    if (organization.emailsSentThisMonth + emailsToSend > organization.monthlyEmailLimit) {
      await campaign.update({ status: 'failed' });
      throw new Error('Monthly email limit would be exceeded');
    }

    const transporter = createTransporter();
    let stats = {
      sent: 0,
      delivered: 0,
      bounced: 0
    };

    // Send emails
    for (const contact of contacts) {
      try {
        const htmlContent = replaceVariables(campaign.htmlContent, contact);
        const textContent = campaign.textContent
          ? replaceVariables(campaign.textContent, contact)
          : null;

        // Add tracking pixel for opens
        const trackingPixel = `<img src="${process.env.FRONTEND_URL}/track/open/${campaignId}/${contact.id}" width="1" height="1" />`;
        const htmlWithTracking = htmlContent + trackingPixel;

        // Send email
        await transporter.sendMail({
          from: `${campaign.fromName} <${campaign.fromEmail}>`,
          to: contact.email,
          replyTo: campaign.replyTo,
          subject: replaceVariables(campaign.subject, contact),
          html: htmlWithTracking,
          text: textContent
        });

        // Record sent event
        await EmailEvent.create({
          id: uuidv4(),
          campaignId: campaign.id,
          contactId: contact.id,
          organizationId: campaign.organizationId,
          eventType: 'sent'
        });

        stats.sent++;
        stats.delivered++;

        // Update contact last activity
        await contact.update({ lastActivityAt: new Date() });

      } catch (error) {
        console.error(`Failed to send email to ${contact.email}:`, error);

        // Record bounce event
        await EmailEvent.create({
          id: uuidv4(),
          campaignId: campaign.id,
          contactId: contact.id,
          organizationId: campaign.organizationId,
          eventType: 'bounced',
          metadata: { error: error.message }
        });

        stats.bounced++;
      }
    }

    // Update campaign stats and status
    await campaign.update({
      status: 'sent',
      sentAt: new Date(),
      stats: {
        ...campaign.stats,
        ...stats
      }
    });

    // Update organization email count
    await organization.increment('emailsSentThisMonth', { by: stats.sent });

    return {
      success: true,
      stats
    };

  } catch (error) {
    console.error('Send campaign emails error:', error);

    // Update campaign status to failed
    const campaign = await Campaign.findByPk(campaignId);
    if (campaign) {
      await campaign.update({ status: 'failed' });
    }

    throw error;
  }
};

// Schedule email job (simplified - in production use Bull queue)
export const scheduleEmailJob = async (campaignId, scheduledTime) => {
  const delay = scheduledTime.getTime() - Date.now();

  if (delay > 0) {
    setTimeout(async () => {
      await sendCampaignEmails(campaignId);
    }, delay);
  }
};

// Track email open
export const trackEmailOpen = async (campaignId, contactId, ipAddress, userAgent) => {
  try {
    // Check if already tracked
    const existingEvent = await EmailEvent.findOne({
      where: {
        campaignId,
        contactId,
        eventType: 'opened'
      }
    });

    if (!existingEvent) {
      const campaign = await Campaign.findByPk(campaignId);

      await EmailEvent.create({
        id: uuidv4(),
        campaignId,
        contactId,
        organizationId: campaign.organizationId,
        eventType: 'opened',
        ipAddress,
        userAgent
      });

      // Update campaign stats
      const updatedStats = { ...campaign.stats };
      updatedStats.opened = (updatedStats.opened || 0) + 1;
      await campaign.update({ stats: updatedStats });
    }
  } catch (error) {
    console.error('Track email open error:', error);
  }
};

// Track email click
export const trackEmailClick = async (campaignId, contactId, linkUrl, ipAddress, userAgent) => {
  try {
    const campaign = await Campaign.findByPk(campaignId);

    await EmailEvent.create({
      id: uuidv4(),
      campaignId,
      contactId,
      organizationId: campaign.organizationId,
      eventType: 'clicked',
      metadata: { linkUrl },
      ipAddress,
      userAgent
    });

    // Update campaign stats
    const updatedStats = { ...campaign.stats };
    updatedStats.clicked = (updatedStats.clicked || 0) + 1;
    await campaign.update({ stats: updatedStats });
  } catch (error) {
    console.error('Track email click error:', error);
  }
};

export default {
  sendCampaignEmails,
  scheduleEmailJob,
  trackEmailOpen,
  trackEmailClick,
  getSegmentedContacts
};
