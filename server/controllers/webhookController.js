import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

// In-memory webhook storage (in production, use database)
const webhooks = new Map();

export const createWebhook = async (req, res) => {
  try {
    const { url, events, description, isActive } = req.body;

    if (!url || !events || !Array.isArray(events)) {
      return res.status(400).json({ error: 'URL and events array are required' });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ error: 'Invalid URL' });
    }

    // Generate signing secret
    const secret = crypto.randomBytes(32).toString('hex');

    const webhook = {
      id: uuidv4(),
      organizationId: req.organizationId,
      url,
      events,
      description: description || '',
      secret,
      isActive: isActive !== false,
      createdAt: new Date(),
      lastTriggered: null,
      deliveryStats: {
        total: 0,
        successful: 0,
        failed: 0
      }
    };

    webhooks.set(webhook.id, webhook);

    res.status(201).json({
      message: 'Webhook created successfully',
      webhook: {
        ...webhook,
        secret: `${secret.substring(0, 8)}...` // Only show partial secret
      },
      fullSecret: secret // Only returned once
    });
  } catch (error) {
    console.error('Create webhook error:', error);
    res.status(500).json({ error: 'Failed to create webhook' });
  }
};

export const getWebhooks = async (req, res) => {
  try {
    const organizationWebhooks = Array.from(webhooks.values())
      .filter(w => w.organizationId === req.organizationId)
      .map(w => ({
        ...w,
        secret: `${w.secret.substring(0, 8)}...` // Hide full secret
      }));

    res.json({ webhooks: organizationWebhooks });
  } catch (error) {
    console.error('Get webhooks error:', error);
    res.status(500).json({ error: 'Failed to retrieve webhooks' });
  }
};

export const getWebhook = async (req, res) => {
  try {
    const { id } = req.params;
    const webhook = webhooks.get(id);

    if (!webhook || webhook.organizationId !== req.organizationId) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    res.json({
      webhook: {
        ...webhook,
        secret: `${webhook.secret.substring(0, 8)}...`
      }
    });
  } catch (error) {
    console.error('Get webhook error:', error);
    res.status(500).json({ error: 'Failed to retrieve webhook' });
  }
};

export const updateWebhook = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const webhook = webhooks.get(id);

    if (!webhook || webhook.organizationId !== req.organizationId) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    // Validate URL if being updated
    if (updates.url) {
      try {
        new URL(updates.url);
      } catch {
        return res.status(400).json({ error: 'Invalid URL' });
      }
    }

    const updatedWebhook = {
      ...webhook,
      ...updates,
      id: webhook.id, // Prevent ID change
      organizationId: webhook.organizationId, // Prevent org change
      secret: webhook.secret, // Prevent secret change
      updatedAt: new Date()
    };

    webhooks.set(id, updatedWebhook);

    res.json({
      message: 'Webhook updated successfully',
      webhook: {
        ...updatedWebhook,
        secret: `${updatedWebhook.secret.substring(0, 8)}...`
      }
    });
  } catch (error) {
    console.error('Update webhook error:', error);
    res.status(500).json({ error: 'Failed to update webhook' });
  }
};

export const deleteWebhook = async (req, res) => {
  try {
    const { id } = req.params;
    const webhook = webhooks.get(id);

    if (!webhook || webhook.organizationId !== req.organizationId) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    webhooks.delete(id);

    res.json({ message: 'Webhook deleted successfully' });
  } catch (error) {
    console.error('Delete webhook error:', error);
    res.status(500).json({ error: 'Failed to delete webhook' });
  }
};

export const testWebhook = async (req, res) => {
  try {
    const { id } = req.params;
    const webhook = webhooks.get(id);

    if (!webhook || webhook.organizationId !== req.organizationId) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    const testPayload = {
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook event'
      }
    };

    const result = await triggerWebhook(webhook, testPayload);

    res.json({
      message: 'Test webhook sent',
      success: result.success,
      response: result.response
    });
  } catch (error) {
    console.error('Test webhook error:', error);
    res.status(500).json({ error: 'Failed to test webhook' });
  }
};

export const regenerateSecret = async (req, res) => {
  try {
    const { id } = req.params;
    const webhook = webhooks.get(id);

    if (!webhook || webhook.organizationId !== req.organizationId) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    const newSecret = crypto.randomBytes(32).toString('hex');

    const updatedWebhook = {
      ...webhook,
      secret: newSecret,
      updatedAt: new Date()
    };

    webhooks.set(id, updatedWebhook);

    res.json({
      message: 'Webhook secret regenerated successfully',
      secret: newSecret // Only returned once
    });
  } catch (error) {
    console.error('Regenerate secret error:', error);
    res.status(500).json({ error: 'Failed to regenerate secret' });
  }
};

// Helper function to trigger webhook
export async function triggerWebhook(webhook, payload) {
  if (!webhook.isActive) {
    return { success: false, error: 'Webhook is inactive' };
  }

  try {
    // Create signature
    const signature = crypto
      .createHmac('sha256', webhook.secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': payload.event,
        'User-Agent': 'Marketing-Automation-Webhook/1.0'
      },
      body: JSON.stringify(payload),
      timeout: 10000 // 10 second timeout
    });

    // Update stats
    webhook.lastTriggered = new Date();
    webhook.deliveryStats.total++;

    if (response.ok) {
      webhook.deliveryStats.successful++;
      return {
        success: true,
        statusCode: response.status,
        response: await response.text()
      };
    } else {
      webhook.deliveryStats.failed++;
      return {
        success: false,
        statusCode: response.status,
        error: await response.text()
      };
    }
  } catch (error) {
    webhook.deliveryStats.failed++;
    return {
      success: false,
      error: error.message
    };
  }
}

// Helper function to trigger webhooks for an event
export async function triggerWebhooksForEvent(organizationId, eventType, data) {
  const organizationWebhooks = Array.from(webhooks.values())
    .filter(w =>
      w.organizationId === organizationId &&
      w.isActive &&
      w.events.includes(eventType)
    );

  const payload = {
    event: eventType,
    timestamp: new Date().toISOString(),
    data
  };

  const results = await Promise.allSettled(
    organizationWebhooks.map(webhook => triggerWebhook(webhook, payload))
  );

  return results;
}

// Available webhook events
export const getWebhookEvents = (req, res) => {
  const events = [
    {
      name: 'contact.created',
      description: 'Triggered when a new contact is created'
    },
    {
      name: 'contact.updated',
      description: 'Triggered when a contact is updated'
    },
    {
      name: 'contact.deleted',
      description: 'Triggered when a contact is deleted'
    },
    {
      name: 'campaign.sent',
      description: 'Triggered when a campaign is sent'
    },
    {
      name: 'email.opened',
      description: 'Triggered when an email is opened'
    },
    {
      name: 'email.clicked',
      description: 'Triggered when a link in an email is clicked'
    },
    {
      name: 'email.bounced',
      description: 'Triggered when an email bounces'
    },
    {
      name: 'email.unsubscribed',
      description: 'Triggered when a contact unsubscribes'
    },
    {
      name: 'workflow.triggered',
      description: 'Triggered when a workflow is triggered'
    },
    {
      name: 'workflow.completed',
      description: 'Triggered when a workflow completes'
    }
  ];

  res.json({ events });
};
