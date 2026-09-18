import React, { useState, useEffect } from 'react';
import {
  FarmerProfile,
  Listing,
  Order,
  GovScheme,
  RiskAssessment,
  Language,
  QualityAssessment,
  PriceBand,
} from '../types';
import { I18N_STRINGS } from '../data/i18n';
import {
  extractVoiceListing,
  getAiPriceRecommendation,
  assessProduceQuality,
} from '../lib/api-client';
import {
  Mic,
  MicOff,
  Sparkles,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Truck,
  IndianRupee,
  BookOpen,
  Camera,
  AlertTriangle,
  Send,
  Eye,
  Phone,
  MapPin,
  X,
  ExternalLink,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

interface FarmerViewProps {
  farmer: FarmerProfile;
  listings: Listing[];
  orders: Order[];
  schemes: GovScheme[];
  riskAssessment: RiskAssessment;
  currentLanguage: Language;
  onAddListing: (listing: Listing) => void;
  onOpenAepsModal: (amount: number) => void;
  onSubmitSafetyReport: (report: {
    category: any;
    description: string;
    isAnonymous: boolean;
    reportedEntityName: string;
  }) => void;
  initialTab?: string;
}

export const FarmerView: React.FC<FarmerViewProps> = ({
  farmer,
  listings,
  orders,
  schemes,
  riskAssessment,
  currentLanguage,
  onAddListing,
  onOpenAepsModal,
  onSubmitSafetyReport,
  initialTab = 'listings',
}) => {
  const [activeTab, setActiveTab] = useState<'listings' | 'orders' | 'schemes' | 'finance' | 'safety'>(
    (initialTab as any) || 'listings'
  );

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab as any);
    }
  }, [initialTab]);

  const t = I18N_STRINGS[currentLanguage];

  // Voice Listing Creation Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState('');
  const [cropInput, setCropInput] = useState('Tomato');
  const [varietyInput, setVarietyInput] = useState('Abhinav Hybrid');
  const [quantityInput, setQuantityInput] = useState<number>(2000);
  const [priceInput, setPriceInput] = useState<number>(18);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [aiPriceBand, setAiPriceBand] = useState<PriceBand | null>(null);
  const [qualityGrade, setQualityGrade] = useState<QualityAssessment | null>(null);
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string>(
    'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80'
  );

  // Safety Report Form State
  const [safetyCategory, setSafetyCategory] = useState<string>('Underpricing & Cartel');
  const [safetyEntity, setSafetyEntity] = useState<string>('');
  const [safetyDescription, setSafetyDescription] = useState<string>('');
  const [safetyAnonymous, setSafetyAnonymous] = useState<boolean>(true);
  const [safetySubmitted, setSafetySubmitted] = useState<boolean>(false);

  // Recalculate AI price band whenever crop or quantity changes
  useEffect(() => {
    const band = getAiPriceRecommendation(cropInput, farmer.district);
    setAiPriceBand(band);
  }, [cropInput, farmer.district]);

  // Initial quality scan simulation
  useEffect(() => {
    assessProduceQuality(selectedPhotoUrl, cropInput).then(setQualityGrade);
  }, [selectedPhotoUrl, cropInput]);

  // Web Speech API Voice Capture Handler
  const handleToggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Fallback simulated speech
      setIsRecording(true);
      setTimeout(async () => {
        const simulatedSpoken =
          currentLanguage === 'hi'
            ? 'दो क्विंटल टमाटर, अठारह रुपये किलो'
            : currentLanguage === 'mr'
            ? 'दोन क्विंटल टोमॅटो, वीस रुपये किलो'
            : currentLanguage === 'pa'
            ? 'ਪੰਜਾਹ ਕੁਇੰਟਲ ਆਲੂ, ਚੌਦਾਂ ਰੁਪਏ ਕਿਲੋ'
            : currentLanguage === 'te'
            ? 'రెండు క్వింటాళ్ల టమోటా, కిలో పద్దెనిమిది రూపాయలు'
            : '2 quintal tomato, expecting 18 rupees per kg';

        setSpeechTranscript(simulatedSpoken);
        setIsRecording(false);
        setIsProcessingAI(true);
        const result = await extractVoiceListing(simulatedSpoken, currentLanguage);
        setCropInput(result.crop);
        setVarietyInput(result.variety);
        setQuantityInput(result.quantityKg);
        setPriceInput(result.priceExpected);
        setIsProcessingAI(false);
      }, 1500);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      const langMap: Record<Language, string> = {
        en: 'en-IN',
        hi: 'hi-IN',
        mr: 'mr-IN',
        te: 'te-IN',
        pa: 'pa-IN',
      };
      recognition.lang = langMap[currentLanguage] || 'en-IN';

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSpeechTranscript(transcript);
        setIsRecording(false);
        setIsProcessingAI(true);

        const result = await extractVoiceListing(transcript, currentLanguage);
        setCropInput(result.crop);
        setVarietyInput(result.variety);
        setQuantityInput(result.quantityKg);
        setPriceInput(result.priceExpected);
        setIsProcessingAI(false);
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } catch {
      setIsRecording(false);
    }
  };

  const handlePublishListing = () => {
    const newListing: Listing = {
      id: `list_${Date.now()}`,
      anonSellerId: farmer.anonSellerId,
      farmerRealName: farmer.name,
      farmerPhone: farmer.phone,
      crop: cropInput,
      variety: varietyInput,
      quantityKg: Number(quantityInput),
      priceExpected: Number(priceInput),
      priceAi: aiPriceBand || {
        min: priceInput * 0.9,
        fair: priceInput,
        max: priceInput * 1.15,
        confidence: 92,
        historicalMandiAvg: priceInput,
        trend: 'rising',
        benchmarkMandi: `${farmer.district} APMC`,
      },
      quality: qualityGrade || {
        grade: 'A',
        confidence: 94,
        colorUniformity: 92,
        surfaceDefects: 4,
        firmnessScore: 89,
        freshnessLabel: 'Grade A Farmgate Batch',
        notes: 'Harvest verified by AI image scan.',
      },
      imageUrl: selectedPhotoUrl,
      village: farmer.village,
      district: farmer.district,
      state: farmer.state,
      lat: farmer.lat,
      lng: farmer.lng,
      status: 'active',
      createdVia: speechTranscript ? 'voice' : 'text',
      createdAt: 'Just now',
      farmerReputation: farmer.reputationScore,
      distanceKm: 28,
      matchScore: 96,
    };

    onAddListing(newListing);
    setShowCreateModal(false);
    setSpeechTranscript('');
    setActiveTab('listings');
  };

  const handleSafetySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!safetyDescription.trim()) return;

    onSubmitSafetyReport({
      category: safetyCategory as any,
      description: safetyDescription,
      isAnonymous: safetyAnonymous,
      reportedEntityName: safetyEntity || 'Local Mandi Intermediary',
    });

    setSafetySubmitted(true);
    setTimeout(() => {
      setSafetySubmitted(false);
      setSafetyDescription('');
      setSafetyEntity('');
    }, 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* Farmer Profile Identity Card */}
      <div className="bg-gradient-to-br from-emerald-800 to-teal-950 text-white rounded-3xl p-5 sm:p-7 shadow-lg shadow-emerald-950/20">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-700/60 text-emerald-200 border border-emerald-500/40">
                Verified Farmer
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Anon ID: {farmer.anonSellerId}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              {farmer.name}
            </h2>
            <p className="text-xs sm:text-sm text-emerald-200 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              {farmer.village}, {farmer.district}, {farmer.state} • {farmer.landSizeAcres} Acres Farm
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 text-center">
              <p className="text-[11px] text-emerald-200 font-medium">
                Trust Reputation
              </p>
              <p className="text-base font-black text-amber-300">
                ★ {farmer.reputationScore} / 5.0
              </p>
              <p className="text-[10px] text-emerald-300">
                {farmer.totalOrdersFulfilled} fulfilled
              </p>
            </div>

            <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 text-center">
              <p className="text-[11px] text-emerald-200 font-medium">
                AI Eligible Advance
              </p>
              <p className="text-base font-black text-white">
                ₹{riskAssessment.eligibleAdvanceAmount.toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-emerald-300">
                {riskAssessment.riskTier}
              </p>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black text-xs sm:text-sm rounded-2xl shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Mic className="w-4 h-4" />
              <span>Voice / Add Listing</span>
            </button>
          </div>

        </div>
      </div>

      {/* Main Feature Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-stone-200 no-scrollbar">
        <button
          onClick={() => setActiveTab('listings')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'listings'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <span>🌾 {t.farmer.myListings}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-700/40 text-emerald-100">
            {listings.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'orders'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <span>📦 {t.nav.orders}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-700/40 text-emerald-100">
            {orders.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('schemes')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'schemes'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <span>🏛️ {t.nav.schemes}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-700/40 text-emerald-100">
            {schemes.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('finance')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'finance'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <span>💰 {t.nav.finance}</span>
        </button>

        <button
          onClick={() => setActiveTab('safety')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'safety'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-rose-700 hover:bg-rose-50'
          }`}
        >
          <span>🛡️ {t.farmer.reportConcern}</span>
        </button>
      </div>

      {/* TAB 1: MY HARVEST LISTINGS */}
      {activeTab === 'listings' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-bold text-stone-900">
              Active Farmgate Batches
            </h3>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Listing</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow"
              >
                <div className="relative h-44 bg-stone-100 overflow-hidden">
                  <img
                    src={item.imageUrl}
                    alt={item.crop}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-white/90 text-stone-900 shadow-xs">
                      Grade {item.quality.grade}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-stone-900/80 text-amber-300">
                      {item.anonSellerId}
                    </span>
                  </div>
                  <div className="absolute top-2.5 right-2.5">
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-600 text-white uppercase tracking-wider">
                      {item.status}
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-1">
                    <div>
                      <h4 className="font-bold text-base text-stone-900">
                        {item.crop}
                      </h4>
                      <p className="text-xs text-stone-500">
                        {item.variety}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-stone-400 font-medium">
                        Expected Price
                      </p>
                      <p className="text-base font-extrabold text-emerald-700">
                        ₹{item.priceExpected}/kg
                      </p>
                    </div>
                  </div>

                  <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-100 text-xs space-y-1">
                    <div className="flex items-center justify-between text-stone-600">
                      <span>Available Batch:</span>
                      <span className="font-bold text-stone-900">{item.quantityKg} kg ({item.quantityKg / 100} Qtl)</span>
                    </div>
                    <div className="flex items-center justify-between text-stone-600">
                      <span>AI Price Range:</span>
                      <span className="font-bold text-emerald-700">₹{item.priceAi.min} – ₹{item.priceAi.max}/kg</span>
                    </div>
                    <div className="flex items-center justify-between text-stone-600">
                      <span>CNN Quality Score:</span>
                      <span className="font-bold text-stone-900">{item.quality.confidence}% Confidence</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-stone-400 flex items-center justify-between pt-1">
                    <span>Added {item.createdAt}</span>
                    <span className="text-emerald-700 font-semibold">
                      {item.createdVia === 'voice' ? '🎙️ Voice listed' : '⌨️ Text listed'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: ORDERS & SETTLEMENT */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-bold text-stone-900">
              Orders & Transaction Lifecycle
            </h3>
            <span className="text-xs text-stone-500">
              Identity reveals automatically upon confirmation
            </span>
          </div>

          <div className="space-y-3">
            {orders.map((ord) => (
              <div
                key={ord.id}
                className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-stone-900">
                      Order #{ord.id}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                      {ord.status.replace('_', ' ')}
                    </span>
                    {ord.identityRevealed && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        Identity Revealed
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-stone-400">
                    Created: {ord.createdAt}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-stone-400 block">Harvest Item:</span>
                    <span className="font-bold text-stone-900 text-sm">
                      {ord.crop} ({ord.variety})
                    </span>
                    <span className="text-stone-500 block">
                      {ord.quantityKg} kg @ ₹{ord.agreedPricePerKg}/kg
                    </span>
                  </div>

                  <div>
                    <span className="text-stone-400 block">Total Settlement:</span>
                    <span className="font-extrabold text-emerald-700 text-base">
                      ₹{ord.totalAmount.toLocaleString('en-IN')}
                    </span>
                    <span className="text-stone-500 block">
                      Direct Bank Transfer / AEPS
                    </span>
                  </div>

                  <div>
                    <span className="text-stone-400 block">Buyer / Procurement:</span>
                    <span className="font-bold text-stone-900">
                      {ord.buyerName}
                    </span>
                    <span className="text-stone-500 block">
                      {ord.buyerType}
                    </span>
                    {ord.identityRevealed && (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" />
                        {ord.buyerPhone}
                      </span>
                    )}
                  </div>
                </div>

                {/* Identity Reveal Alert Box */}
                {ord.identityRevealed && (
                  <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-blue-700" />
                      Trade Confirmed: Mutual Identity Unlocked
                    </p>
                    <p className="text-blue-800">
                      Buyer delivery address: <span className="font-semibold">{ord.deliveryAddress}</span>. Logistics carrier is assigned to handle farmgate dispatch.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: GOVERNMENT SCHEMES */}
      {activeTab === 'schemes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-stone-900">
                Government Schemes Matched to Your Profile
              </h3>
              <p className="text-xs text-stone-500">
                Filtered for: {farmer.state} • {farmer.landSizeAcres} Acres • {farmer.primaryCrops.join(', ')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {schemes.map((sch) => (
              <div
                key={sch.id}
                className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                      {sch.category}
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      Eligible
                    </span>
                  </div>
                  <h4 className="font-bold text-base text-stone-900">
                    {sch.title}
                  </h4>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    {sch.description}
                  </p>
                  <div className="p-2.5 bg-stone-50 rounded-xl text-xs font-semibold text-emerald-900">
                    Benefit: {sch.benefitAmount}
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                  <span className="text-stone-400">
                    Deadline: {sch.applicationDeadline}
                  </span>
                  <a
                    href={sch.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1"
                  >
                    <span>Apply / Details</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: FINANCE & AEPS CASH-OUT */}
      {activeTab === 'finance' && (
        <div className="space-y-5">
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                  AI Harvest Working Capital
                </span>
                <h3 className="text-xl font-black text-stone-900">
                  Pre-Harvest & Liquidity Advance
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Automated risk scoring based on fulfillment history, APMC volatility index, and produce quality.
                </p>
              </div>

              <button
                onClick={() => onOpenAepsModal(riskAssessment.eligibleAdvanceAmount)}
                className="px-5 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-sm rounded-xl shadow-md shadow-teal-700/20 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <IndianRupee className="w-4 h-4" />
                <span>Simulate AEPS Cash-Out</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-100">
                <p className="text-xs text-stone-500 font-medium">Eligible Advance</p>
                <p className="text-lg font-black text-emerald-700 mt-1">
                  ₹{riskAssessment.eligibleAdvanceAmount.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-100">
                <p className="text-xs text-stone-500 font-medium">Risk Score</p>
                <p className="text-lg font-black text-stone-900 mt-1">
                  {riskAssessment.riskScore} / 100
                </p>
              </div>
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-100">
                <p className="text-xs text-stone-500 font-medium">Fulfillment Rate</p>
                <p className="text-sm font-bold text-stone-800 mt-1">
                  {riskAssessment.factors.fulfillmentRate}
                </p>
              </div>
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-100">
                <p className="text-xs text-stone-500 font-medium">Reputation Score</p>
                <p className="text-sm font-bold text-amber-600 mt-1">
                  ★ {riskAssessment.factors.reputationScore} / 5.0
                </p>
              </div>
            </div>

            <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl text-xs text-teal-950 space-y-1">
              <p className="font-bold">AI Credit Model Explanation:</p>
              <p className="leading-relaxed text-stone-700">
                {riskAssessment.explanation}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: REPORT A CONCERN / WHISTLEBLOWER */}
      {activeTab === 'safety' && (
        <div className="bg-white rounded-3xl border border-rose-200 p-6 shadow-xs space-y-4 max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-100 text-rose-700 rounded-2xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-stone-900">
                {t.safety.title}
              </h3>
              <p className="text-xs text-stone-500">
                {t.safety.subheading}
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-rose-600" />
              100% Guaranteed Confidentiality
            </p>
            <p className="text-rose-800 leading-relaxed">
              {t.safety.guarantee}
            </p>
          </div>

          {safetySubmitted ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h4 className="font-bold text-sm text-emerald-900">
                Report Submitted to Admin Moderation Queue
              </h4>
              <p className="text-xs text-stone-600">
                Your report has been logged without storing any identifying data.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSafetySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Issue Category
                </label>
                <select
                  value={safetyCategory}
                  onChange={(e) => setSafetyCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                >
                  <option value="Underpricing & Cartel">Mandi Cartel Underpricing / Collusion</option>
                  <option value="Broker Exploitation">Sub-broker Extortion or Unauthorized Deductions</option>
                  <option value="Harassment">Verbal or Physical Harassment of Farmer</option>
                  <option value="Payment Default">Delayed or Bounced Payment by Trader</option>
                  <option value="Transport Dispute">Transporter Overcharging or Refusing Pickup</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Name / Description of Entity Involved (Mandi, Trader, Broker)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sub-agent at Pimpalgaon gate, Trader X"
                  value={safetyEntity}
                  onChange={(e) => setSafetyEntity(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Describe what happened
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Provide brief details. E.g. They insisted on offering ₹8/kg when official mandi price was ₹18/kg and threatened to turn away vehicles."
                  value={safetyDescription}
                  onChange={(e) => setSafetyDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="anonCheck"
                  checked={safetyAnonymous}
                  onChange={(e) => setSafetyAnonymous(e.target.checked)}
                  className="w-4 h-4 text-rose-600 rounded-sm focus:ring-rose-500 cursor-pointer"
                />
                <label htmlFor="anonCheck" className="text-xs font-semibold text-stone-700 cursor-pointer">
                  Submit 100% Anonymously (Do not associate my farmer ID)
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
              >
                Submit Report to Safety Moderation
              </button>
            </form>
          )}
        </div>
      )}

      {/* VOICE LISTING CREATION MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-800 to-teal-900 text-white">
              <div className="flex items-center gap-2">
                <Mic className="w-5 h-5 text-emerald-300" />
                <div>
                  <h3 className="text-base font-bold">
                    {t.farmer.createListing}
                  </h3>
                  <p className="text-xs text-emerald-200">
                    Voice-assisted, AI price recommended & anonymous
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-emerald-200 hover:text-white rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              
              {/* Mic Record Banner */}
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-emerald-900">
                    {isRecording ? t.farmer.listening : t.farmer.tapToSpeak}
                  </p>
                  <p className="text-[11px] text-emerald-700">
                    {t.farmer.speakPrompt}
                  </p>
                  {speechTranscript && (
                    <p className="text-xs font-mono font-semibold text-stone-800 bg-white/80 px-2.5 py-1 rounded-lg border border-emerald-200 inline-block mt-1">
                      "{speechTranscript}"
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleToggleRecording}
                  className={`relative w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-all cursor-pointer shrink-0 ${
                    isRecording
                      ? 'bg-rose-600 animate-pulse scale-105'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {isRecording ? (
                    <MicOff className="w-6 h-6" />
                  ) : (
                    <Mic className="w-6 h-6" />
                  )}
                  {isRecording && (
                    <span className="absolute inset-0 rounded-full border-4 border-rose-400 animate-ping" />
                  )}
                </button>
              </div>

              {/* Form Input Slots */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Crop
                  </label>
                  <select
                    value={cropInput}
                    onChange={(e) => setCropInput(e.target.value)}
                    className="w-full px-3 py-2 font-semibold bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Tomato">Tomato (टमाटर)</option>
                    <option value="Onion">Onion (प्याज)</option>
                    <option value="Potato">Potato (आलू)</option>
                    <option value="Green Chilli">Green Chilli (हरी मिर्च)</option>
                    <option value="Soybean">Soybean (सोयाबीन)</option>
                    <option value="Wheat">Wheat (गेहूं)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Variety
                  </label>
                  <input
                    type="text"
                    value={varietyInput}
                    onChange={(e) => setVarietyInput(e.target.value)}
                    className="w-full px-3 py-2 font-semibold border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Quantity (kg)
                  </label>
                  <input
                    type="number"
                    value={quantityInput}
                    onChange={(e) => setQuantityInput(Number(e.target.value))}
                    step={50}
                    min={50}
                    className="w-full px-3 py-2 font-bold text-stone-900 border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-stone-400 mt-0.5 block">
                    = {quantityInput / 100} Quintal
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Your Expected Price (₹/kg)
                  </label>
                  <input
                    type="number"
                    value={priceInput}
                    onChange={(e) => setPriceInput(Number(e.target.value))}
                    step={0.5}
                    min={5}
                    className="w-full px-3 py-2 font-bold text-emerald-800 border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* AI Price Recommendation Band */}
              {aiPriceBand && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      AI Price Band (Agmarknet Mandi Model)
                    </span>
                    <span className="font-bold text-amber-800">
                      {aiPriceBand.confidence}% Confidence
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono font-bold bg-white p-2 rounded-xl border border-amber-200/80">
                    <span className="text-stone-500">Min: ₹{aiPriceBand.min}/kg</span>
                    <span className="text-emerald-700 text-sm">Fair: ₹{aiPriceBand.fair}/kg</span>
                    <span className="text-stone-500">Max: ₹{aiPriceBand.max}/kg</span>
                  </div>

                  <p className="text-[11px] text-amber-800">
                    Benchmark: {aiPriceBand.benchmarkMandi}. Wholesale prices are currently trending {aiPriceBand.trend}.
                  </p>
                </div>
              )}

              {/* Produce Quality Assessment CNN Card */}
              {qualityGrade && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-emerald-600" />
                      CNN Produce Quality Scan: Grade {qualityGrade.grade}
                    </span>
                    <span className="font-bold text-emerald-800">
                      {qualityGrade.confidence}% Confidence
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-white p-1.5 rounded-lg border border-emerald-100">
                      <p className="text-[10px] text-stone-400">Color</p>
                      <p className="font-bold text-stone-800">{qualityGrade.colorUniformity}%</p>
                    </div>
                    <div className="bg-white p-1.5 rounded-lg border border-emerald-100">
                      <p className="text-[10px] text-stone-400">Firmness</p>
                      <p className="font-bold text-stone-800">{qualityGrade.firmnessScore}%</p>
                    </div>
                    <div className="bg-white p-1.5 rounded-lg border border-emerald-100">
                      <p className="text-[10px] text-stone-400">Defects</p>
                      <p className="font-bold text-emerald-700">{qualityGrade.surfaceDefects}%</p>
                    </div>
                  </div>

                  <p className="text-[11px] text-stone-600">
                    {qualityGrade.notes}
                  </p>
                </div>
              )}

              {/* Anonymous Shield Notice */}
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-[11px] text-stone-600 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <p>
                  {t.farmer.anonShieldNotice} Your listing will be published under Anonymous ID <span className="font-mono font-bold text-stone-900">{farmer.anonSellerId}</span>.
                </p>
              </div>

            </div>

            <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-200 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePublishListing}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
              >
                Publish Anonymously
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
