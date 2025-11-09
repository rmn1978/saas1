import { Contact, Campaign, EmailEvent } from '../models/index.js';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

// Generate unsubscribe token
export function generateUnsubscribeToken(contactId, campaignId) {
  const data = `${contactId}:${campaignId}:${process.env.JWT_SECRET}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

// Verify unsubscribe token
export function verifyUnsubscribeToken(token, contactId, campaignId) {
  const expectedToken = generateUnsubscribeToken(contactId, campaignId);
  return token === expectedToken;
}

// Render unsubscribe page
export const showUnsubscribePage = async (req, res) => {
  const { contactId, campaignId, token } = req.query;

  if (!contactId || !campaignId || !token) {
    return res.status(400).send('<h1>Invalid unsubscribe link</h1>');
  }

  if (!verifyUnsubscribeToken(token, contactId, campaignId)) {
    return res.status(403).send('<h1>Invalid or expired unsubscribe link</h1>');
  }

  try {
    const contact = await Contact.findByPk(contactId);
    const campaign = await Campaign.findByPk(campaignId);

    if (!contact) {
      return res.status(404).send('<h1>Contact not found</h1>');
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Unsubscribe</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f5;
            margin: 0;
            padding: 40px 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            padding: 40px;
          }
          h1 {
            color: #333;
            margin-bottom: 20px;
          }
          p {
            color: #666;
            line-height: 1.6;
            margin-bottom: 20px;
          }
          .email {
            background: #f9f9f9;
            padding: 10px 15px;
            border-radius: 6px;
            font-family: monospace;
            margin: 20px 0;
          }
          .buttons {
            margin-top: 30px;
          }
          button {
            padding: 12px 30px;
            border: none;
            border-radius: 6px;
            font-size: 16px;
            cursor: pointer;
            margin-right: 10px;
            transition: all 0.2s;
          }
          .btn-unsubscribe {
            background: #ef4444;
            color: white;
          }
          .btn-unsubscribe:hover {
            background: #dc2626;
          }
          .btn-cancel {
            background: #e5e7eb;
            color: #374151;
          }
          .btn-cancel:hover {
            background: #d1d5db;
          }
          .success {
            background: #10b981;
            color: white;
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 20px;
            display: none;
          }
          .preferences {
            margin-top: 30px;
            padding-top: 30px;
            border-top: 1px solid #e5e7eb;
          }
          .checkbox-group {
            margin: 15px 0;
          }
          label {
            display: flex;
            align-items: center;
            cursor: pointer;
            padding: 10px;
            border-radius: 6px;
            transition: background 0.2s;
          }
          label:hover {
            background: #f9f9f9;
          }
          input[type="checkbox"] {
            margin-right: 10px;
            width: 18px;
            height: 18px;
            cursor: pointer;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div id="success-message" class="success">
            ✓ You have been successfully unsubscribed
          </div>

          <h1>Manage Your Email Preferences</h1>

          <p>We're sorry to see you go. You're about to unsubscribe from:</p>

          <div class="email">${contact.email}</div>

          ${campaign ? `<p><strong>Campaign:</strong> ${campaign.name}</p>` : ''}

          <div class="preferences">
            <h3>Update Your Preferences</h3>
            <p>Instead of unsubscribing completely, you can choose which emails you'd like to receive:</p>

            <div class="checkbox-group">
              <label>
                <input type="checkbox" name="promotional" checked>
                <span>Promotional emails and special offers</span>
              </label>
            </div>

            <div class="checkbox-group">
              <label>
                <input type="checkbox" name="newsletter" checked>
                <span>Newsletter and updates</span>
              </label>
            </div>

            <div class="checkbox-group">
              <label>
                <input type="checkbox" name="product" checked>
                <span>Product announcements</span>
              </label>
            </div>
          </div>

          <div class="buttons">
            <button class="btn-unsubscribe" onclick="unsubscribe()">
              Unsubscribe from All
            </button>
            <button class="btn-cancel" onclick="window.close()">
              Keep Subscription
            </button>
          </div>
        </div>

        <script>
          async function unsubscribe() {
            try {
              const response = await fetch('/api/unsubscribe/confirm', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  contactId: '${contactId}',
                  campaignId: '${campaignId}',
                  token: '${token}'
                })
              });

              if (response.ok) {
                document.getElementById('success-message').style.display = 'block';
                document.querySelector('.buttons').innerHTML =
                  '<p style="color: #10b981;">✓ You have been unsubscribed successfully</p>';
              } else {
                alert('Failed to unsubscribe. Please try again.');
              }
            } catch (error) {
              alert('An error occurred. Please try again.');
            }
          }
        </script>
      </body>
      </html>
    `;

    res.send(html);
  } catch (error) {
    console.error('Show unsubscribe page error:', error);
    res.status(500).send('<h1>An error occurred</h1>');
  }
};

// Confirm unsubscribe
export const confirmUnsubscribe = async (req, res) => {
  try {
    const { contactId, campaignId, token } = req.body;

    if (!verifyUnsubscribeToken(token, contactId, campaignId)) {
      return res.status(403).json({ error: 'Invalid token' });
    }

    const contact = await Contact.findByPk(contactId);

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Update contact status
    await contact.update({ status: 'unsubscribed' });

    // Record unsubscribe event
    await EmailEvent.create({
      id: uuidv4(),
      campaignId,
      contactId,
      organizationId: contact.organizationId,
      eventType: 'unsubscribed',
      metadata: {
        timestamp: new Date(),
        method: 'user_action'
      }
    });

    // Update campaign stats
    if (campaignId) {
      const campaign = await Campaign.findByPk(campaignId);
      if (campaign) {
        const stats = { ...campaign.stats };
        stats.unsubscribed = (stats.unsubscribed || 0) + 1;
        await campaign.update({ stats });
      }
    }

    res.json({
      success: true,
      message: 'Successfully unsubscribed'
    });
  } catch (error) {
    console.error('Confirm unsubscribe error:', error);
    res.status(500).json({ error: 'Failed to unsubscribe' });
  }
};

// Update email preferences
export const updatePreferences = async (req, res) => {
  try {
    const { contactId, token, preferences } = req.body;

    // Verify token (simplified - in production use proper verification)
    const contact = await Contact.findByPk(contactId);

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Update preferences in custom fields
    const updatedFields = {
      ...contact.customFields,
      emailPreferences: preferences
    };

    await contact.update({ customFields: updatedFields });

    res.json({
      success: true,
      message: 'Preferences updated successfully'
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
};

// Resubscribe contact
export const resubscribe = async (req, res) => {
  try {
    const { contactId, token } = req.body;

    const contact = await Contact.findByPk(contactId);

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Only allow resubscribe if not bounced
    if (contact.status === 'bounced') {
      return res.status(400).json({
        error: 'Cannot resubscribe a bounced email address'
      });
    }

    await contact.update({ status: 'subscribed' });

    res.json({
      success: true,
      message: 'Successfully resubscribed'
    });
  } catch (error) {
    console.error('Resubscribe error:', error);
    res.status(500).json({ error: 'Failed to resubscribe' });
  }
};
