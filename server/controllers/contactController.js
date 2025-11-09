import { Contact, EmailEvent } from '../models/index.js';
import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';

export const createContact = async (req, res) => {
  try {
    const {
      email,
      firstName,
      lastName,
      phone,
      company,
      jobTitle,
      tags,
      customFields,
      source
    } = req.body;

    // Check if contact already exists
    const existingContact = await Contact.findOne({
      where: {
        email,
        organizationId: req.organizationId
      }
    });

    if (existingContact) {
      return res.status(400).json({ error: 'Contact already exists' });
    }

    const contact = await Contact.create({
      id: uuidv4(),
      email,
      firstName,
      lastName,
      phone,
      company,
      jobTitle,
      organizationId: req.organizationId,
      tags: tags || [],
      customFields: customFields || {},
      source: source || 'manual',
      lastActivityAt: new Date()
    });

    res.status(201).json({
      message: 'Contact created successfully',
      contact
    });
  } catch (error) {
    console.error('Create contact error:', error);
    res.status(500).json({ error: 'Failed to create contact' });
  }
};

export const getContacts = async (req, res) => {
  try {
    const {
      search,
      status,
      tags,
      limit = 50,
      offset = 0,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    const where = { organizationId: req.organizationId };

    // Search filter
    if (search) {
      where[Op.or] = [
        { email: { [Op.iLike]: `%${search}%` } },
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { company: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Status filter
    if (status) {
      where.status = status;
    }

    // Tags filter
    if (tags) {
      const tagArray = tags.split(',');
      where.tags = { [Op.overlap]: tagArray };
    }

    const contacts = await Contact.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder.toUpperCase()]]
    });

    res.json({
      contacts: contacts.rows,
      total: contacts.count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ error: 'Failed to retrieve contacts' });
  }
};

export const getContact = async (req, res) => {
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

    // Get contact's email activity
    const emailActivity = await EmailEvent.findAll({
      where: { contactId: id },
      limit: 50,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      contact,
      emailActivity
    });
  } catch (error) {
    console.error('Get contact error:', error);
    res.status(500).json({ error: 'Failed to retrieve contact' });
  }
};

export const updateContact = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const contact = await Contact.findOne({
      where: {
        id,
        organizationId: req.organizationId
      }
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Prevent changing email to one that already exists
    if (updates.email && updates.email !== contact.email) {
      const existingContact = await Contact.findOne({
        where: {
          email: updates.email,
          organizationId: req.organizationId,
          id: { [Op.ne]: id }
        }
      });

      if (existingContact) {
        return res.status(400).json({ error: 'Email already exists for another contact' });
      }
    }

    await contact.update(updates);

    res.json({
      message: 'Contact updated successfully',
      contact
    });
  } catch (error) {
    console.error('Update contact error:', error);
    res.status(500).json({ error: 'Failed to update contact' });
  }
};

export const deleteContact = async (req, res) => {
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

    await contact.destroy();

    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
};

export const importContacts = async (req, res) => {
  try {
    const { contacts } = req.body;

    if (!Array.isArray(contacts) || contacts.length === 0) {
      return res.status(400).json({ error: 'Invalid contacts data' });
    }

    const results = {
      imported: 0,
      skipped: 0,
      errors: []
    };

    for (const contactData of contacts) {
      try {
        // Check if contact already exists
        const existingContact = await Contact.findOne({
          where: {
            email: contactData.email,
            organizationId: req.organizationId
          }
        });

        if (existingContact) {
          results.skipped++;
          continue;
        }

        await Contact.create({
          id: uuidv4(),
          ...contactData,
          organizationId: req.organizationId,
          source: 'import',
          lastActivityAt: new Date()
        });

        results.imported++;
      } catch (error) {
        results.errors.push({
          email: contactData.email,
          error: error.message
        });
      }
    }

    res.json({
      message: 'Import completed',
      results
    });
  } catch (error) {
    console.error('Import contacts error:', error);
    res.status(500).json({ error: 'Failed to import contacts' });
  }
};

export const addTags = async (req, res) => {
  try {
    const { id } = req.params;
    const { tags } = req.body;

    const contact = await Contact.findOne({
      where: {
        id,
        organizationId: req.organizationId
      }
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    const currentTags = contact.tags || [];
    const newTags = [...new Set([...currentTags, ...tags])];

    await contact.update({ tags: newTags });

    res.json({
      message: 'Tags added successfully',
      contact
    });
  } catch (error) {
    console.error('Add tags error:', error);
    res.status(500).json({ error: 'Failed to add tags' });
  }
};

export const removeTags = async (req, res) => {
  try {
    const { id } = req.params;
    const { tags } = req.body;

    const contact = await Contact.findOne({
      where: {
        id,
        organizationId: req.organizationId
      }
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    const currentTags = contact.tags || [];
    const newTags = currentTags.filter(tag => !tags.includes(tag));

    await contact.update({ tags: newTags });

    res.json({
      message: 'Tags removed successfully',
      contact
    });
  } catch (error) {
    console.error('Remove tags error:', error);
    res.status(500).json({ error: 'Failed to remove tags' });
  }
};
