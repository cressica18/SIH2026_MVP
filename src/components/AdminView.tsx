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
  CheckCircle2,
  Clock,
  TrendingUp,
  Users,
  IndianRupee,
  Building2,
  FileText,
  Search,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface AdminViewProps {
  reports: SafetyReport[];
  schemes: GovScheme[];
  currentLanguage: Language;
  onUpdateReportStatus: (reportId: string, status: 'open' | 'reviewing' | 'resolved', notes: string) => void;
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

  const t = I18N_STRINGS[currentLanguage];

  const handleOpenReportModal = (rep: SafetyReport) => {
    setSelectedReport(rep);
    setNewStatus(rep.status);
    setResolutionNotes(rep.resolutionNotes || '');
  };

  const handleSaveResolution = () => {
    if (!selectedReport) return;
    onUpdateReportStatus(selectedReport.id, newStatus, resolutionNotes);
    setSelectedReport(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Admin Header Banner */}
      <div className="bg-gradient-to-br from-stone-900 via-slate-900 to-emerald-950 text-white rounded-3xl p-5 sm:p-7 shadow-lg shadow-stone-950/20">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Platform Oversight & Farmer Whistleblower Desk
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Vasundhara Administration & Safety Console
            </h2>
            <p className="text-xs sm:text-sm text-stone-300">
              Monitoring transparency, anonymous farmer protection, and market fairness across corridors.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'reports'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'bg-white/10 text-stone-200 hover:bg-white/20'
              }`}
            >
              🚨 Whistleblower Queue ({reports.filter((r) => r.status !== 'resolved').length})
            </button>
            <button
              onClick={() => setActiveTab('metrics')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'metrics'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-white/10 text-stone-200 hover:bg-white/20'
              }`}
            >
              📊 Platform Impact KPIs
            </button>
            <button
              onClick={() => setActiveTab('schemes')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'schemes'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-white/10 text-stone-200 hover:bg-white/20'
              }`}
            >
              🏛️ Schemes Registry
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: WHISTLEBLOWER & SAFETY QUEUE */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-stone-900">
                Anonymous Whistleblower & Exploitation Moderation Queue
              </h3>
              <p className="text-xs text-stone-500">
                Reports submitted by smallholder & women farmers regarding mandi cartel price fixing, broker exploitation, or harassment.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {reports.map((rep) => (
              <div
                key={rep.id}
                className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-xs text-stone-900 bg-stone-100 px-2 py-0.5 rounded-md">
                      {rep.id}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                      {rep.category}
                    </span>
                    {rep.isAnonymous ? (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-stone-900 text-amber-300 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        100% Anonymous Submitter
                      </span>
                    ) : (
                      <span className="text-xs text-stone-600">
                        Submitted by: {rep.reporterName}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                        rep.status === 'resolved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : rep.status === 'reviewing'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {rep.status}
                    </span>
                    <span className="text-xs text-stone-400">
                      {rep.createdAt}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <p className="text-stone-500 font-medium">
                    Entity / Party Reported:{' '}
                    <span className="font-bold text-stone-900">
                      {rep.reportedEntityName}
                    </span>
                  </p>
                  <p className="text-stone-800 bg-stone-50 p-3 rounded-xl border border-stone-200/60 leading-relaxed">
                    "{rep.description}"
                  </p>

                  {rep.resolutionNotes && (
                    <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900">
                      <span className="font-bold">Moderation Action Taken: </span>
                      <span>{rep.resolutionNotes}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => handleOpenReportModal(rep)}
                    className="px-3 py-1.5 bg-stone-800 hover:bg-stone-900 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Triage & Update Resolution
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: PLATFORM IMPACT KPIS */}
      {activeTab === 'metrics' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-white rounded-2xl border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between text-stone-500 text-xs font-semibold">
                <span>Total Farmgate GMV</span>
                <IndianRupee className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-stone-900 mt-2">
                ₹38.4 Lakhs
              </p>
              <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                Direct trade transacted
              </p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between text-stone-500 text-xs font-semibold">
                <span>Farmgate Price Realization</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-emerald-700 mt-2">
                +22.4%
              </p>
              <p className="text-[11px] text-stone-500 font-semibold mt-1">
                Above local arhat middlemen rates
              </p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between text-stone-500 text-xs font-semibold">
                <span>Verified Farmers</span>
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-black text-stone-900 mt-2">
                1,248
              </p>
              <p className="text-[11px] text-stone-500 font-semibold mt-1">
                Across 4 horticulture districts
              </p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between text-stone-500 text-xs font-semibold">
                <span>Logistics Mileage Saved</span>
                <Building2 className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-2xl font-black text-amber-700 mt-2">
                34.1%
              </p>
              <p className="text-[11px] text-stone-500 font-semibold mt-1">
                Via multi-order VRP pooling
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GOVERNMENT SCHEMES REGISTRY */}
      {activeTab === 'schemes' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {schemes.map((sch) => (
              <div
                key={sch.id}
                className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-2 text-xs"
              >
                <div className="flex justify-between font-bold">
                  <span className="text-purple-800 bg-purple-50 px-2 py-0.5 rounded-md">
                    {sch.category}
                  </span>
                  <span className="font-mono text-stone-400">{sch.id}</span>
                </div>
                <h4 className="font-bold text-sm text-stone-900">{sch.title}</h4>
                <p className="text-stone-600">{sch.description}</p>
                <div className="p-2 bg-stone-50 rounded-lg text-emerald-900 font-semibold">
                  Benefit: {sch.benefitAmount}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TRIAGE MODAL */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 p-6 space-y-4 text-xs">
            <h3 className="font-bold text-base text-stone-900">
              Triage Whistleblower Report {selectedReport.id}
            </h3>
            <p className="text-stone-600">
              Target Entity: <span className="font-bold">{selectedReport.reportedEntityName}</span>
            </p>

            <div>
              <label className="block font-bold text-stone-700 mb-1">
                Workflow Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as any)}
                className="w-full px-3 py-2 font-semibold bg-stone-50 border border-stone-300 rounded-xl"
              >
                <option value="open">Open (Under Review)</option>
                <option value="reviewing">Reviewing (Assigned to Vigilance)</option>
                <option value="resolved">Resolved (Action Taken)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">
                Resolution & Enforcement Notes
              </label>
              <textarea
                rows={3}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="e.g. Forwarded complaint to District Marketing Officer; broker barred from carrier dispatch."
                className="w-full px-3 py-2 border border-stone-300 rounded-xl"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setSelectedReport(null)}
                className="flex-1 py-2 font-semibold text-stone-600 bg-stone-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveResolution}
                className="flex-1 py-2 font-bold text-white bg-stone-900 rounded-xl cursor-pointer shadow-xs"
              >
                Save Resolution
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
