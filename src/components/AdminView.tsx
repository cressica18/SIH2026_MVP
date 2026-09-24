import React, { useState } from 'react';
import {
  SafetyReport,
  GovScheme,
  Language,
} from '../types';
import { I18N_STRINGS } from '../data/i18n';
import {
  ShieldCheck,
  AlertTriangle,
  BarChart3,
  Building2,
  CheckCircle2,
  Clock,
  TrendingUp,
  Users,
  IndianRupee,
  FileText,
  Search,
  ChevronRight,
  Sparkles,
  Filter,
  Check,
  Lock,
  UserX,
  X,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from './ui/Card';
import { Button } from './ui/Button';
import { Badge, StatusBadge } from './ui/Badge';
import { Modal } from './ui/Modal';
import { Select } from './ui/Select';
import { Textarea } from './ui/Input';
import { EmptyState } from './ui/EmptyState';

interface AdminViewProps {
  reports: SafetyReport[];
  schemes: GovScheme[];
  currentLanguage: Language;
  onUpdateReportStatus: (reportId: string, status: 'open' | 'reviewing' | 'resolved', notes: string) => Promise<SafetyReport | null>;
  initialTab?: string;
}

export const AdminView: React.FC<AdminViewProps> = ({
  reports,
  schemes,
  currentLanguage,
  onUpdateReportStatus,
  initialTab = 'reports',
}) => {
  const [activeTab, setActiveTab] = useState<'reports' | 'metrics' | 'schemes'>(
    initialTab === 'metrics' ? 'metrics' : 'reports'
  );

  const [selectedReport, setSelectedReport] = useState<SafetyReport | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState<string>('');
  const [newStatus, setNewStatus] = useState<'open' | 'reviewing' | 'resolved'>('reviewing');
  const [isSaving, setIsSaving] = useState(false);

  const t = I18N_STRINGS[currentLanguage];

  const handleOpenReportModal = (rep: SafetyReport) => {
    setSelectedReport(rep);
    setNewStatus(rep.status);
    setResolutionNotes(rep.resolutionNotes || '');
  };

  const handleSaveResolution = async () => {
    if (!selectedReport) return;
    setIsSaving(true);
    try {
      const updated = await onUpdateReportStatus(selectedReport.id, newStatus, resolutionNotes);
      if (updated) {
        setSelectedReport(null);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const pendingReportsCount = reports.filter((r) => r.status !== 'resolved').length;

  return (
    <div className="space-y-6">
      
      {/* Admin Header Banner */}
      <Card variant="elevated" padding="lg" className="bg-gradient-to-br from-slate-900 via-stone-900 to-emerald-950 text-white border-none shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="success" size="sm" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40">
                <ShieldCheck className="w-3.5 h-3.5" />
                Platform Oversight & Whistleblower Desk
              </Badge>
              <Badge variant="neutral" size="sm" className="bg-white/10 text-stone-200 border-white/15">
                SIH 2026 Governance Console
              </Badge>
            </div>
            <CardTitle className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Vasundhara Administration & Safety Console
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-stone-200 max-w-2xl leading-relaxed font-semibold">
              Monitoring trade transparency, anonymous farmer protection against mandi cartels, and corridor logistics performance.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveTab('reports')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'reports'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'bg-white/10 text-stone-200 hover:bg-white/20'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-rose-300" />
              <span>Whistleblower Queue</span>
              {pendingReportsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500 text-white">
                  {pendingReportsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('metrics')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'metrics'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-white/10 text-stone-200 hover:bg-white/20'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-emerald-300" />
              <span>Impact KPIs</span>
            </button>

            <button
              onClick={() => setActiveTab('schemes')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'schemes'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-white/10 text-stone-200 hover:bg-white/20'
              }`}
            >
              <Building2 className="w-4 h-4 text-purple-300" />
              <span>Schemes Registry</span>
            </button>
          </div>
        </div>
      </Card>

      {/* TAB 1: WHISTLEBLOWER & SAFETY QUEUE */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <span>Whistleblower & Exploitation Moderation Queue</span>
              </CardTitle>
              <CardDescription className="text-stone-600 font-medium">
                Confidential reports submitted by farmers regarding mandi cartel price-fixing, broker extortion, or harassment.
              </CardDescription>
            </div>
            <span className="text-xs font-bold text-stone-800 bg-stone-100 px-3 py-1 rounded-full border border-stone-300 self-start sm:self-auto">
              Total Reports: {reports.length}
            </span>
          </div>

          {reports.length === 0 ? (
            <EmptyState variant="reports" />
          ) : (
            <div className="space-y-3.5">
              {reports.map((rep) => (
                <Card key={rep.id} variant="bordered" padding="md" className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-xs text-stone-900 bg-stone-100 px-2 py-0.5 rounded-md border border-stone-300">
                        {rep.id}
                      </span>
                      <Badge variant="danger" size="sm">{rep.category}</Badge>
                      {rep.isAnonymous ? (
                        <Badge variant="neutral" size="sm" className="bg-stone-900 text-amber-300 border-stone-800 flex items-center gap-1 font-extrabold">
                          <Lock className="w-3 h-3" />
                          100% Anonymous Submitter
                        </Badge>
                      ) : (
                        <span className="text-xs text-stone-700 font-semibold">
                          Reporter: {rep.reporterName}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <StatusBadge status={rep.status} />
                      <span className="text-xs text-stone-500 font-semibold">
                        {rep.createdAt}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs sm:text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-stone-600 font-semibold">Reported Entity:</span>
                      <span className="font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded border border-stone-300">
                        {rep.reportedEntityName}
                      </span>
                    </div>

                    <p className="text-stone-900 bg-stone-50 p-3.5 rounded-xl border border-stone-200 leading-relaxed font-sans text-xs sm:text-sm italic font-medium">
                      "{rep.description}"
                    </p>

                    {rep.resolutionNotes && (
                      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 space-y-1">
                        <span className="font-bold flex items-center gap-1.5 text-emerald-900">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Moderation Action Executed:
                        </span>
                        <p className="text-stone-800 leading-relaxed font-medium">{rep.resolutionNotes}</p>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleOpenReportModal(rep)}
                    >
                      <span>Triage & Update Resolution</span>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PLATFORM IMPACT KPIS */}
      {activeTab === 'metrics' && (
        <div className="space-y-5">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              <span>Platform Impact & Economic Realization KPIs</span>
            </CardTitle>
            <CardDescription className="text-stone-600 font-medium">
              Aggregated direct commerce, price realization premium, and freight efficiency across registered regional corridors.
            </CardDescription>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card variant="bordered" padding="md" className="space-y-2">
              <div className="flex items-center justify-between text-stone-600 text-xs font-bold">
                <span>Total Farmgate GMV</span>
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
                  <IndianRupee className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-stone-900 tracking-tight">
                ₹38.4 Lakhs
              </p>
              <p className="text-xs text-emerald-800 font-bold flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                Direct trade transacted
              </p>
            </Card>

            <Card variant="bordered" padding="md" className="space-y-2">
              <div className="flex items-center justify-between text-stone-600 text-xs font-bold">
                <span>Farmgate Price Premium</span>
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-emerald-800 tracking-tight">
                +22.4%
              </p>
              <p className="text-xs text-stone-600 font-medium">
                Above local arhat middlemen rates
              </p>
            </Card>

            <Card variant="bordered" padding="md" className="space-y-2">
              <div className="flex items-center justify-between text-stone-600 text-xs font-bold">
                <span>Verified Farmers</span>
                <div className="p-2 bg-sky-50 text-sky-700 rounded-xl border border-sky-200">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-stone-900 tracking-tight">
                1,248
              </p>
              <p className="text-xs text-stone-600 font-medium">
                Across 4 horticulture districts
              </p>
            </Card>

            <Card variant="bordered" padding="md" className="space-y-2">
              <div className="flex items-center justify-between text-stone-600 text-xs font-bold">
                <span>Freight Mileage Abated</span>
                <div className="p-2 bg-amber-50 text-amber-700 rounded-xl border border-amber-200">
                  <Building2 className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-amber-700 tracking-tight">
                34.1%
              </p>
              <p className="text-xs text-stone-600 font-medium">
                Via multi-order VRP pooling
              </p>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 3: GOVERNMENT SCHEMES REGISTRY */}
      {activeTab === 'schemes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-600" />
                <span>Central & State Government Schemes Registry</span>
              </CardTitle>
              <CardDescription className="text-stone-600 font-medium">
                Verified welfare schemes and subsidies matched to smallholder profiles.
              </CardDescription>
            </div>
            <span className="text-xs font-bold text-purple-900 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
              {schemes.length} Active Schemes
            </span>
          </div>

          {schemes.length === 0 ? (
            <EmptyState variant="schemes" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {schemes.map((sch) => (
                <Card key={sch.id} variant="bordered" padding="md" className="space-y-3 flex flex-col justify-between">
                  <div className="space-y-2 text-xs sm:text-sm">
                    <div className="flex items-center justify-between font-bold">
                      <Badge variant="info" size="sm">{sch.category}</Badge>
                      <span className="font-mono text-stone-500 text-xs font-bold">{sch.id}</span>
                    </div>
                    <CardTitle className="text-base">{sch.title}</CardTitle>
                    <p className="text-stone-700 leading-relaxed text-xs sm:text-sm font-medium">{sch.description}</p>
                    <div className="p-2.5 bg-emerald-50 rounded-xl text-xs text-emerald-950 font-bold border border-emerald-200">
                      Benefit: {sch.benefitAmount}
                    </div>
                  </div>

                  <CardFooter className="text-xs text-stone-600 font-semibold">
                    <span>Deadline: {sch.applicationDeadline}</span>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TRIAGE MODAL */}
      <Modal
        isOpen={!!selectedReport}
        onClose={() => setSelectedReport(null)}
        title={selectedReport ? `Triage Whistleblower Report #${selectedReport.id}` : ''}
        description={selectedReport ? `Target Entity: ${selectedReport.reportedEntityName}` : ''}
        size="md"
      >
        {selectedReport && (
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-1">
              <span className="font-bold text-stone-700 block text-xs">Report Description:</span>
              <p className="text-stone-900 italic text-xs font-medium">"{selectedReport.description}"</p>
            </div>

            <div>
              <label className="block font-bold text-stone-800 mb-1 text-xs">
                Workflow Moderation Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as any)}
                className="w-full px-3 py-2.5 font-bold bg-white border border-stone-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-stone-900"
              >
                <option value="open">Open (Under Investigation)</option>
                <option value="reviewing">Reviewing (Assigned to Vigilance)</option>
                <option value="resolved">Resolved (Action Enforced)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-stone-800 mb-1 text-xs">
                Resolution & Enforcement Action Notes
              </label>
              <Textarea
                rows={3}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="e.g. Complaint forwarded to District Marketing Officer; broker temporarily suspended from APMC gate."
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setSelectedReport(null)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                fullWidth
                loading={isSaving}
                onClick={handleSaveResolution}
              >
                Save Resolution
              </Button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};
