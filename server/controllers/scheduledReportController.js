import { ScheduledReport } from '../models/index.js';
import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

export const createScheduledReport = async (req, res) => {
  try {
    const {
      name,
      reportType,
      frequency,
      format,
      recipients,
      filters,
      isActive
    } = req.body;

    if (!name || !reportType || !frequency || !recipients) {
      return res.status(400).json({
        error: 'name, reportType, frequency, and recipients are required'
      });
    }

    const validReportTypes = [
      'dashboard',
      'campaign_performance',
      'contact_growth',
      'workflow_performance',
      'engagement_summary',
      'revenue_report'
    ];

    if (!validReportTypes.includes(reportType)) {
      return res.status(400).json({
        error: `reportType must be one of: ${validReportTypes.join(', ')}`
      });
    }

    const validFrequencies = ['daily', 'weekly', 'monthly'];
    if (!validFrequencies.includes(frequency)) {
      return res.status(400).json({
        error: `frequency must be one of: ${validFrequencies.join(', ')}`
      });
    }

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        error: 'recipients must be a non-empty array of email addresses'
      });
    }

    const scheduledReport = await ScheduledReport.create({
      id: uuidv4(),
      organizationId: req.organizationId,
      name,
      reportType,
      frequency,
      format: format || 'pdf',
      recipients,
      filters: filters || {},
      isActive: isActive !== undefined ? isActive : true,
      lastRunAt: null,
      nextRunAt: calculateNextRunTime(frequency)
    });

    res.status(201).json(scheduledReport);
  } catch (error) {
    console.error('Create scheduled report error:', error);
    res.status(500).json({ error: 'Failed to create scheduled report' });
  }
};

export const getScheduledReports = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows: reports } = await ScheduledReport.findAndCountAll({
      where: { organizationId: req.organizationId },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      reports,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    console.error('Get scheduled reports error:', error);
    res.status(500).json({ error: 'Failed to fetch scheduled reports' });
  }
};

export const getScheduledReport = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await ScheduledReport.findOne({
      where: {
        id,
        organizationId: req.organizationId
      }
    });

    if (!report) {
      return res.status(404).json({ error: 'Scheduled report not found' });
    }

    res.json(report);
  } catch (error) {
    console.error('Get scheduled report error:', error);
    res.status(500).json({ error: 'Failed to fetch scheduled report' });
  }
};

export const updateScheduledReport = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      reportType,
      frequency,
      format,
      recipients,
      filters,
      isActive
    } = req.body;

    const report = await ScheduledReport.findOne({
      where: {
        id,
        organizationId: req.organizationId
      }
    });

    if (!report) {
      return res.status(404).json({ error: 'Scheduled report not found' });
    }

    const updates = {};

    if (name !== undefined) updates.name = name;
    if (reportType !== undefined) updates.reportType = reportType;
    if (format !== undefined) updates.format = format;
    if (recipients !== undefined) updates.recipients = recipients;
    if (filters !== undefined) updates.filters = filters;
    if (isActive !== undefined) updates.isActive = isActive;

    if (frequency !== undefined && frequency !== report.frequency) {
      updates.frequency = frequency;
      updates.nextRunAt = calculateNextRunTime(frequency);
    }

    await report.update(updates);

    res.json(report);
  } catch (error) {
    console.error('Update scheduled report error:', error);
    res.status(500).json({ error: 'Failed to update scheduled report' });
  }
};

export const deleteScheduledReport = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await ScheduledReport.destroy({
      where: {
        id,
        organizationId: req.organizationId
      }
    });

    if (!deleted) {
      return res.status(404).json({ error: 'Scheduled report not found' });
    }

    res.json({ message: 'Scheduled report deleted successfully' });
  } catch (error) {
    console.error('Delete scheduled report error:', error);
    res.status(500).json({ error: 'Failed to delete scheduled report' });
  }
};

export const toggleScheduledReport = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await ScheduledReport.findOne({
      where: {
        id,
        organizationId: req.organizationId
      }
    });

    if (!report) {
      return res.status(404).json({ error: 'Scheduled report not found' });
    }

    await report.update({
      isActive: !report.isActive,
      nextRunAt: !report.isActive ? calculateNextRunTime(report.frequency) : null
    });

    res.json(report);
  } catch (error) {
    console.error('Toggle scheduled report error:', error);
    res.status(500).json({ error: 'Failed to toggle scheduled report' });
  }
};

export const getReportHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const report = await ScheduledReport.findOne({
      where: {
        id,
        organizationId: req.organizationId
      }
    });

    if (!report) {
      return res.status(404).json({ error: 'Scheduled report not found' });
    }

    // In a real application, you'd have a ReportHistory model
    // For now, we'll return the basic execution info
    res.json({
      reportId: id,
      lastRunAt: report.lastRunAt,
      nextRunAt: report.nextRunAt,
      totalRuns: report.executionCount || 0,
      history: [] // Would contain detailed execution history
    });
  } catch (error) {
    console.error('Get report history error:', error);
    res.status(500).json({ error: 'Failed to fetch report history' });
  }
};

export const runScheduledReportNow = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await ScheduledReport.findOne({
      where: {
        id,
        organizationId: req.organizationId
      }
    });

    if (!report) {
      return res.status(404).json({ error: 'Scheduled report not found' });
    }

    // In a real application, this would trigger the report generation job
    // For now, we'll just update the lastRunAt timestamp
    await report.update({
      lastRunAt: new Date(),
      executionCount: (report.executionCount || 0) + 1
    });

    res.json({
      message: 'Report generation started',
      report
    });
  } catch (error) {
    console.error('Run scheduled report error:', error);
    res.status(500).json({ error: 'Failed to run scheduled report' });
  }
};

// Helper function to calculate next run time based on frequency
function calculateNextRunTime(frequency) {
  const now = new Date();
  const nextRun = new Date(now);

  switch (frequency) {
    case 'daily':
      nextRun.setDate(now.getDate() + 1);
      nextRun.setHours(9, 0, 0, 0); // 9 AM next day
      break;
    case 'weekly':
      nextRun.setDate(now.getDate() + 7);
      nextRun.setHours(9, 0, 0, 0); // 9 AM next week
      break;
    case 'monthly':
      nextRun.setMonth(now.getMonth() + 1);
      nextRun.setDate(1); // First day of next month
      nextRun.setHours(9, 0, 0, 0); // 9 AM
      break;
    default:
      nextRun.setDate(now.getDate() + 1);
      nextRun.setHours(9, 0, 0, 0);
  }

  return nextRun;
}
