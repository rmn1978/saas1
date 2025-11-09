import { Workflow } from '../models/index.js';
import { v4 as uuidv4 } from 'uuid';

export const createWorkflow = async (req, res) => {
  try {
    const { name, description, trigger, actions, conditions } = req.body;

    const workflow = await Workflow.create({
      id: uuidv4(),
      name,
      description,
      organizationId: req.organizationId,
      trigger,
      actions: actions || [],
      conditions: conditions || [],
      isActive: false
    });

    res.status(201).json({
      message: 'Workflow created successfully',
      workflow
    });
  } catch (error) {
    console.error('Create workflow error:', error);
    res.status(500).json({ error: 'Failed to create workflow' });
  }
};

export const getWorkflows = async (req, res) => {
  try {
    const { isActive, limit = 50, offset = 0 } = req.query;

    const where = { organizationId: req.organizationId };
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const workflows = await Workflow.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      workflows: workflows.rows,
      total: workflows.count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Get workflows error:', error);
    res.status(500).json({ error: 'Failed to retrieve workflows' });
  }
};

export const getWorkflow = async (req, res) => {
  try {
    const { id } = req.params;

    const workflow = await Workflow.findOne({
      where: {
        id,
        organizationId: req.organizationId
      }
    });

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    res.json({ workflow });
  } catch (error) {
    console.error('Get workflow error:', error);
    res.status(500).json({ error: 'Failed to retrieve workflow' });
  }
};

export const updateWorkflow = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const workflow = await Workflow.findOne({
      where: {
        id,
        organizationId: req.organizationId
      }
    });

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    await workflow.update(updates);

    res.json({
      message: 'Workflow updated successfully',
      workflow
    });
  } catch (error) {
    console.error('Update workflow error:', error);
    res.status(500).json({ error: 'Failed to update workflow' });
  }
};

export const deleteWorkflow = async (req, res) => {
  try {
    const { id } = req.params;

    const workflow = await Workflow.findOne({
      where: {
        id,
        organizationId: req.organizationId
      }
    });

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    await workflow.destroy();

    res.json({ message: 'Workflow deleted successfully' });
  } catch (error) {
    console.error('Delete workflow error:', error);
    res.status(500).json({ error: 'Failed to delete workflow' });
  }
};

export const toggleWorkflow = async (req, res) => {
  try {
    const { id } = req.params;

    const workflow = await Workflow.findOne({
      where: {
        id,
        organizationId: req.organizationId
      }
    });

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    await workflow.update({ isActive: !workflow.isActive });

    res.json({
      message: `Workflow ${workflow.isActive ? 'activated' : 'deactivated'} successfully`,
      workflow
    });
  } catch (error) {
    console.error('Toggle workflow error:', error);
    res.status(500).json({ error: 'Failed to toggle workflow' });
  }
};
