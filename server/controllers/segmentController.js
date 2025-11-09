import { Segment, Contact } from '../models/index.js';
import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';

export const createSegment = async (req, res) => {
  try {
    const { name, description, criteria, isDynamic } = req.body;

    // Calculate initial contact count
    const contactCount = await getSegmentContactCount(req.organizationId, criteria);

    const segment = await Segment.create({
      id: uuidv4(),
      name,
      description,
      organizationId: req.organizationId,
      criteria,
      contactCount,
      isDynamic: isDynamic !== false
    });

    res.status(201).json({
      message: 'Segment created successfully',
      segment
    });
  } catch (error) {
    console.error('Create segment error:', error);
    res.status(500).json({ error: 'Failed to create segment' });
  }
};

export const getSegments = async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const segments = await Segment.findAndCountAll({
      where: { organizationId: req.organizationId },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    // Update contact counts for dynamic segments
    for (const segment of segments.rows) {
      if (segment.isDynamic) {
        const count = await getSegmentContactCount(req.organizationId, segment.criteria);
        if (count !== segment.contactCount) {
          await segment.update({ contactCount: count });
        }
      }
    }

    res.json({
      segments: segments.rows,
      total: segments.count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Get segments error:', error);
    res.status(500).json({ error: 'Failed to retrieve segments' });
  }
};

export const getSegment = async (req, res) => {
  try {
    const { id } = req.params;

    const segment = await Segment.findOne({
      where: {
        id,
        organizationId: req.organizationId
      }
    });

    if (!segment) {
      return res.status(404).json({ error: 'Segment not found' });
    }

    // Update contact count if dynamic
    if (segment.isDynamic) {
      const count = await getSegmentContactCount(req.organizationId, segment.criteria);
      if (count !== segment.contactCount) {
        await segment.update({ contactCount: count });
      }
    }

    res.json({ segment });
  } catch (error) {
    console.error('Get segment error:', error);
    res.status(500).json({ error: 'Failed to retrieve segment' });
  }
};

export const updateSegment = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const segment = await Segment.findOne({
      where: {
        id,
        organizationId: req.organizationId
      }
    });

    if (!segment) {
      return res.status(404).json({ error: 'Segment not found' });
    }

    // Recalculate contact count if criteria changed
    if (updates.criteria) {
      updates.contactCount = await getSegmentContactCount(
        req.organizationId,
        updates.criteria
      );
    }

    await segment.update(updates);

    res.json({
      message: 'Segment updated successfully',
      segment
    });
  } catch (error) {
    console.error('Update segment error:', error);
    res.status(500).json({ error: 'Failed to update segment' });
  }
};

export const deleteSegment = async (req, res) => {
  try {
    const { id } = req.params;

    const segment = await Segment.findOne({
      where: {
        id,
        organizationId: req.organizationId
      }
    });

    if (!segment) {
      return res.status(404).json({ error: 'Segment not found' });
    }

    await segment.destroy();

    res.json({ message: 'Segment deleted successfully' });
  } catch (error) {
    console.error('Delete segment error:', error);
    res.status(500).json({ error: 'Failed to delete segment' });
  }
};

export const getSegmentContacts = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const segment = await Segment.findOne({
      where: {
        id,
        organizationId: req.organizationId
      }
    });

    if (!segment) {
      return res.status(404).json({ error: 'Segment not found' });
    }

    const where = buildSegmentWhere(req.organizationId, segment.criteria);

    const contacts = await Contact.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      segment: {
        id: segment.id,
        name: segment.name
      },
      contacts: contacts.rows,
      total: contacts.count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Get segment contacts error:', error);
    res.status(500).json({ error: 'Failed to retrieve segment contacts' });
  }
};

// Helper function to build Sequelize where clause from criteria
function buildSegmentWhere(organizationId, criteria) {
  const where = { organizationId };

  if (criteria.tags && criteria.tags.length > 0) {
    where.tags = { [Op.overlap]: criteria.tags };
  }

  if (criteria.status) {
    where.status = criteria.status;
  }

  if (criteria.leadScoreMin !== undefined) {
    where.leadScore = { [Op.gte]: criteria.leadScoreMin };
  }

  if (criteria.leadScoreMax !== undefined) {
    where.leadScore = {
      ...where.leadScore,
      [Op.lte]: criteria.leadScoreMax
    };
  }

  if (criteria.createdAfter) {
    where.createdAt = { [Op.gte]: new Date(criteria.createdAfter) };
  }

  if (criteria.createdBefore) {
    where.createdAt = {
      ...where.createdAt,
      [Op.lte]: new Date(criteria.createdBefore)
    };
  }

  if (criteria.company) {
    where.company = { [Op.iLike]: `%${criteria.company}%` };
  }

  if (criteria.hasTag) {
    where.tags = { [Op.contains]: [criteria.hasTag] };
  }

  if (criteria.emailDomain) {
    where.email = { [Op.iLike]: `%@${criteria.emailDomain}` };
  }

  return where;
}

// Helper function to get contact count for a segment
async function getSegmentContactCount(organizationId, criteria) {
  const where = buildSegmentWhere(organizationId, criteria);
  return await Contact.count({ where });
}

export const testSegment = async (req, res) => {
  try {
    const { criteria } = req.body;

    if (!criteria) {
      return res.status(400).json({ error: 'Criteria is required' });
    }

    const contactCount = await getSegmentContactCount(req.organizationId, criteria);

    // Get sample contacts
    const where = buildSegmentWhere(req.organizationId, criteria);
    const sampleContacts = await Contact.findAll({
      where,
      limit: 10,
      attributes: ['id', 'email', 'firstName', 'lastName', 'tags', 'leadScore']
    });

    res.json({
      contactCount,
      sampleContacts
    });
  } catch (error) {
    console.error('Test segment error:', error);
    res.status(500).json({ error: 'Failed to test segment' });
  }
};
