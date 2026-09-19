import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { createReport, getAllReports, updateReportStatus } from '../services/reportService.js';
import { notifyReportCreated, notifyReportStatusChanged } from '../services/notificationService.js';

export async function createSafetyReport(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (user.role !== 'farmer') {
      res.status(403).json({ error: 'Only farmers can submit safety reports' });
      return;
    }

    const { category, description, isAnonymous, reportedEntityName, relatedOrderId } = req.body;

    const input = {
      category,
      description,
      isAnonymous,
      reportedEntityName,
      relatedOrderId,
      reporterUserId: isAnonymous ? undefined : user.userId,
      reporterName: isAnonymous ? undefined : user.userId, // Could map to name if needed
    };

    const { report } = createReport(input);

    // Send notification for new report
    notifyReportCreated(report);

    // Don't expose internal reporterUserId in response for anonymous reports
    const responseReport = {
      ...report,
      reporterUserId: report.isAnonymous ? undefined : report.reporterUserId,
      reporterName: report.isAnonymous ? 'Anonymous Farmer' : report.reporterName,
    };

    res.status(201).json({ report: responseReport });
  } catch (error) {
    res.status(400).json({ error: String(error) });
  }
}

export async function getAdminReports(_req: AuthRequest, res: Response): Promise<void> {
  try {
    const reports = getAllReports();
    // For admin view, we can include all fields
    res.json({ reports, total: reports.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reports', details: String(error) });
  }
}

export async function updateReportStatusAdmin(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user || user.role !== 'admin') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    const { id } = req.params;
    const { status, resolutionNotes } = req.body;

    if (!['open', 'reviewing', 'resolved'].includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    const updated = updateReportStatus(id, status, resolutionNotes);
    if (!updated) {
      res.status(404).json({ error: 'Report not found' });
      return;
    }

    // Send notification for status change
    notifyReportStatusChanged(updated, status, resolutionNotes);

    res.json({ report: updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update report', details: String(error) });
  }
}