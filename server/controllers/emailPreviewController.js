import { Template, Contact, Campaign } from '../models/index.js';

export const previewEmailTemplate = async (req, res) => {
  try {
    const { templateId, contactId, customVariables } = req.body;

    let htmlContent = '';
    let textContent = '';

    // Get template content
    if (templateId) {
      const template = await Template.findOne({
        where: {
          id: templateId,
          organizationId: req.organizationId
        }
      });

      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      htmlContent = template.htmlContent;
      textContent = template.textContent;
    } else if (req.body.htmlContent) {
      htmlContent = req.body.htmlContent;
      textContent = req.body.textContent || '';
    } else {
      return res.status(400).json({ error: 'Either templateId or htmlContent is required' });
    }

    // Get contact data if contactId provided, otherwise use sample data
    let variables = {};

    if (contactId) {
      const contact = await Contact.findOne({
        where: {
          id: contactId,
          organizationId: req.organizationId
        }
      });

      if (!contact) {
        return res.status(404).json({ error: 'Contact not found' });
      }

      variables = {
        firstName: contact.firstName || '',
        lastName: contact.lastName || '',
        email: contact.email || '',
        company: contact.company || '',
        jobTitle: contact.jobTitle || '',
        phone: contact.phone || ''
      };
    } else {
      // Use sample data for preview
      variables = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        company: 'Acme Corporation',
        jobTitle: 'Marketing Manager',
        phone: '+1 555-0123'
      };
    }

    // Merge custom variables
    if (customVariables) {
      variables = { ...variables, ...customVariables };
    }

    // Replace variables in content
    const previewHtml = replaceVariables(htmlContent, variables);
    const previewText = replaceVariables(textContent, variables);

    // Extract used variables
    const usedVariables = extractUsedVariables(htmlContent);

    res.json({
      preview: {
        html: previewHtml,
        text: previewText
      },
      variables,
      usedVariables,
      availableVariables: [
        'firstName',
        'lastName',
        'email',
        'company',
        'jobTitle',
        'phone'
      ]
    });
  } catch (error) {
    console.error('Preview email template error:', error);
    res.status(500).json({ error: 'Failed to preview email template' });
  }
};

export const previewCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const { contactId } = req.body;

    const campaign = await Campaign.findOne({
      where: {
        id,
        organizationId: req.organizationId
      },
      include: [
        {
          model: Template,
          as: 'template'
        }
      ]
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Get contact data if contactId provided, otherwise use sample data
    let variables = {};

    if (contactId) {
      const contact = await Contact.findOne({
        where: {
          id: contactId,
          organizationId: req.organizationId
        }
      });

      if (!contact) {
        return res.status(404).json({ error: 'Contact not found' });
      }

      variables = {
        firstName: contact.firstName || '',
        lastName: contact.lastName || '',
        email: contact.email || '',
        company: contact.company || '',
        jobTitle: contact.jobTitle || '',
        phone: contact.phone || ''
      };
    } else {
      // Use sample data
      variables = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        company: 'Acme Corporation',
        jobTitle: 'Marketing Manager',
        phone: '+1 555-0123'
      };
    }

    // Replace variables in campaign content
    const previewHtml = replaceVariables(campaign.htmlContent, variables);
    const previewText = replaceVariables(campaign.textContent || '', variables);
    const previewSubject = replaceVariables(campaign.subject, variables);

    res.json({
      campaign: {
        id: campaign.id,
        name: campaign.name,
        subject: previewSubject,
        fromName: campaign.fromName,
        fromEmail: campaign.fromEmail
      },
      preview: {
        html: previewHtml,
        text: previewText,
        subject: previewSubject
      },
      variables,
      usedVariables: extractUsedVariables(campaign.htmlContent + ' ' + campaign.subject)
    });
  } catch (error) {
    console.error('Preview campaign error:', error);
    res.status(500).json({ error: 'Failed to preview campaign' });
  }
};

export const sendTestPreview = async (req, res) => {
  try {
    const { templateId, campaignId, testEmail, contactId, customVariables } = req.body;

    if (!testEmail) {
      return res.status(400).json({ error: 'testEmail is required' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(testEmail)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    let htmlContent = '';
    let textContent = '';
    let subject = 'Test Email Preview';

    // Get content from template or campaign
    if (templateId) {
      const template = await Template.findOne({
        where: {
          id: templateId,
          organizationId: req.organizationId
        }
      });

      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      htmlContent = template.htmlContent;
      textContent = template.textContent;
      subject = `Test Preview: ${template.name}`;
    } else if (campaignId) {
      const campaign = await Campaign.findOne({
        where: {
          id: campaignId,
          organizationId: req.organizationId
        }
      });

      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      htmlContent = campaign.htmlContent;
      textContent = campaign.textContent || '';
      subject = `Test Preview: ${campaign.subject}`;
    } else if (req.body.htmlContent) {
      htmlContent = req.body.htmlContent;
      textContent = req.body.textContent || '';
      subject = req.body.subject || 'Test Email Preview';
    } else {
      return res.status(400).json({
        error: 'Either templateId, campaignId, or htmlContent is required'
      });
    }

    // Get variables
    let variables = {};

    if (contactId) {
      const contact = await Contact.findOne({
        where: {
          id: contactId,
          organizationId: req.organizationId
        }
      });

      if (contact) {
        variables = {
          firstName: contact.firstName || '',
          lastName: contact.lastName || '',
          email: contact.email || '',
          company: contact.company || '',
          jobTitle: contact.jobTitle || '',
          phone: contact.phone || ''
        };
      }
    } else {
      // Use sample data
      variables = {
        firstName: 'John',
        lastName: 'Doe',
        email: testEmail,
        company: 'Acme Corporation',
        jobTitle: 'Marketing Manager',
        phone: '+1 555-0123'
      };
    }

    // Merge custom variables
    if (customVariables) {
      variables = { ...variables, ...customVariables };
    }

    // Replace variables
    const finalHtml = replaceVariables(htmlContent, variables);
    const finalText = replaceVariables(textContent, variables);
    const finalSubject = replaceVariables(subject, variables);

    // In a real application, this would use the email service
    // For now, we'll just return success
    // await emailService.sendEmail({
    //   to: testEmail,
    //   subject: finalSubject,
    //   html: finalHtml,
    //   text: finalText
    // });

    res.json({
      message: 'Test email sent successfully',
      sentTo: testEmail,
      preview: {
        subject: finalSubject,
        html: finalHtml,
        text: finalText
      }
    });
  } catch (error) {
    console.error('Send test preview error:', error);
    res.status(500).json({ error: 'Failed to send test email' });
  }
};

export const validateEmailContent = async (req, res) => {
  try {
    const { htmlContent, textContent } = req.body;

    if (!htmlContent) {
      return res.status(400).json({ error: 'htmlContent is required' });
    }

    const validation = {
      isValid: true,
      warnings: [],
      errors: [],
      suggestions: []
    };

    // Check for required elements
    if (!htmlContent.includes('<html') && !htmlContent.includes('<body')) {
      validation.warnings.push('Missing HTML structure tags (html, body)');
    }

    // Check for unsubscribe link
    if (!htmlContent.toLowerCase().includes('unsubscribe')) {
      validation.warnings.push('Missing unsubscribe link (recommended for compliance)');
      validation.suggestions.push('Add an unsubscribe link: <a href="{{unsubscribeUrl}}">Unsubscribe</a>');
    }

    // Check for broken variables
    const brokenVars = htmlContent.match(/\{\{[^}]*\}\}/g) || [];
    const validVars = ['firstName', 'lastName', 'email', 'company', 'jobTitle', 'phone', 'unsubscribeUrl'];

    brokenVars.forEach(varMatch => {
      const varName = varMatch.replace(/[{}]/g, '').trim();
      if (!validVars.includes(varName)) {
        validation.warnings.push(`Unknown variable: ${varMatch}`);
      }
    });

    // Check content length
    if (htmlContent.length > 102400) { // 100KB
      validation.warnings.push('HTML content is very large (>100KB). Consider optimizing.');
    }

    // Check for inline styles (good for email compatibility)
    if (htmlContent.includes('<style') && !htmlContent.includes('style=')) {
      validation.suggestions.push('Consider using inline styles for better email client compatibility');
    }

    // Check for images without alt text
    const imgTags = htmlContent.match(/<img[^>]*>/gi) || [];
    imgTags.forEach(img => {
      if (!img.includes('alt=')) {
        validation.warnings.push('Image found without alt text (accessibility issue)');
      }
    });

    // Check text version
    if (!textContent || textContent.trim().length === 0) {
      validation.warnings.push('No plain text version provided (recommended for accessibility)');
      validation.suggestions.push('Provide a plain text version of your email');
    }

    // Set overall validity
    validation.isValid = validation.errors.length === 0;

    res.json(validation);
  } catch (error) {
    console.error('Validate email content error:', error);
    res.status(500).json({ error: 'Failed to validate email content' });
  }
};

// Helper function to replace variables in content
function replaceVariables(content, variables) {
  if (!content) return '';

  let result = content;

  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
    result = result.replace(regex, value || '');
  }

  return result;
}

// Helper function to extract used variables from content
function extractUsedVariables(content) {
  if (!content) return [];

  const matches = content.match(/\{\{([^}]+)\}\}/g) || [];
  const variables = matches.map(match =>
    match.replace(/[{}]/g, '').trim()
  );

  return [...new Set(variables)]; // Remove duplicates
}
