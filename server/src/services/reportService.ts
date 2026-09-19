import { store } from '../data/store.js';
import { SafetyReport } from '../types.js';

export interface CreateReportInput {
  category: SafetyReport['category'];
  description: string;
  isAnonymous: boolean;
  reportedEntityName: string;
  relatedOrderId?: string;
  reporterUserId?: string;
  reporterName?: string;
}

export interface ReportServiceResult {
  report: SafetyReport;
}

export function validateReportInput(input: CreateReportInput): { valid: boolean; error?: string } {
  const validCategories = [
    'Underpricing & Cartel',
    'Harassment',
    'Broker Exploitation',
    'Payment Default',
    'Transport Dispute'
  ];

  if (!input.category || !validCategories.includes(input.category)) {
    return { valid: false, error: 'Invalid category' };
  }

  if (!input.description || input.description.trim().length < 10) {
    return { valid: false, error: 'Description must be at least 10 characters' };
  }

  if (!input.reportedEntityName || input.reportedEntityName.trim().length === 0) {
    return { valid: false, error: 'Reported entity name is required' };
  }

  if (typeof input.isAnonymous !== 'boolean') {
    return { valid: false, error: 'isAnonymous must be a boolean' };
  }

  if (!input.isAnonymous && (!input.reporterUserId || !input.reporterName)) {
    return { valid: false, error: 'Identified reports require reporterUserId and reporterName' };
  }

  return { valid: true };
}

export function createReport(input: CreateReportInput): ReportServiceResult {
  const validation = validateReportInput(input);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const report: SafetyReport = {
    id: `REP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    reporterUserId: input.isAnonymous ? undefined : input.reporterUserId,
    reporterName: input.isAnonymous ? undefined : input.reporterName,
    isAnonymous: input.isAnonymous,
    reportedEntityName: input.reportedEntityName.trim(),
    category: input.category,
    description: input.description.trim(),
    relatedOrderId: input.relatedOrderId,
    status: 'open',
    createdAt: new Date().toISOString(),
  };

  store.reports.push(report);
  return { report };
}

export function getAllReports(): SafetyReport[] {
  return [...store.reports].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getReportById(id: string): SafetyReport | undefined {
  return store.reports.find(r => r.id === id);
}

export function updateReportStatus(
  id: string,
  status: 'open' | 'reviewing' | 'resolved',
  resolutionNotes?: string
): SafetyReport | null {
  const idx = store.reports.findIndex(r => r.id === id);
  if (idx === -1) return null;

  store.reports[idx] = {
    ...store.reports[idx],
    status,
    resolutionNotes: resolutionNotes || store.reports[idx].resolutionNotes,
  };

  return store.reports[idx];
}