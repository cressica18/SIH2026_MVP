import React, { useState } from 'react';
import { Role } from '../types';
import {
  Sparkles,
  Mic,
  ShieldCheck,
  Truck,
  IndianRupee,
  BookOpen,
  FileCheck,
  ChevronRight,
  ChevronLeft,
  X,
  ExternalLink,
  CheckCircle2,
  Zap,
  Target,
  Gauge,
  BarChart3,
  Building2,
} from 'lucide-react';

interface DemoWalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJumpToStep: (role: Role, tabName?: string) => void;
}

interface DemoStep {
  stepNumber: number;
  title: string;
  role: Role;
  tabName?: string;
  icon: React.ReactNode;
  narrative: string;
  keyInnovations: string[];
  actionLabel: string;
}

export const DemoWalkthroughModal: React.FC<DemoWalkthroughModalProps> = ({
  isOpen,
  onClose,
  onJumpToStep,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  if (!isOpen) return null;

const steps: DemoStep[] = [
    {
      stepNumber: 1,
      title: 'Kabadiwala Voice-First Scrap Lot & AI Quality/Price Bands',
      role: 'collector',
      tabName: 'lots',
      icon: <Mic className="w-6 h-6 text-copper-400" />,
      narrative:
        'Collector taps the microphone and speaks naturally in their regional language (e.g., "500 kg copper wire, 620 rupees per kg"). The platform transcribes speech, extracts structured scrap entities (material, weight, category), computes an AI Price Band grounded in Scrap Market data, and runs an AI Vision Quality classifier on scrap photos.',
      keyInnovations: [
        'Web Speech API STT with 5 regional languages (Hindi, Marathi, Telugu, Punjabi, English)',
        'Rule-based & AI slot-filling entity extractor for material, weight, category, and expected price',
        'AI Price Band [Min – Fair – Max] benchmarked against Scrap Market historical trends',
        'AI Vision Quality Classifier (Grade A/B/C + confidence + purity/consistency check)',
      ],
      actionLabel: 'Launch Collector Voice Lot Screen',
    },
    {
      stepNumber: 2,
      title: 'Recycler Discovery & Anonymous Collector Protection',
      role: 'recycler',
      tabName: 'pools',
      icon: <ShieldCheck className="w-6 h-6 text-emerald-400" />,
      narrative:
        'An authorized recycler explores active scrap lots. The collector is masked with an anonymous ID (e.g. KABAD-55219) to prevent price collusion and middleman exploitation. An explainable multi-factor AI matching engine highlights "Recommended for You" pools.',
      keyInnovations: [
        'Anonymous Collector Protection: Real names, areas, and phone numbers are completely hidden',
        'Multi-factor AI Matching Score based on material fit, quality grade, distance, and trust',
        'Visual badges for Grade A purity, price benchmark, and collector reputation rating',
      ],
      actionLabel: 'Browse Recycler Marketplace & Smart Pools',
    },
    {
      stepNumber: 3,
      title: 'Smart Pool Formation & Verified Bidding',
      role: 'collector',
      tabName: 'pools',
      icon: <FileCheck className="w-6 h-6 text-copper-400" />,
      narrative:
        'Collector joins compatible lots into a Smart Pool or creates a new one. The pool is verified, opened for bidding, and authorized recyclers place competitive offers. The collector can accept the best offer or hold for better terms.',
      keyInnovations: [
        'Smart Pool integrity: compatible lots by material, location, and pickup window',
        'Verified Bidding: Only authorized recyclers can bid on verified pools',
        'Eliminates pre-deal poaching and prevents middlemen from intercepting the trade',
      ],
      actionLabel: 'Inspect Smart Pool & Offers',
    },
    {
      stepNumber: 4,
      title: 'Settlement & QR/Reference Handover',
      role: 'recycler',
      tabName: 'settlements',
      icon: <Truck className="w-6 h-6 text-harvest-400" />,
      narrative:
        'Confirmed scrap orders within the same geographic district automatically cluster into a shared vehicle pool. Capacitated VRP sequencing schedules multi-stop pickups, saving freight fuel and streamlining transport.',
      keyInnovations: [
        'DBSCAN geo-clustering for same-day scrap pickups within transport radius',
        'Capacitated Vehicle Routing Problem (VRP) sequencing collector pickup stops',
        'Vehicle capacity utilization tracking with real-time fuel and carbon reduction metrics',
      ],
      actionLabel: 'View Clustered Logistics Route Map',
    },
    {
      stepNumber: 5,
      title: 'Settlement & AEPS Biometric Cash-Out Counter',
      role: 'collector',
      tabName: 'finance',
      icon: <IndianRupee className="w-6 h-6 text-teal-400" />,
      narrative:
        'Upon delivery completion, the transaction settles and seller reputation updates. The collector accesses working capital advances and simulates cash-out at a local Bank Correspondent (BC) counter via Aadhaar biometric authentication.',
      keyInnovations: [
        'AI Risk Model evaluating scrap lot history, price volatility, and fulfillment',
        'Instant working-capital advance eligibility calculation',
        'Simulated AEPS Banking Correspondent biometric interface with mock NPCI transaction receipt',
      ],
      actionLabel: 'Open Finance & AEPS Simulator',
    },
    {
      stepNumber: 6,
      title: 'Scrap Market Insights & Price Reference',
      role: 'collector',
      tabName: 'insights',
      icon: <BookOpen className="w-6 h-6 text-sage-400" />,
      narrative:
        'Collectors and recyclers access an interactive Scrap Market Insights dashboard with 7-week price trends, trimmed median evidence-based reference rates, and an AI natural-language forecast.',
      keyInnovations: [
        'Evidence-based floor/reference pricing using trimmed medians of local completed transactions',
        'Source, timestamp, and confidence metrics display without faking live real-time feeds',
        'Interactive SVG price trend charts with AI-generated market supply summaries',
      ],
      actionLabel: 'Explore Scrap Market Trends',
    },
    {
      stepNumber: 7,
      title: 'Whistleblower Safety & Anti-Cartel Moderation',
      role: 'admin',
      tabName: 'reports',
      icon: <ShieldCheck className="w-6 h-6 text-copper-400" />,
      narrative:
        'A dedicated safe-space whistleblower portal allows informal collectors to report scrap cartel price collusion, harassment, or broker extortion with zero personally identifying data stored. The Admin Moderation queue triages and resolves issues.',
      keyInnovations: [
        '100% Anonymous whistleblowing: IP address, phone number, and name are never stored',
        'Protection against local scrap yard middleman retribution and price fixing',
        'Admin moderation queue with triage status (open → reviewing → resolved) and resolution tracking',
      ],
      actionLabel: 'View Admin Moderation Queue',
    },
  ];

  const currentStep = steps[currentStepIndex];

  const handleAction = () => {
    onJumpToStep(currentStep.role, currentStep.tabName);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-bg-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-bg-850 rounded-3xl shadow-2xl border border-bg-700 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-forest-900/50 border-b border-forest-700 text-cream-50">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-harvest-400 animate-pulse" />
            <div>
              <h3 className="text-base sm:text-lg font-black text-cream-50">
                SIH 2026 Judge Demonstration Guide
              </h3>
              <p className="text-xs text-forest-300 font-semibold">
                End-to-End Story: 7 Phases of Kabadiwala Connect
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-cream-400 hover:text-cream-50 hover:bg-bg-800 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Indicators */}
        <div className="px-6 py-3 bg-bg-750 border-b border-bg-700 flex items-center justify-between gap-1 overflow-x-auto">
          {steps.map((s, idx) => (
            <button
              key={s.stepNumber}
              onClick={() => setCurrentStepIndex(idx)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                idx === currentStepIndex
                  ? 'bg-forest-600 text-bg-950 shadow-xs'
                  : idx < currentStepIndex
                  ? 'bg-forest-900/30 text-forest-100 border border-forest-700'
                  : 'bg-bg-800 text-cream-400 hover:bg-bg-750 hover:text-cream-50 border border-bg-700'
              }`}
            >
              <span>{s.stepNumber}</span>
              <span className="hidden sm:inline">
                {idx < currentStepIndex && <CheckCircle2 className="w-3 h-3 inline ml-0.5 text-forest-400" />}
              </span>
            </button>
          ))}
        </div>

        {/* Step Body Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          
          <div className="flex items-start gap-3">
            <div className="p-3 bg-forest-900/30 border border-forest-700 rounded-2xl shrink-0">
              {currentStep.icon}
            </div>
            <div>
              <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-forest-300 bg-forest-900/30 px-2 py-0.5 rounded-md mb-1 border border-forest-700">
                Step {currentStep.stepNumber} of 7 • Role: {currentStep.role.toUpperCase()}
              </span>
              <h4 className="text-lg font-bold text-cream-50 leading-snug">
                {currentStep.title}
              </h4>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-cream-300 leading-relaxed bg-bg-750 p-3.5 rounded-xl border border-bg-700 font-medium">
            {currentStep.narrative}
          </p>

          <div className="space-y-2">
            <h5 className="text-xs font-bold text-cream-50 uppercase tracking-wider">
              Technical & Architectural Highlights:
            </h5>
            <ul className="space-y-1.5 text-xs text-cream-300 font-medium">
              {currentStep.keyInnovations.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-forest-400 mt-1.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 bg-bg-750 border-t border-bg-700 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              disabled={currentStepIndex === 0}
              onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
              className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-cream-300 bg-bg-800 border border-bg-700 rounded-xl hover:bg-bg-750 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <button
              disabled={currentStepIndex === steps.length - 1}
              onClick={() => setCurrentStepIndex((prev) => Math.min(steps.length - 1, prev + 1))}
              className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-cream-300 bg-bg-800 border border-bg-700 rounded-xl hover:bg-bg-750 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleAction}
            className="flex items-center gap-2 px-4 py-2 bg-forest-600 hover:bg-forest-500 text-bg-950 text-xs sm:text-sm font-black rounded-xl shadow-md shadow-forest-700/30 transition-all cursor-pointer active:scale-95"
          >
            <span>{currentStep.actionLabel}</span>
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};