import React, { useState, useEffect, useCallback } from 'react';
import {
  FarmerProfile,
  Listing,
  Order,
  GovScheme,
  RiskAssessment,
  Language,
  QualityAssessment,
  PriceBand,
  AdvanceRequest,
  SafetyReport,
} from '../types';
import { I18N_STRINGS } from '../data/i18n';
import { extractVoiceListing, getAiPriceRecommendation, assessProduceQuality } from '../lib/api-client';
import { useVoiceCapture } from '../hooks/useVoiceCapture';
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
  Image,
  FileText,
  Filter,
  MoreVertical,
  Loader2,
  AlertCircle,
  ClipboardList,
  Fingerprint,
  Star,
  Sprout,
  Building2,
} from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/Card';
import { Input, Textarea } from './ui/Input';
import { Select } from './ui/Select';
import { Badge, StatusBadge } from './ui/Badge';
import { Modal } from './ui/Modal';
import { EmptyState } from './ui/EmptyState';
import { LoadingState } from './ui/LoadingState';

interface FarmerViewProps {
  farmer: FarmerProfile;
  listings: Listing[];
  orders: Order[];
  schemes: GovScheme[];
  riskAssessment: RiskAssessment;
  advances?: AdvanceRequest[];
  currentLanguage: Language;
  onAddListing: (listing: Listing) => Promise<boolean>;
  onUpdateListingStatus?: (id: string, status: string) => void;
  onUpdateOrderStatus?: (orderId: string, status: string) => void;
  onOpenAepsModal: (amount: number, advanceId?: string) => void;
  onRequestAdvance?: (amount: number, purpose: string, simulateAeps: boolean) => Promise<{ success: boolean; advance?: AdvanceRequest; error?: string }>;
  onSubmitSafetyReport: (report: {
    category: string;
    description: string;
    isAnonymous: boolean;
    reportedEntityName: string;
  }) => Promise<SafetyReport | null>;
  initialTab?: string;
}

const TABS = [
  { id: 'listings', label: 'My Listings', icon: <FileText className="w-4 h-4" /> },
  { id: 'orders', label: 'Orders', icon: <ClipboardList className="w-4 h-4" /> },
  { id: 'schemes', label: 'Schemes', icon: <Building2 className="w-4 h-4" /> },
  { id: 'finance', label: 'Finance', icon: <IndianRupee className="w-4 h-4" /> },
  { id: 'safety', label: 'Report', icon: <AlertTriangle className="w-4 h-4" /> },
] as const;

type TabId = typeof TABS[number]['id'];

const DEMO_PHOTOS: Record<string, { url: string; label: string }[]> = {
  Tomato: [
    { url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80', label: 'Ripe Batch A' },
    { url: 'https://images.unsplash.com/photo-1627626775846-122b778965ae?w=600&auto=format&fit=crop&q=80', label: 'Mixed Harvest B' },
  ],
  Onion: [
    { url: 'https://images.unsplash.com/photo-1508747703725-719777637510?w=600&auto=format&fit=crop&q=80', label: 'Nashik Red A' },
  ],
  Potato: [
    { url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80', label: 'Kufri Jyoti A' },
  ],
  'Green Chilli': [
    { url: 'https://images.unsplash.com/photo-1588252820310-3a69f25f6688?w=600&auto=format&fit=crop&q=80', label: 'G4 Hot Pepper A' },
  ],
  Soybean: [
    { url: 'https://images.unsplash.com/photo-1531912942579-bc411c69ad64?w=600&auto=format&fit=crop&q=80', label: 'JS-9560 Premium A' },
  ],
  Wheat: [
    { url: 'https://images.unsplash.com/photo-1504638465-8dab2f5e7e4a?w=600&auto=format&fit=crop&q=80', label: 'Sharbati Gold A' },
  ],
};

const SAFETY_CATEGORIES = [
  { value: 'Underpricing & Cartel', label: 'Mandi Cartel Underpricing / Collusion' },
  { value: 'Broker Exploitation', label: 'Sub-broker Extortion or Unauthorized Deductions' },
  { value: 'Harassment', label: 'Verbal or Physical Harassment of Farmer' },
  { value: 'Payment Default', label: 'Delayed or Bounced Payment by Trader' },
  { value: 'Transport Dispute', label: 'Transporter Overcharging or Refusing Pickup' },
];

export const FarmerView: React.FC<FarmerViewProps> = ({
  farmer,
  listings,
  orders,
  schemes,
  riskAssessment,
  advances = [],
  currentLanguage,
  onAddListing,
  onUpdateListingStatus,
  onUpdateOrderStatus,
  onOpenAepsModal,
  onRequestAdvance,
  onSubmitSafetyReport,
  initialTab = 'listings',
}) => {
  const [activeTab, setActiveTab] = useState<TabId>((initialTab as TabId) || 'listings');
  const t = I18N_STRINGS[currentLanguage];

  // Listing creation modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState('');
  const [cropInput, setCropInput] = useState('Tomato');
  const [varietyInput, setVarietyInput] = useState('Abhinav Hybrid');
  const [quantityInput, setQuantityInput] = useState<number>(2000);
  const [priceInput, setPriceInput] = useState<number>(18);
  const [_isProcessingAI, setIsProcessingAI] = useState(false);
  const [isAssessingQuality, setIsAssessingQuality] = useState(false);
  const [aiPriceBand, setAiPriceBand] = useState<PriceBand | null>(null);
  const [qualityGrade, setQualityGrade] = useState<QualityAssessment | null>(null);
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string>(
    'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80'
  );
  const [photoBase64, setPhotoBase64] = useState<string>('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  // Safety report form state
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

  // Trigger quality assessment via CNN API whenever photo or crop changes
  useEffect(() => {
    setIsAssessingQuality(true);
    setQualityGrade(null);
    assessProduceQuality(photoBase64 || selectedPhotoUrl, cropInput)
      .then(setQualityGrade)
      .finally(() => setIsAssessingQuality(false));
  }, [selectedPhotoUrl, photoBase64, cropInput]);

  // Handle file input: convert to base64 and update photo state
  const handlePhotoFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const base64 = evt.target?.result as string;
      setPhotoBase64(base64);
      setSelectedPhotoUrl(base64);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleVoiceResult = async (transcript: string) => {
    setSpeechTranscript(transcript);
    setIsProcessingAI(true);
    const result = await extractVoiceListing(transcript, currentLanguage);
    setCropInput(result.crop);
    setVarietyInput(result.variety);
    setQuantityInput(result.quantityKg);
    setPriceInput(result.priceExpected);
    setIsProcessingAI(false);
  };

  const { isRecording, startRecording, stopRecording } = useVoiceCapture(
    currentLanguage,
    handleVoiceResult
  );

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handlePublishListing = async () => {
    if (!cropInput || cropInput.trim().length === 0) {
      setPublishError('Crop name is required.');
      return;
    }

    const qty = Number(quantityInput);
    if (isNaN(qty) || qty <= 0) {
      setPublishError('Quantity must be a positive number.');
      return;
    }

    const price = Number(priceInput);
    if (isNaN(price) || price <= 0) {
      setPublishError('Price expected must be a positive number.');
      return;
    }

    setIsPublishing(true);
    setPublishError(null);
    try {
      const newListing: Listing = {
        id: `list_${Date.now()}`,
        anonSellerId: farmer.anonSellerId,
        farmerRealName: farmer.name,
        farmerPhone: farmer.phone,
        crop: cropInput.trim(),
        variety: varietyInput.trim() || 'Standard',
        quantityKg: qty,
        priceExpected: price,
        priceAi: aiPriceBand || {
          min: price * 0.9,
          fair: price,
          max: price * 1.15,
          confidence: 92,
          historicalMandiAvg: price,
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

      const success = await onAddListing(newListing);
      if (success) {
        setShowCreateModal(false);
        setSpeechTranscript('');
        setCropInput('Tomato');
        setVarietyInput('Abhinav Hybrid');
        setQuantityInput(2000);
        setPriceInput(18);
        setPhotoBase64('');
        setSelectedPhotoUrl('https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80');
        setPublishError(null);
        setActiveTab('listings');
      } else {
        setPublishError('Failed to publish listing. Please check your connection and try again.');
      }
    } catch {
      setPublishError('An error occurred while publishing the listing.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Farmer Profile Header */}
      <Card variant="elevated" padding="lg" className="bg-gradient-to-br from-emerald-800 via-teal-900 to-stone-950 text-white border-none shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="success" size="sm" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40">
                <Sprout className="w-3.5 h-3.5" />
                Verified Farmer
              </Badge>
              <Badge variant="info" size="sm" className="bg-sky-500/20 text-sky-200 border-sky-500/40 font-mono">
                <ShieldCheck className="w-3.5 h-3.5" />
                Anon ID: {farmer.anonSellerId}
              </Badge>
            </div>
            <CardTitle className="text-xl sm:text-2xl font-black text-white tracking-tight">{farmer.name}</CardTitle>
            <p className="text-xs sm:text-sm text-emerald-200 flex items-center gap-1.5 font-medium">
              <MapPin className="w-3.5 h-3.5" />
              {farmer.village}, {farmer.district}, {farmer.state} · {farmer.landSizeAcres} Acres Farm
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 text-center">
              <p className="text-[11px] text-emerald-200 font-medium">Trust Reputation</p>
              <p className="text-base font-black text-amber-300 flex items-center justify-center gap-1">
                <Star className="w-4 h-4 fill-amber-300 text-amber-300" />
                <span>{farmer.reputationScore} / 5.0</span>
              </p>
              <p className="text-[10px] text-emerald-300">{farmer.totalOrdersFulfilled} fulfilled</p>
            </div>

            <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 text-center">
              <p className="text-[11px] text-emerald-200 font-medium">AI Eligible Advance</p>
              <p className="text-base font-black text-white">₹{riskAssessment.eligibleAdvanceAmount.toLocaleString('en-IN')}</p>
              <p className="text-[10px] text-emerald-300">{riskAssessment.riskTier}</p>
            </div>

            <Button
              onClick={() => setShowCreateModal(true)}
              size="lg"
              className="bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-black shadow-lg shadow-emerald-400/20"
            >
              <Mic className="w-4 h-4" />
              <span>Voice / Add Listing</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-stone-200 no-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabId)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
            }`}
          >
            {tab.icon}
            <span>{t.nav[tab.id === 'safety' ? 'safetyReport' : tab.id] || tab.label}</span>
            {(tab.id === 'listings' && listings.length > 0) || (tab.id === 'orders' && orders.length > 0) || (tab.id === 'schemes' && schemes.length > 0) ? (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-emerald-700/40 text-emerald-100">
                {tab.id === 'listings' ? listings.length : tab.id === 'orders' ? orders.length : schemes.length}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* TAB 1: MY LISTINGS */}
      {activeTab === 'listings' && (
        <ListingTab
          listings={listings}
          farmer={farmer}
          t={t}
          onAddListing={onAddListing}
          onUpdateListingStatus={onUpdateListingStatus}
          showCreateModal={showCreateModal}
          setShowCreateModal={setShowCreateModal}
        />
      )}

      {/* TAB 2: ORDERS */}
      {activeTab === 'orders' && (
        <OrdersTab
          orders={orders}
          farmer={farmer}
          t={t}
          onUpdateOrderStatus={onUpdateOrderStatus}
        />
      )}

      {/* TAB 3: SCHEMES */}
      {activeTab === 'schemes' && (
        <SchemesTab
          schemes={schemes}
          farmer={farmer}
          t={t}
        />
      )}

      {/* TAB 4: FINANCE */}
      {activeTab === 'finance' && (
        <FinanceTab
          riskAssessment={riskAssessment}
          advances={advances}
          t={t}
          onOpenAepsModal={onOpenAepsModal}
          onRequestAdvance={onRequestAdvance}
        />
      )}

      {/* TAB 5: SAFETY */}
      {activeTab === 'safety' && (
        <SafetyTab
          t={t}
          onSubmitSafetyReport={onSubmitSafetyReport}
          safetyCategory={safetyCategory}
          setSafetyCategory={setSafetyCategory}
          safetyEntity={safetyEntity}
          setSafetyEntity={setSafetyEntity}
          safetyDescription={safetyDescription}
          setSafetyDescription={setSafetyDescription}
          safetyAnonymous={safetyAnonymous}
          setSafetyAnonymous={setSafetyAnonymous}
          safetySubmitted={safetySubmitted}
          setSafetySubmitted={setSafetySubmitted}
        />
      )}

      {/* VOICE LISTING CREATION MODAL */}
      <CreateListingModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setPublishError(null);
        }}
        farmer={farmer}
        currentLanguage={currentLanguage}
        t={t}
        speechTranscript={speechTranscript}
        setSpeechTranscript={setSpeechTranscript}
        cropInput={cropInput}
        setCropInput={setCropInput}
        varietyInput={varietyInput}
        setVarietyInput={setVarietyInput}
        quantityInput={quantityInput}
        setQuantityInput={setQuantityInput}
        priceInput={priceInput}
        setPriceInput={setPriceInput}
        isProcessingAI={_isProcessingAI}
        isAssessingQuality={isAssessingQuality}
        aiPriceBand={aiPriceBand}
        qualityGrade={qualityGrade}
        selectedPhotoUrl={selectedPhotoUrl}
        setSelectedPhotoUrl={setSelectedPhotoUrl}
        photoBase64={photoBase64}
        setPhotoBase64={setPhotoBase64}
        handlePhotoFileChange={handlePhotoFileChange}
        isRecording={isRecording}
        handleToggleRecording={handleToggleRecording}
        isPublishing={isPublishing}
        publishError={publishError}
        onPublish={handlePublishListing}
      />
    </div>
  );
};

// Sub-components for each tab
function ListingTab({
  listings,
  farmer,
  t,
  onAddListing,
  onUpdateListingStatus,
  showCreateModal,
  setShowCreateModal,
}: {
  listings: Listing[];
  farmer: FarmerProfile;
  t: any;
  onAddListing: (listing: Listing) => Promise<boolean>;
  onUpdateListingStatus?: (id: string, status: string) => void;
  showCreateModal: boolean;
  setShowCreateModal: (show: boolean) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <CardTitle>My Harvest Batches</CardTitle>
        <Button variant="outline" size="sm" onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4" />
          <span>New Listing</span>
        </Button>
      </div>

      {listings.length === 0 ? (
        <EmptyState
          variant="listings"
          action={<Button onClick={() => setShowCreateModal(true)}><Plus className="w-4 h-4" /> Create Listing</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((item) => (
            <Card key={item.id} variant="bordered" hover padding="none" className="overflow-hidden">
              <div className="relative h-44 bg-stone-100 overflow-hidden">
                <img
                  src={item.imageUrl}
                  alt={item.crop}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  <Badge variant={item.quality.grade === 'A' ? 'success' : item.quality.grade === 'B' ? 'warning' : 'danger'} size="sm">
                    Grade {item.quality.grade}
                  </Badge>
                  <Badge variant="neutral" size="sm" className="font-mono bg-stone-900/90 text-amber-300 border-none">{item.anonSellerId}</Badge>
                </div>
                <div className="absolute top-2.5 right-2.5">
                  <StatusBadge status={item.status} />
                </div>
              </div>

              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-base text-stone-900">{item.crop}</h4>
                    <p className="text-xs text-stone-500">{item.variety}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-stone-400 font-medium">Expected Price</p>
                    <p className="text-base font-black text-emerald-700">₹{item.priceExpected}/kg</p>
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
                    <span>CNN Quality:</span>
                    <span className="font-bold text-stone-900">{item.quality.confidence}% Confidence</span>
                  </div>
                </div>

                <div className="text-[11px] text-stone-400 flex items-center justify-between pt-1">
                  <span>Added {item.createdAt}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-700 font-bold">
                      {item.createdVia === 'voice' ? 'Voice' : 'Text'}
                    </span>
                    {item.status === 'active' && onUpdateListingStatus && (
                      <Button variant="ghost" size="sm" onClick={() => onUpdateListingStatus(item.id, 'withdrawn')}>
                        Withdraw
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function OrdersTab({
  orders,
  farmer,
  t,
  onUpdateOrderStatus,
}: {
  orders: Order[];
  farmer: FarmerProfile;
  t: any;
  onUpdateOrderStatus?: (orderId: string, status: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <CardTitle>Orders & Transaction Lifecycle</CardTitle>
        <span className="text-xs text-stone-500 font-medium">Identity reveals automatically upon confirmation</span>
      </div>

      {orders.length === 0 ? (
        <EmptyState variant="orders" />
      ) : (
        <div className="space-y-3.5">
          {orders.map((ord) => (
            <Card key={ord.id} variant="bordered" padding="md" className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-stone-900">Order #{ord.id}</span>
                  <StatusBadge status={ord.status} />
                  {ord.identityRevealed && (
                    <Badge variant="success" size="sm" dot>
                      <Eye className="w-3 h-3" />
                      Identity Revealed
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-stone-400 font-medium">Created: {ord.createdAt}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
                <div>
                  <span className="text-stone-400 block text-xs">Harvest Item:</span>
                  <span className="font-bold text-stone-900">{ord.crop} ({ord.variety})</span>
                  <span className="text-stone-500 block text-xs">{ord.quantityKg} kg @ ₹{ord.agreedPricePerKg}/kg</span>
                </div>

                <div>
                  <span className="text-stone-400 block text-xs">Total Settlement:</span>
                  <span className="font-black text-emerald-700 text-base">₹{ord.totalAmount.toLocaleString('en-IN')}</span>
                  <span className="text-stone-500 block text-xs">Direct Bank Transfer / AEPS</span>
                </div>

                <div>
                  <span className="text-stone-400 block text-xs">Buyer / Procurement:</span>
                  <span className="font-bold text-stone-900">{ord.buyerName}</span>
                  <span className="text-stone-500 block text-xs">{ord.buyerType}</span>
                  {ord.identityRevealed && (
                    <span className="text-emerald-700 font-bold flex items-center gap-1 mt-0.5 text-xs">
                      <Phone className="w-3.5 h-3.5" />
                      {ord.buyerPhone}
                    </span>
                  )}
                </div>
              </div>

              {ord.identityRevealed && (
                <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-950 space-y-1">
                  <p className="font-bold flex items-center gap-1.5 text-blue-900">
                    <ShieldCheck className="w-4 h-4 text-blue-700" />
                    Trade Confirmed: Mutual Identity Unlocked
                  </p>
                  <p className="text-stone-600">
                    Buyer delivery address: <span className="font-semibold text-stone-900">{ord.deliveryAddress}</span>. Logistics carrier handles farmgate dispatch.
                  </p>
                </div>
              )}

              {ord.status === 'pending' && onUpdateOrderStatus && (
                <div className="pt-2 flex justify-end">
                  <Button variant="primary" size="sm" onClick={() => onUpdateOrderStatus(ord.id, 'confirmed')}>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Confirm Order & Reveal Identity</span>
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function SchemesTab({
  schemes,
  farmer,
  t,
}: {
  schemes: GovScheme[];
  farmer: FarmerProfile;
  t: any;
}) {
  const SCHEME_CATEGORIES = ['All', 'Direct Benefit', 'Crop Insurance', 'Credit', 'Infrastructure & Equipment', 'Solar & Irrigation', 'Organic Subsidy', 'Market Linkage', 'Training & Extension'];
  const [schemeCategory, setSchemeCategory] = useState('All');
  const filteredSchemes = schemeCategory === 'All' ? schemes : schemes.filter(s => s.category === schemeCategory);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <CardTitle>Government Schemes Matched to Your Profile</CardTitle>
          <p className="text-xs text-stone-500 mt-0.5">Eligibility checked for: {farmer.state} · {farmer.landSizeAcres} Acres · {farmer.primaryCrops.join(', ')}</p>
        </div>
        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          {filteredSchemes.length} scheme{filteredSchemes.length !== 1 ? 's' : ''} matched
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {SCHEME_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSchemeCategory(cat)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors border cursor-pointer ${
              schemeCategory === cat
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-stone-600 border-stone-300 hover:border-emerald-400 hover:text-emerald-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {filteredSchemes.length === 0 ? (
        <EmptyState variant="schemes" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSchemes.map((sch) => (
            <Card key={sch.id} variant="bordered" padding="md" className="space-y-3 flex flex-col justify-between">
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <Badge variant="info" size="sm">{sch.category}</Badge>
                  <Badge variant="success" size="sm">Eligible</Badge>
                </div>
                <CardTitle className="text-base">{sch.title}</CardTitle>
                <p className="text-stone-600 leading-relaxed text-xs sm:text-sm">{sch.description}</p>
                {sch.eligibilityReason && (
                  <div className="p-2.5 bg-emerald-50 rounded-xl text-xs text-emerald-950 border border-emerald-100">
                    <span className="font-bold">Why you qualify: </span>{sch.eligibilityReason}
                  </div>
                )}
                <div className="p-2.5 bg-stone-50 rounded-xl text-xs font-bold text-emerald-900 border border-stone-100">Benefit: {sch.benefitAmount}</div>
              </div>

              <CardFooter className="text-xs text-stone-500">
                <span>Deadline: {sch.applicationDeadline}</span>
                <a href={sch.sourceUrl} target="_blank" rel="noreferrer" className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 ml-auto">
                  <span>Apply / Details</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function FinanceTab({
  riskAssessment,
  advances,
  t,
  onOpenAepsModal,
  onRequestAdvance,
}: {
  riskAssessment: RiskAssessment;
  advances: AdvanceRequest[];
  t: any;
  onOpenAepsModal: (amount: number, advanceId?: string) => void;
  onRequestAdvance?: (amount: number, purpose: string, simulateAeps: boolean) => void;
}) {
  return (
    <div className="space-y-5">
      <Card variant="bordered" padding="lg" className="space-y-4">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <Badge variant="info" size="sm">AI Harvest Working Capital</Badge>
              <CardTitle className="text-xl mt-1">Pre-Harvest & Liquidity Advance</CardTitle>
              <p className="text-xs text-stone-500 mt-0.5">Automated risk scoring based on fulfillment history, APMC volatility index, and produce quality.</p>
            </div>
            <Button
              size="lg"
              onClick={() => {
                const existingRequested = advances.find((a) => a.status === 'requested');
                if (existingRequested) {
                  onOpenAepsModal(existingRequested.amountRequested, existingRequested.id);
                } else {
                  const activeTotal = advances
                    .filter((a) => a.status === 'requested' || a.status === 'disbursed')
                    .reduce((sum, a) => sum + a.amountRequested, 0);
                  const remaining = Math.max(0, riskAssessment.eligibleAdvanceAmount - activeTotal);
                  const amtToRequest = remaining > 0 ? remaining : riskAssessment.eligibleAdvanceAmount;
                  if (onRequestAdvance) {
                    onRequestAdvance(amtToRequest, 'Pre-Harvest Liquidity', true);
                  } else {
                    onOpenAepsModal(amtToRequest);
                  }
                }
              }}
              className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold"
            >
              <IndianRupee className="w-4 h-4" />
              <span>Simulate AEPS Cash-Out</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-100">
              <p className="text-xs text-stone-500 font-medium">Eligible Advance</p>
              <p className="text-lg font-black text-emerald-700 mt-1">₹{riskAssessment.eligibleAdvanceAmount.toLocaleString('en-IN')}</p>
            </div>
            <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-100">
              <p className="text-xs text-stone-500 font-medium">Risk Score</p>
              <p className="text-lg font-black text-stone-900 mt-1">{riskAssessment.riskScore} / 100</p>
            </div>
            <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-100">
              <p className="text-xs text-stone-500 font-medium">Fulfillment Rate</p>
              <p className="text-sm font-bold text-stone-800 mt-1">{riskAssessment.factors.fulfillmentRate}</p>
            </div>
            <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-100">
              <p className="text-xs text-stone-500 font-medium">Reputation Score</p>
              <p className="text-sm font-bold text-amber-600 mt-1 flex items-center gap-1">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                <span>{riskAssessment.factors.reputationScore} / 5.0</span>
              </p>
            </div>
          </div>

          <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl text-xs text-teal-950 space-y-1">
            <p className="font-bold text-teal-900">AI Credit Model Explanation:</p>
            <p className="leading-relaxed text-stone-700">{riskAssessment.explanation}</p>
          </div>

          {advances.length > 0 && (
            <div className="pt-4 border-t border-stone-100">
              <h4 className="font-bold text-stone-900 mb-3 text-sm">Working Capital Request History</h4>
              <div className="space-y-3">
                {advances.map((adv) => {
                  return (
                    <div key={adv.id} className="flex justify-between items-center p-3.5 rounded-2xl border border-stone-200 bg-white shadow-2xs">
                      <div>
                        <p className="font-black text-stone-900 text-sm">₹{adv.amountRequested.toLocaleString('en-IN')}</p>
                        <p className="text-xs text-stone-500 font-mono">Ref: {adv.aepsTxnRef || adv.id}</p>
                        {adv.purpose && <p className="text-[11px] text-stone-400 font-medium">{adv.purpose}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        {adv.status === 'requested' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onOpenAepsModal(adv.amountRequested, adv.id)}
                            className="text-xs border-teal-600 text-teal-700 hover:bg-teal-50 flex items-center gap-1 font-bold"
                          >
                            <Fingerprint className="w-3.5 h-3.5" />
                            <span>Cash Out (AEPS)</span>
                          </Button>
                        )}
                        <StatusBadge status={adv.status} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SafetyTab({
  t,
  onSubmitSafetyReport,
  safetyCategory,
  setSafetyCategory,
  safetyEntity,
  setSafetyEntity,
  safetyDescription,
  setSafetyDescription,
  safetyAnonymous,
  setSafetyAnonymous,
  safetySubmitted,
  setSafetySubmitted,
}: {
  t: any;
  onSubmitSafetyReport: (report: {
    category: string;
    description: string;
    isAnonymous: boolean;
    reportedEntityName: string;
  }) => Promise<SafetyReport | null>;
  safetyCategory: string;
  setSafetyCategory: (val: string) => void;
  safetyEntity: string;
  setSafetyEntity: (val: string) => void;
  safetyDescription: string;
  setSafetyDescription: (val: string) => void;
  safetyAnonymous: boolean;
  setSafetyAnonymous: (val: boolean) => void;
  safetySubmitted: boolean;
  setSafetySubmitted: (val: boolean) => void;
}) {
  const [isSubmittingSafety, setIsSubmittingSafety] = useState(false);
  const [safetyError, setSafetyError] = useState<string | null>(null);

  const handleSafetySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!safetyEntity.trim()) {
      setSafetyError('Reported entity name is required.');
      return;
    }
    if (!safetyDescription.trim() || safetyDescription.trim().length < 10) {
      setSafetyError('Description must be at least 10 characters long.');
      return;
    }

    setIsSubmittingSafety(true);
    setSafetyError(null);
    try {
      const created = await onSubmitSafetyReport({
        category: safetyCategory,
        description: safetyDescription,
        isAnonymous: safetyAnonymous,
        reportedEntityName: safetyEntity || 'Local Mandi Intermediary',
      });

      if (created) {
        setSafetySubmitted(true);
        setTimeout(() => {
          setSafetySubmitted(false);
          setSafetyDescription('');
          setSafetyEntity('');
        }, 3000);
      } else {
        setSafetyError('Failed to submit report. Please check your connection and try again.');
      }
    } catch {
      setSafetyError('An error occurred while submitting report.');
    } finally {
      setIsSubmittingSafety(false);
    }
  };

  return (
    <Card variant="bordered" padding="lg" className="max-w-2xl mx-auto border-rose-200 space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-rose-100 text-rose-700 rounded-2xl"><AlertTriangle className="w-6 h-6" /></div>
        <div>
          <CardTitle className="text-lg">{t.safety.title}</CardTitle>
          <p className="text-xs text-stone-500">{t.safety.subheading}</p>
        </div>
      </div>

      <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 space-y-1">
        <p className="font-bold flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-rose-600" />
          100% Guaranteed Confidentiality
        </p>
        <p className="text-rose-800 leading-relaxed">{t.safety.guarantee}</p>
      </div>

      {safetyError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{safetyError}</span>
        </div>
      )}

      {safetySubmitted ? (
        <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
          <h4 className="font-bold text-sm text-emerald-900">Report Submitted to Admin Moderation Queue</h4>
          <p className="text-xs text-stone-600">Your report has been logged without storing any identifying data.</p>
        </div>
      ) : (
        <form onSubmit={handleSafetySubmit} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Issue Category</label>
            <Select
              options={SAFETY_CATEGORIES.map(c => ({ value: c.value, label: c.label }))}
              value={safetyCategory}
              onChange={(e) => setSafetyCategory(e.target.value)}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Name / Description of Entity Involved</label>
            <Input
              placeholder="e.g. Sub-agent at Pimpalgaon gate, Trader X"
              value={safetyEntity}
              onChange={(e) => setSafetyEntity(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Describe what happened</label>
            <Textarea
              rows={4}
              required
              placeholder="Provide brief details. E.g. They insisted on offering ₹8/kg when official mandi price was ₹18/kg and threatened to turn away vehicles."
              value={safetyDescription}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSafetyDescription(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="anonCheck"
              checked={safetyAnonymous}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSafetyAnonymous(e.target.checked)}
              className="w-4 h-4 text-rose-600 rounded-sm focus:ring-rose-500 cursor-pointer"
            />
            <label htmlFor="anonCheck" className="text-xs font-bold text-stone-700 cursor-pointer">
              Submit 100% Anonymously (Do not associate my farmer ID)
            </label>
          </div>

          <Button type="submit" className="w-full" variant="danger" disabled={isSubmittingSafety} loading={isSubmittingSafety}>
            Submit Report to Safety Moderation
          </Button>
        </form>
      )}
    </Card>
  );
}

function CreateListingModal({
  isOpen,
  onClose,
  farmer,
  currentLanguage,
  t,
  speechTranscript,
  setSpeechTranscript,
  cropInput,
  setCropInput,
  varietyInput,
  setVarietyInput,
  quantityInput,
  setQuantityInput,
  priceInput,
  setPriceInput,
  isProcessingAI,
  isAssessingQuality,
  aiPriceBand,
  qualityGrade,
  selectedPhotoUrl,
  setSelectedPhotoUrl,
  photoBase64,
  setPhotoBase64,
  handlePhotoFileChange,
  isRecording,
  handleToggleRecording,
  isPublishing,
  publishError,
  onPublish,
}: {
  isOpen: boolean;
  onClose: () => void;
  farmer: FarmerProfile;
  currentLanguage: Language;
  t: any;
  speechTranscript: string;
  setSpeechTranscript: (val: string) => void;
  cropInput: string;
  setCropInput: (val: string) => void;
  varietyInput: string;
  setVarietyInput: (val: string) => void;
  quantityInput: number;
  setQuantityInput: (val: number) => void;
  priceInput: number;
  setPriceInput: (val: number) => void;
  isProcessingAI: boolean;
  isAssessingQuality: boolean;
  aiPriceBand: PriceBand | null;
  qualityGrade: QualityAssessment | null;
  selectedPhotoUrl: string;
  setSelectedPhotoUrl: (val: string) => void;
  photoBase64: string;
  setPhotoBase64: (val: string) => void;
  handlePhotoFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isRecording: boolean;
  handleToggleRecording: () => void;
  isPublishing?: boolean;
  publishError?: string | null;
  onPublish: () => void;
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t.farmer.createListing}
      description="Voice-assisted, AI price recommended & anonymous"
      size="xl"
    >
      <div className="space-y-5 text-xs sm:text-sm">
        {publishError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{publishError}</span>
          </div>
        )}
        {/* Mic Record Banner */}
        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="space-y-1">
            <p className="text-xs font-bold text-emerald-950">
              {isRecording ? t.farmer.listening : t.farmer.tapToSpeak}
            </p>
            <p className="text-[11px] text-emerald-800 font-medium">{t.farmer.speakPrompt}</p>
            {speechTranscript && (
              <p className="text-xs font-mono font-bold text-stone-900 bg-white/90 px-2.5 py-1 rounded-lg border border-emerald-200 inline-block mt-1">
                "{speechTranscript}"
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleToggleRecording}
            className={`relative w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-all cursor-pointer shrink-0 ${
              isRecording ? 'bg-rose-600 animate-pulse scale-105' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            {isRecording && <span className="absolute inset-0 rounded-full border-4 border-rose-400 animate-ping" />}
          </button>
        </div>

        {/* Form Input Slots */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block font-bold text-stone-700 mb-1">Crop</label>
            <Select
              options={[
                { value: 'Tomato', label: 'Tomato (टमाटर)' },
                { value: 'Onion', label: 'Onion (प्याज)' },
                { value: 'Potato', label: 'Potato (आलू)' },
                { value: 'Green Chilli', label: 'Green Chilli (हरी मिर्च)' },
                { value: 'Soybean', label: 'Soybean (सोयाबीन)' },
                { value: 'Wheat', label: 'Wheat (गेहूं)' },
              ]}
              value={cropInput}
              onChange={(e) => setCropInput(e.target.value)}
              className="w-full"
            />
          </div>

          <div>
            <label className="block font-bold text-stone-700 mb-1">Variety</label>
            <Input
              value={varietyInput}
              onChange={(e) => setVarietyInput(e.target.value)}
              className="w-full"
            />
          </div>

          <div>
            <label className="block font-bold text-stone-700 mb-1">Quantity (kg)</label>
            <Input
              type="number"
              value={quantityInput}
              onChange={(e) => setQuantityInput(Number(e.target.value))}
              step={50}
              min={50}
              className="w-full"
            />
            <span className="text-[10px] text-stone-400 font-medium mt-0.5 block">= {quantityInput / 100} Quintal</span>
          </div>

          <div>
            <label className="block font-bold text-stone-700 mb-1">Expected Price (₹/kg)</label>
            <Input
              type="number"
              value={priceInput}
              onChange={(e) => setPriceInput(Number(e.target.value))}
              step={0.5}
              min={5}
              className="w-full text-emerald-800"
            />
          </div>
        </div>

        {/* Photo Upload & CNN Quality Assessment */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-stone-700">Produce Photo (for CNN Quality Assessment)</label>

          <div className="relative w-full h-36 rounded-xl overflow-hidden border border-stone-200 bg-stone-50">
            {selectedPhotoUrl && (
              <img src={selectedPhotoUrl} alt="Produce photo" className="w-full h-full object-cover" />
            )}
            <div className="absolute top-2 left-2">
              {isAssessingQuality ? (
                <Badge variant="warning" size="sm" className="animate-pulse">CNN Analysing...</Badge>
              ) : qualityGrade ? (
                <Badge variant={qualityGrade.grade === 'A' ? 'success' : qualityGrade.grade === 'B' ? 'warning' : 'danger'} size="sm">
                  Grade {qualityGrade.grade} · {qualityGrade.confidence}%
                </Badge>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="photo-upload" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl cursor-pointer transition-colors">
              <Camera className="w-3.5 h-3.5" /> Upload Photo
            </label>
            <input id="photo-upload" type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoFileChange} />
            <span className="text-[11px] text-stone-400 font-medium">or choose demo photo:</span>
          </div>

          {DEMO_PHOTOS[cropInput] && (
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {DEMO_PHOTOS[cropInput].map((demo) => (
                <button
                  key={demo.url}
                  type="button"
                  onClick={() => { setSelectedPhotoUrl(demo.url); setPhotoBase64(''); }}
                  className={`shrink-0 flex flex-col items-center gap-1 p-1 rounded-xl border-2 transition-all cursor-pointer ${
                    selectedPhotoUrl === demo.url
                      ? 'border-emerald-500 shadow-sm'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <img src={demo.url} alt={demo.label} className="w-16 h-12 object-cover rounded-lg" loading="lazy" />
                  <span className="text-[10px] text-stone-600 font-bold">{demo.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* AI Price Recommendation Band */}
        {aiPriceBand && (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-amber-950 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" />
                AI Price Band (Agmarknet Mandi Model)
              </span>
              <span className="font-bold text-amber-900">{aiPriceBand.confidence}% Confidence</span>
            </div>

            <div className="flex items-center justify-between text-xs font-mono font-bold bg-white p-2 rounded-xl border border-amber-200/80">
              <span className="text-stone-500">Min: ₹{aiPriceBand.min}/kg</span>
              <span className="text-emerald-700 text-sm">Fair: ₹{aiPriceBand.fair}/kg</span>
              <span className="text-stone-500">Max: ₹{aiPriceBand.max}/kg</span>
            </div>

            <p className="text-[11px] text-amber-900 font-medium">Benchmark: {aiPriceBand.benchmarkMandi}. Wholesale prices are currently trending {aiPriceBand.trend}.</p>
          </div>
        )}

        {/* Quality Assessment */}
        {isAssessingQuality && (
          <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-2xl space-y-2 animate-pulse">
            <div className="flex items-center gap-2 text-xs text-stone-500 font-bold">
              <Camera className="w-4 h-4 text-emerald-600" />
              <span>MobileNet CNN analysing produce quality...</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {['Color', 'Firmness', 'Defects'].map(label => (
                <div key={label} className="bg-stone-200 h-8 rounded-lg" />
              ))}
            </div>
          </div>
        )}
        {!isAssessingQuality && qualityGrade && (
          <div className={`p-3.5 border rounded-2xl space-y-2 ${
            qualityGrade.grade === 'A' ? 'bg-emerald-50 border-emerald-200' :
            qualityGrade.grade === 'B' ? 'bg-amber-50 border-amber-200' :
            'bg-rose-50 border-rose-200'
          }`}>
            <div className="flex items-center justify-between text-xs">
              <span className={`font-bold flex items-center gap-1.5 ${qualityGrade.grade === 'A' ? 'text-emerald-950' : qualityGrade.grade === 'B' ? 'text-amber-950' : 'text-rose-950'}`}>
                <Camera className="w-4 h-4" />
                CNN Grade {qualityGrade.grade} — {qualityGrade.freshnessLabel}
              </span>
              <Badge variant={qualityGrade.grade === 'A' ? 'success' : qualityGrade.grade === 'B' ? 'warning' : 'danger'} size="sm">
                {qualityGrade.confidence}%
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-white p-1.5 rounded-lg border border-stone-100">
                <p className="text-[10px] text-stone-400 font-medium">Color Uniformity</p>
                <p className="font-bold text-stone-800">{qualityGrade.colorUniformity}%</p>
              </div>
              <div className="bg-white p-1.5 rounded-lg border border-stone-100">
                <p className="text-[10px] text-stone-400 font-medium">Firmness</p>
                <p className="font-bold text-stone-800">{qualityGrade.firmnessScore}%</p>
              </div>
              <div className="bg-white p-1.5 rounded-lg border border-stone-100">
                <p className="text-[10px] text-stone-400 font-medium">Defect %</p>
                <p className={`font-bold ${qualityGrade.surfaceDefects <= 8 ? 'text-emerald-700' : qualityGrade.surfaceDefects <= 18 ? 'text-amber-600' : 'text-rose-600'}`}>{qualityGrade.surfaceDefects}%</p>
              </div>
            </div>

            <p className="text-[11px] text-stone-600 leading-relaxed font-medium">{qualityGrade.notes}</p>
          </div>
        )}

        {/* Anonymous Shield Notice */}
        <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-[11px] text-stone-600 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
          <p>
            {t.farmer.anonShieldNotice} Your listing will be published under Anonymous ID <span className="font-mono font-bold text-stone-900">{farmer.anonSellerId}</span>.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-200">
          <Button variant="secondary" onClick={onClose} disabled={isPublishing}>Cancel</Button>
          <Button variant="primary" onClick={onPublish} disabled={isPublishing} loading={isPublishing}>
            Publish Anonymously
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default FarmerView;
