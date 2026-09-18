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
      title: 'Farmer Voice-First Listing & AI Quality/Price Bands',
      role: 'farmer',
      tabName: 'listings',
      icon: <Mic className="w-6 h-6 text-emerald-600" />,
      narrative:
        'Farmer taps the microphone and speaks naturally in their regional language (e.g., "do quintal tamatar, atharah rupaye kilo"). The platform transcribes speech, extracts structured harvest entities, computes an AI Price Band grounded in Agmarknet Mandi data, and runs a MobileNet CNN quality classifier on produce photos.',
      keyInnovations: [
        'Web Speech API STT with 5 regional languages (Hindi, Marathi, Telugu, Punjabi, English)',
        'Rule-based & AI slot-filling entity extractor for crop, weight, and expected price',
        'AI Price Band [Min – Fair – Max] benchmarked against APMC historical trends',
        'Produce CNN Quality Classifier (Grade A/B/C + confidence + firmness check)',
      ],
      actionLabel: 'Launch Farmer Voice Listing Screen',
    },
    {
      stepNumber: 2,
      title: 'Buyer Discovery & Anonymized Seller Protection',
      role: 'buyer',
      tabName: 'marketplace',
      icon: <ShieldCheck className="w-6 h-6 text-blue-600" />,
      narrative:
        'A food processor or retail buyer explores active harvest lots. The seller is masked with an anonymous ID (e.g. FARM-88214) to prevent cartel intimidation and local price collusion. An explainable multi-factor AI matching engine highlights "Recommended for You" listings.',
      keyInnovations: [
        'Anonymous Seller Protection: Real names, villages, and phone numbers are completely hidden',
        'Multi-factor AI Matching Score based on price fit, quality grade, distance, and trust',
        'Visual badges for Grade A quality, APMC comparison, and seller reputation rating',
      ],
      actionLabel: 'Browse Buyer Marketplace & Matches',
    },
    {
      stepNumber: 3,
      title: 'Order Placement & Identity Reveal on Commit',
      role: 'buyer',
      tabName: 'orders',
      icon: <FileCheck className="w-6 h-6 text-indigo-600" />,
      narrative:
        'Buyer commits to procurement by placing an order. The transaction enters a strict state machine (pending → matched → confirmed). The Identity Reveal mechanism unlocks exactly when both parties confirm, releasing contact and location details for seamless delivery logistics.',
      keyInnovations: [
        'State machine integrity: pending → confirmed → in_transit → delivered → settled',
        'Cryptographic Identity Reveal: Contact details only unlock on mutual commitment',
        'Eliminates pre-deal poaching and prevents middlemen from intercepting the trade',
      ],
      actionLabel: 'Inspect Order Tracker & Identity Reveal',
    },
    {
      stepNumber: 4,
      title: 'Logistics Pooling & Route Optimization',
      role: 'logistics',
      tabName: 'pools',
      icon: <Truck className="w-6 h-6 text-amber-600" />,
      narrative:
        'Confirmed orders within the same geographic district (e.g. Nashik-Pimpalgaon to Pune corridor) automatically cluster into a shared vehicle pool. Capacitated VRP sequencing schedules multi-stop pickups, saving 34% in freight fuel and reducing transit spoilage.',
      keyInnovations: [
        'DBSCAN geo-clustering for same-day harvest pickups within freight radius',
        'OR-Tools Capacitated Vehicle Routing Problem (VRP) sequencing farmgate stops',
        'Vehicle capacity utilization tracking with real-time fuel and carbon reduction metrics',
      ],
      actionLabel: 'View Clustered Logistics Route Map',
    },
    {
      stepNumber: 5,
      title: 'Settlement & AEPS Biometric Cash-Out Counter',
      role: 'farmer',
      tabName: 'finance',
      icon: <IndianRupee className="w-6 h-6 text-teal-600" />,
      narrative:
        'Upon delivery completion, the transaction settles and seller reputation updates. The farmer accesses the Finance tab to view their AI Harvest Risk Score and instant working-capital advance eligibility, then simulates cash-out at a local Bank Correspondent (BC) counter via Aadhaar biometric authentication.',
      keyInnovations: [
        'AI Harvest Risk Model evaluating yield history, price volatility, and fulfillment',
        'Instant pre-harvest & post-harvest cash advance eligibility calculation',
        'Simulated AEPS Banking Correspondent biometric interface with mock NPCI transaction receipt',
      ],
      actionLabel: 'Open Finance & AEPS Simulator',
    },
    {
      stepNumber: 6,
      title: 'Government Scheme Matching & Mandi Market Insights',
      role: 'farmer',
      tabName: 'schemes',
      icon: <BookOpen className="w-6 h-6 text-purple-600" />,
      narrative:
        'Farmers receive rule-matched Central and State government schemes (PM-KISAN, PMFBY insurance, Agri Infrastructure Fund) filtered by their acreage and crop. Both farmers and buyers also access an interactive Mandi Insights dashboard with 7-week price trends and an AI natural-language forecast.',
      keyInnovations: [
        'Automated scheme eligibility engine matching land size, state, and crop portfolio',
        'Direct links and application window deadlines for verified agricultural subsidies',
        'Interactive SVG price trend charts with AI-generated market supply summaries',
      ],
      actionLabel: 'Explore Schemes & Mandi Trends',
    },
    {
      stepNumber: 7,
      title: 'Women-Centric Privacy & Anonymous Whistleblowing',
      role: 'admin',
      tabName: 'reports',
      icon: <ShieldCheck className="w-6 h-6 text-rose-600" />,
      narrative:
        'A dedicated safe-space whistleblower portal allows vulnerable, smallholder, and women farmers to report mandi cartel price collusion, harassment, or transporter extortion with zero personally identifying data stored. The Admin Moderation queue triages and resolves issues.',
      keyInnovations: [
        '100% Anonymous whistleblowing: IP address, phone number, and name are never stored',
        'Protection against local middleman retribution and price fixing',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-800 to-teal-900 text-white">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            <div>
              <h3 className="text-base sm:text-lg font-bold">
                SIH 2026 Judge Demonstration Guide
              </h3>
              <p className="text-xs text-emerald-200">
                End-to-End Story: 7 Phases of Vasundhara
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-emerald-200 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Indicators */}
        <div className="px-6 py-3 bg-stone-50 border-b border-stone-200 flex items-center justify-between gap-1 overflow-x-auto">
          {steps.map((s, idx) => (
            <button
              key={s.stepNumber}
              onClick={() => setCurrentStepIndex(idx)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                idx === currentStepIndex
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : idx < currentStepIndex
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-stone-200/70 text-stone-600 hover:bg-stone-300/70'
              }`}
            >
              <span>{s.stepNumber}</span>
              <span className="hidden sm:inline">
                {idx < currentStepIndex && <CheckCircle2 className="w-3 h-3 inline ml-0.5" />}
              </span>
            </button>
          ))}
        </div>

        {/* Step Body Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          
          <div className="flex items-start gap-3">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl shrink-0">
              {currentStep.icon}
            </div>
            <div>
              <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md mb-1 border border-emerald-200">
                Step {currentStep.stepNumber} of 7 • Role: {currentStep.role.toUpperCase()}
              </span>
              <h4 className="text-lg font-bold text-stone-900 leading-snug">
                {currentStep.title}
              </h4>
            </div>
          </div>

          <p className="text-sm text-stone-700 leading-relaxed bg-stone-50/80 p-3.5 rounded-xl border border-stone-200/60">
            {currentStep.narrative}
          </p>

          <div className="space-y-2">
            <h5 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
              Technical & Architectural Highlights:
            </h5>
            <ul className="space-y-1.5 text-xs text-stone-700">
              {currentStep.keyInnovations.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              disabled={currentStepIndex === 0}
              onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
              className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-stone-700 bg-white border border-stone-300 rounded-xl hover:bg-stone-100 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <button
              disabled={currentStepIndex === steps.length - 1}
              onClick={() => setCurrentStepIndex((prev) => Math.min(steps.length - 1, prev + 1))}
              className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-stone-700 bg-white border border-stone-300 rounded-xl hover:bg-stone-100 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleAction}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-emerald-700/20 transition-all cursor-pointer active:scale-95"
          >
            <span>{currentStep.actionLabel}</span>
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
