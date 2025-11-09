import { Template } from '../models/index.js';
import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';

export const createTemplate = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      htmlContent,
      textContent,
      designJson,
      isPublic
    } = req.body;

    const template = await Template.create({
      id: uuidv4(),
      name,
      description,
      organizationId: req.organizationId,
      category: category || 'custom',
      htmlContent,
      textContent,
      designJson,
      isPublic: isPublic || false
    });

    res.status(201).json({
      message: 'Template created successfully',
      template
    });
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
};

export const getTemplates = async (req, res) => {
  try {
    const { category, search, limit = 50, offset = 0 } = req.query;

    const where = {
      [Op.or]: [
        { organizationId: req.organizationId },
        { organizationId: null, isPublic: true } // System templates
      ]
    };

    if (category) {
      where.category = category;
    }

    if (search) {
      where.name = { [Op.iLike]: `%${search}%` };
    }

    const templates = await Template.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      templates: templates.rows,
      total: templates.count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ error: 'Failed to retrieve templates' });
  }
};

export const getTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    const template = await Template.findOne({
      where: {
        id,
        [Op.or]: [
          { organizationId: req.organizationId },
          { organizationId: null, isPublic: true }
        ]
      }
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({ template });
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({ error: 'Failed to retrieve template' });
  }
};

export const updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const template = await Template.findOne({
      where: {
        id,
        organizationId: req.organizationId // Can only update own templates
      }
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found or access denied' });
    }

    await template.update(updates);

    res.json({
      message: 'Template updated successfully',
      template
    });
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
};

export const deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    const template = await Template.findOne({
      where: {
        id,
        organizationId: req.organizationId
      }
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found or access denied' });
    }

    await template.destroy();

    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
};

export const duplicateTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    const template = await Template.findOne({
      where: {
        id,
        [Op.or]: [
          { organizationId: req.organizationId },
          { organizationId: null, isPublic: true }
        ]
      }
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const duplicatedTemplate = await Template.create({
      id: uuidv4(),
      name: `${template.name} (Copy)`,
      description: template.description,
      organizationId: req.organizationId,
      category: template.category,
      htmlContent: template.htmlContent,
      textContent: template.textContent,
      designJson: template.designJson,
      isPublic: false
    });

    res.status(201).json({
      message: 'Template duplicated successfully',
      template: duplicatedTemplate
    });
  } catch (error) {
    console.error('Duplicate template error:', error);
    res.status(500).json({ error: 'Failed to duplicate template' });
  }
};

export const getTemplateCategories = async (req, res) => {
  try {
    const categories = await Template.findAll({
      where: {
        [Op.or]: [
          { organizationId: req.organizationId },
          { organizationId: null, isPublic: true }
        ]
      },
      attributes: [
        'category',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['category'],
      raw: true
    });

    res.json({ categories });
  } catch (error) {
    console.error('Get template categories error:', error);
    res.status(500).json({ error: 'Failed to retrieve template categories' });
  }
};

// Seed some default templates
export const seedDefaultTemplates = async (organizationId = null) => {
  const defaultTemplates = [
    {
      id: uuidv4(),
      name: 'Welcome Email',
      description: 'A warm welcome email for new subscribers',
      organizationId,
      category: 'welcome',
      isPublic: true,
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3b82f6; color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; background: #f9fafb; }
            .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Our Community!</h1>
            </div>
            <div class="content">
              <p>Hi {{firstName}},</p>
              <p>We're thrilled to have you join us! You've just taken the first step towards something amazing.</p>
              <p>Here's what you can expect:</p>
              <ul>
                <li>Regular updates and insights</li>
                <li>Exclusive content and offers</li>
                <li>Tips and best practices</li>
              </ul>
              <p style="text-align: center; margin-top: 30px;">
                <a href="#" class="button">Get Started</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      textContent: 'Welcome {{firstName}}! We\'re thrilled to have you join us!'
    },
    {
      id: uuidv4(),
      name: 'Newsletter Template',
      description: 'Clean newsletter template',
      organizationId,
      category: 'newsletter',
      isPublic: true,
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { border-bottom: 3px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
            .article { margin-bottom: 30px; padding: 20px; background: #f9fafb; border-radius: 8px; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>This Week's Newsletter</h1>
            </div>
            <div class="article">
              <h2>Article Title</h2>
              <p>Your content goes here...</p>
            </div>
            <div class="footer">
              <p>You're receiving this email because you subscribed to our newsletter.</p>
              <p><a href="#">Unsubscribe</a> | <a href="#">Update Preferences</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
      textContent: 'This Week\'s Newsletter...'
    },
    {
      id: uuidv4(),
      name: 'Product Launch',
      description: 'Announce new products or features',
      organizationId,
      category: 'announcement',
      isPublic: true,
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; }
            .hero { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 60px 30px; text-align: center; }
            .content { padding: 40px 30px; }
            .cta { text-align: center; padding: 40px; }
            .button { display: inline-block; padding: 15px 40px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="hero">
              <h1>🎉 Introducing Our Latest Product!</h1>
              <p>Something amazing is here</p>
            </div>
            <div class="content">
              <p>Hi {{firstName}},</p>
              <p>We're excited to announce the launch of our newest product that will revolutionize the way you work.</p>
              <h3>Key Features:</h3>
              <ul>
                <li>Feature 1: Amazing capability</li>
                <li>Feature 2: Incredible functionality</li>
                <li>Feature 3: Game-changing innovation</li>
              </ul>
            </div>
            <div class="cta">
              <a href="#" class="button">Learn More</a>
            </div>
          </div>
        </body>
        </html>
      `,
      textContent: 'Introducing Our Latest Product!'
    }
  ];

  try {
    for (const template of defaultTemplates) {
      await Template.findOrCreate({
        where: { name: template.name, organizationId: template.organizationId },
        defaults: template
      });
    }
    console.log('Default templates seeded successfully');
  } catch (error) {
    console.error('Error seeding default templates:', error);
  }
};
