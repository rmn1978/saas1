import { Contact, Campaign, EmailEvent } from '../models/index.js';
import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

export const bulkUpdateContacts = async (req, res) => {
  try {
    const { contactIds, updates } = req.body;

    if (!Array.isArray(contactIds) || contactIds.length === 0) {
      return res.status(400).json({ error: 'contactIds array is required' });
    }

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'updates object is required' });
    }

    const result = await Contact.update(updates, {
      where: {
        id: { [Op.in]: contactIds },
        organizationId: req.organizationId
      }
    });

    res.json({
      message: `Successfully updated ${result[0]} contacts`,
      updatedCount: result[0]
    });
  } catch (error) {
    console.error('Bulk update contacts error:', error);
    res.status(500).json({ error: 'Failed to update contacts' });
  }
};

export const bulkDeleteContacts = async (req, res) => {
  try {
    const { contactIds } = req.body;

    if (!Array.isArray(contactIds) || contactIds.length === 0) {
      return res.status(400).json({ error: 'contactIds array is required' });
    }

    const deletedCount = await Contact.destroy({
      where: {
        id: { [Op.in]: contactIds },
        organizationId: req.organizationId
      }
    });

    res.json({
      message: `Successfully deleted ${deletedCount} contacts`,
      deletedCount
    });
  } catch (error) {
    console.error('Bulk delete contacts error:', error);
    res.status(500).json({ error: 'Failed to delete contacts' });
  }
};

export const bulkAddTags = async (req, res) => {
  try {
    const { contactIds, tags } = req.body;

    if (!Array.isArray(contactIds) || contactIds.length === 0) {
      return res.status(400).json({ error: 'contactIds array is required' });
    }

    if (!Array.isArray(tags) || tags.length === 0) {
      return res.status(400).json({ error: 'tags array is required' });
    }

    const contacts = await Contact.findAll({
      where: {
        id: { [Op.in]: contactIds },
        organizationId: req.organizationId
      }
    });

    let updatedCount = 0;

    for (const contact of contacts) {
      const currentTags = contact.tags || [];
      const newTags = [...new Set([...currentTags, ...tags])];

      if (newTags.length !== currentTags.length) {
        await contact.update({ tags: newTags });
        updatedCount++;
      }
    }

    res.json({
      message: `Successfully added tags to ${updatedCount} contacts`,
      updatedCount
    });
  } catch (error) {
    console.error('Bulk add tags error:', error);
    res.status(500).json({ error: 'Failed to add tags' });
  }
};

export const bulkRemoveTags = async (req, res) => {
  try {
    const { contactIds, tags } = req.body;

    if (!Array.isArray(contactIds) || contactIds.length === 0) {
      return res.status(400).json({ error: 'contactIds array is required' });
    }

    if (!Array.isArray(tags) || tags.length === 0) {
      return res.status(400).json({ error: 'tags array is required' });
    }

    const contacts = await Contact.findAll({
      where: {
        id: { [Op.in]: contactIds },
        organizationId: req.organizationId
      }
    });

    let updatedCount = 0;

    for (const contact of contacts) {
      const currentTags = contact.tags || [];
      const newTags = currentTags.filter(tag => !tags.includes(tag));

      if (newTags.length !== currentTags.length) {
        await contact.update({ tags: newTags });
        updatedCount++;
      }
    }

    res.json({
      message: `Successfully removed tags from ${updatedCount} contacts`,
      updatedCount
    });
  } catch (error) {
    console.error('Bulk remove tags error:', error);
    res.status(500).json({ error: 'Failed to remove tags' });
  }
};

export const bulkUpdateLeadScore = async (req, res) => {
  try {
    const { contactIds, operation, value } = req.body;

    if (!Array.isArray(contactIds) || contactIds.length === 0) {
      return res.status(400).json({ error: 'contactIds array is required' });
    }

    if (!['set', 'add', 'subtract'].includes(operation)) {
      return res.status(400).json({ error: 'operation must be set, add, or subtract' });
    }

    if (typeof value !== 'number') {
      return res.status(400).json({ error: 'value must be a number' });
    }

    const contacts = await Contact.findAll({
      where: {
        id: { [Op.in]: contactIds },
        organizationId: req.organizationId
      }
    });

    for (const contact of contacts) {
      let newScore;

      switch (operation) {
        case 'set':
          newScore = value;
          break;
        case 'add':
          newScore = (contact.leadScore || 0) + value;
          break;
        case 'subtract':
          newScore = (contact.leadScore || 0) - value;
          break;
      }

      // Ensure score stays within reasonable bounds
      newScore = Math.max(0, Math.min(1000, newScore));

      await contact.update({ leadScore: newScore });
    }

    res.json({
      message: `Successfully updated lead scores for ${contacts.length} contacts`,
      updatedCount: contacts.length
    });
  } catch (error) {
    console.error('Bulk update lead score error:', error);
    res.status(500).json({ error: 'Failed to update lead scores' });
  }
};

export const bulkExportContacts = async (req, res) => {
  try {
    const { contactIds, format = 'csv', fields } = req.body;

    const where = { organizationId: req.organizationId };

    if (contactIds && Array.isArray(contactIds) && contactIds.length > 0) {
      where.id = { [Op.in]: contactIds };
    }

    const contacts = await Contact.findAll({
      where,
      attributes: fields || [
        'email',
        'firstName',
        'lastName',
        'company',
        'jobTitle',
        'phone',
        'status',
        'tags',
        'leadScore',
        'createdAt'
      ]
    });

    if (format === 'csv') {
      const csv = convertContactsToCSV(contacts);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="contacts.csv"');
      return res.send(csv);
    }

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="contacts.json"');
      return res.json(contacts);
    }

    res.status(400).json({ error: 'Unsupported format. Use csv or json' });
  } catch (error) {
    console.error('Bulk export contacts error:', error);
    res.status(500).json({ error: 'Failed to export contacts' });
  }
};

export const bulkUnsubscribe = async (req, res) => {
  try {
    const { contactIds } = req.body;

    if (!Array.isArray(contactIds) || contactIds.length === 0) {
      return res.status(400).json({ error: 'contactIds array is required' });
    }

    const result = await Contact.update(
      { status: 'unsubscribed' },
      {
        where: {
          id: { [Op.in]: contactIds },
          organizationId: req.organizationId
        }
      }
    );

    res.json({
      message: `Successfully unsubscribed ${result[0]} contacts`,
      unsubscribedCount: result[0]
    });
  } catch (error) {
    console.error('Bulk unsubscribe error:', error);
    res.status(500).json({ error: 'Failed to unsubscribe contacts' });
  }
};

export const bulkResubscribe = async (req, res) => {
  try {
    const { contactIds } = req.body;

    if (!Array.isArray(contactIds) || contactIds.length === 0) {
      return res.status(400).json({ error: 'contactIds array is required' });
    }

    const result = await Contact.update(
      { status: 'subscribed' },
      {
        where: {
          id: { [Op.in]: contactIds },
          organizationId: req.organizationId,
          status: { [Op.ne]: 'bounced' } // Don't resubscribe bounced emails
        }
      }
    );

    res.json({
      message: `Successfully resubscribed ${result[0]} contacts`,
      resubscribedCount: result[0]
    });
  } catch (error) {
    console.error('Bulk resubscribe error:', error);
    res.status(500).json({ error: 'Failed to resubscribe contacts' });
  }
};

export const bulkSearchAndReplace = async (req, res) => {
  try {
    const { field, searchValue, replaceValue, contactIds } = req.body;

    if (!field || !searchValue) {
      return res.status(400).json({ error: 'field and searchValue are required' });
    }

    const allowedFields = ['company', 'jobTitle', 'phone'];
    if (!allowedFields.includes(field)) {
      return res.status(400).json({ error: 'field must be one of: company, jobTitle, phone' });
    }

    const where = { organizationId: req.organizationId };

    if (contactIds && Array.isArray(contactIds) && contactIds.length > 0) {
      where.id = { [Op.in]: contactIds };
    }

    where[field] = { [Op.iLike]: `%${searchValue}%` };

    const contacts = await Contact.findAll({ where });

    let updatedCount = 0;

    for (const contact of contacts) {
      const currentValue = contact[field] || '';
      const newValue = currentValue.replace(
        new RegExp(searchValue, 'gi'),
        replaceValue || ''
      );

      if (newValue !== currentValue) {
        await contact.update({ [field]: newValue });
        updatedCount++;
      }
    }

    res.json({
      message: `Successfully updated ${updatedCount} contacts`,
      updatedCount
    });
  } catch (error) {
    console.error('Bulk search and replace error:', error);
    res.status(500).json({ error: 'Failed to perform search and replace' });
  }
};

// Helper function to convert contacts to CSV
function convertContactsToCSV(contacts) {
  if (!contacts || contacts.length === 0) return '';

  const jsonContacts = contacts.map(c => c.toJSON ? c.toJSON() : c);
  const headers = Object.keys(jsonContacts[0]);
  const csvRows = [headers.join(',')];

  for (const contact of jsonContacts) {
    const values = headers.map(header => {
      const value = contact[header];
      if (Array.isArray(value)) {
        return `"${value.join('; ')}"`;
      }
      if (typeof value === 'object' && value !== null) {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      }
      return `"${String(value || '').replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}
