import React, { useState, useEffect, useCallback } from 'react';
import {
  FarmerProfile,
  Listing,
  Order,
  OrderStatus,
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
  User,
  Award,
  BarChart2,
  Wallet,
  Flag,
  Home,
  BadgeCheck,
  Droplets,
  Scale,
  Tag,
  Hash,
  GripVertical,
  Package,
  CreditCard,
  Banknote,
  Receipt,
  MapPin as MapPinIcon,
  RotateCcw,
  CheckCircle,
  Circle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  History,
  ArrowRight,
  Lock,
  Unlock,
  UserCheck,
  Warehouse,
  Calendar,
  Banknote as BanknoteIcon,
  CreditCard as CreditCardIcon,
  Package as PackageIcon,
  GitBranch,
  CheckCheck,
  DollarSign,
  MapPin as MapPinIcon2,
  Navigation,
  CircleDot,
  Minus,
  LoaderCircle,
  ReceiptText,
  Banknote as BanknoteIcon2,
  UserPlus,
  UserMinus,
  Leaf,
  Zap,
  Target,
} from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/Card';
import { Input, Textarea } from './ui/Input';
import { Select } from './ui/Select';
import { Badge, StatusBadge } from './ui/Badge';
import { Modal } from './ui/Modal';
import { EmptyState } from './ui/EmptyState';
import { LoadingState } from './ui/LoadingState';
import { ImageWithFallback } from './ui/ImageWithFallback';

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
  { id: 'listings', label: 'My Listings', icon: FileText },
  { id: 'orders', label: 'Orders', icon: ClipboardList },
  { id: 'schemes', label: 'Schemes', icon: Building2 },
  { id: 'finance', label: 'Finance', icon: Wallet },
  { id: 'safety', label: 'Report', icon: Flag },
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

const getGradeVariant = (grade: 'A' | 'B' | 'C') => 
  grade === 'A' ? 'botanical' : grade === 'B' ? 'harvest' : 'copper';

const getGradeLabel = (grade: 'A' | 'B' | 'C') => 
  grade === 'A' ? 'Premium' : grade === 'B' ? 'Standard' : 'Basic';

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

  const [safetyCategory, setSafetyCategory] = useState<string>('Underpricing & Cartel');
  const [safetyEntity, setSafetyEntity] = useState<string>('');
  const [safetyDescription, setSafetyDescription] = useState<string>('');
  const [safetyAnonymous, setSafetyAnonymous] = useState<boolean>(true);
  const [safetySubmitted, setSafetySubmitted] = useState<boolean>(false);

  useEffect(() => {
    const band = getAiPriceRecommendation(cropInput, farmer.district);
    setAiPriceBand(band);
  }, [cropInput, farmer.district]);

  useEffect(() => {
    setIsAssessingQuality(true);
    setQualityGrade(null);
    assessProduceQuality(photoBase64 || selectedPhotoUrl, cropInput)
      .then(setQualityGrade)
      .finally(() => setIsAssessingQuality(false));
  }, [selectedPhotoUrl, photoBase64, cropInput]);

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
      {/* Farmer Profile Header - Refined Dark Theme */}
      <div className="relative bg-atmosphere-farmer">
        
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Left: Identity & Location */}
          <div className="md:col-span-2 space-y-5">
            {/* Status badges row */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="botanical" size="sm" className="gap-1.5">
                <BadgeCheck className="w-3 h-3" />
                <span>Verified Farmer</span>
              </Badge>
              <Badge variant="cream" size="sm" className="font-mono gap-1.5">
                <ShieldCheck className="w-3 h-3" />
                <span>Anon: {farmer.anonSellerId}</span>
              </Badge>
            </div>

            {/* Name & Location */}
            <div className="space-y-2">
              <h1 className="font-display text-2xl sm:text-3xl font-semibold text-cream-50 tracking-tight">
                {farmer.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-cream-400">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-forest-400" />
                  <span className="font-medium text-cream-300">{farmer.village}</span>
                  <span className="text-cream-600">·</span>
                  <span>{farmer.district}</span>
                  <span className="text-cream-600">·</span>
                  <span>{farmer.state}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Home className="w-4 h-4 text-forest-400" />
                  <span className="font-medium text-cream-300">{farmer.landSizeAcres} acres</span>
                  <span className="text-cream-600">·</span>
                  <span className="font-medium">{farmer.primaryCrops.slice(0, 2).join(', ')}</span>
                  {farmer.primaryCrops.length > 2 && (
                    <span className="text-cream-500">+{farmer.primaryCrops.length - 2} more</span>
                  )}
                </div>
              </div>
            </div>

            {/* Voice/Add Listing Action - Inline primary action */}
            <Button
              onClick={() => setShowCreateModal(true)}
              size="lg"
              variant="botanical"
              className="w-full sm:w-auto mt-2 gap-2"
            >
              <Mic className="w-5 h-5" />
              <span>Voice / Add Listing</span>
            </Button>
          </div>

          {/* Right: Key Metrics - Clean metric cards */}
          <div className="hidden md:block">
            <div className="grid grid-cols-2 gap-3">
              {/* Trust Reputation */}
              <Card variant="farmer" padding="md" className="text-center hover:shadow-lg transition-shadow border-botanical-700">
                <div className="flex items-center justify-center gap-1.5 mb-2">
                  <Award className="w-5 h-5 text-harvest-400" />
                  <span className="text-xs font-semibold text-cream-500 uppercase tracking-wider">Trust Score</span>
                </div>
                <div className="flex items-center justify-center gap-1 text-2xl font-bold text-cream-50">
                  <Star className="w-6 h-6 fill-harvest-400 text-harvest-400" />
                  <span>{farmer.reputationScore.toFixed(1)}</span>
                  <span className="text-lg font-normal text-cream-500">/ 5.0</span>
                </div>
                <p className="text-xs text-cream-500 mt-1">{farmer.totalOrdersFulfilled} orders fulfilled</p>
              </Card>

              {/* AI Eligible Advance */}
              <Card variant="subtle-harvest" padding="md" className="text-center hover:shadow-lg transition-shadow border-harvest-700">
                <div className="flex items-center justify-center gap-1.5 mb-2">
                  <Wallet className="w-5 h-5 text-harvest-400" />
                  <span className="text-xs font-semibold text-cream-500 uppercase tracking-wider">Eligible Advance</span>
                </div>
                <p className="text-2xl font-bold text-harvest-300">
                  ₹{riskAssessment.eligibleAdvanceAmount.toLocaleString('en-IN')}
                </p>
                <Badge 
                  variant={riskAssessment.riskTier === 'Low Risk' ? 'success' : riskAssessment.riskTier === 'Moderate Risk' ? 'warning' : 'danger'} 
                  size="sm" 
                  className="mt-2"
                >
                  {riskAssessment.riskTier}
                </Badge>
              </Card>
            </div>

            {/* Additional context metrics */}
            <Card variant="panel" padding="md" className="mt-4 space-y-3 border-bg-700">
              <div className="flex items-center justify-between p-3 bg-bg-750 rounded-lg border border-bg-700">
                <div className="flex items-center gap-3">
                  <BarChart2 className="w-5 h-5 text-teal-400" />
                  <div>
                    <p className="text-xs text-cream-500 uppercase tracking-wider">Risk Score</p>
                    <p className="font-semibold text-cream-100">{riskAssessment.riskScore} / 100</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-cream-500 uppercase tracking-wider">Fulfillment</p>
                  <p className="font-semibold text-cream-100">{riskAssessment.factors.fulfillmentRate}</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-bg-750 rounded-lg border border-bg-700">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-copper-400" />
                  <div>
                    <p className="text-xs text-cream-500 uppercase tracking-wider">Primary Crops</p>
                    <p className="font-semibold text-cream-100">{farmer.primaryCrops.length} varieties</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-cream-500 uppercase tracking-wider">Since</p>
                  <p className="font-semibold text-cream-100">Active</p>
                </div>
              </div>
</Card>
          </div>

          {/* Mobile metrics - shown below on mobile */}
          <div className="md:hidden mt-6 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Card variant="farmer" padding="md" className="text-center border-botanical-700">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Award className="w-4 h-4 text-harvest-400" />
                  <span className="text-xs font-semibold text-cream-500 uppercase tracking-wider">Trust Score</span>
                </div>
                <div className="flex items-center justify-center gap-1 text-xl font-bold text-cream-50">
                  <Star className="w-5 h-5 fill-harvest-400 text-harvest-400" />
                  <span>{farmer.reputationScore.toFixed(1)}</span>
                  <span className="text-base font-normal text-cream-500">/ 5.0</span>
                </div>
                <p className="text-xs text-cream-500 mt-1">{farmer.totalOrdersFulfilled} fulfilled</p>
              </Card>

              <Card variant="subtle-harvest" padding="md" className="text-center border-harvest-700">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Wallet className="w-4 h-4 text-harvest-400" />
                  <span className="text-xs font-semibold text-cream-500 uppercase tracking-wider">Eligible Advance</span>
                </div>
                <p className="text-xl font-bold text-harvest-300">
                  ₹{riskAssessment.eligibleAdvanceAmount.toLocaleString('en-IN')}
                </p>
                <Badge 
                  variant={riskAssessment.riskTier === 'Low Risk' ? 'success' : riskAssessment.riskTier === 'Moderate Risk' ? 'warning' : 'danger'} 
                  size="xs" 
                  className="mt-1.5"
                >
                  {riskAssessment.riskTier}
                </Badge>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs - Refined */}
      <div className="relative">
        <nav className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-bg-700 scrollbar-hidden" role="tablist" aria-label="Farmer portal sections">
          {TABS.map((tab) => {
            const count = tab.id === 'listings' ? listings.length : tab.id === 'orders' ? orders.length : tab.id === 'schemes' ? schemes.length : 0;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabId)}
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${tab.id}`}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer whitespace-nowrap relative ${
                  isActive
                    ? 'text-botanical-300 bg-botanical-900/30 border border-botanical-700'
                    : 'text-cream-400 hover:text-cream-100 hover:bg-bg-800'
                }`}
              >
                <tab.icon className={`w-4 h-4 ${isActive ? 'text-botanical-300' : 'text-cream-500'}`} aria-hidden="true" />
                <span>{t.nav[tab.id === 'safety' ? 'safetyReport' : tab.id] || tab.label}</span>
                {count > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive
                      ? 'bg-botanical-700 text-botanical-100'
                      : 'bg-bg-700 text-cream-500'
                  }`}>
                    {count}
                  </span>
                )}
                {/* Active indicator */}
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-botanical-400 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* TAB 1: MY LISTINGS */}
      {activeTab === 'listings' && (
        <div className="space-y-5" role="feed" aria-label="My harvest listings">
          {/* Header with title and primary action */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-botanical-900/30 border border-botanical-700 flex items-center justify-center">
                <FileText className="w-5 h-5 text-botanical-400" />
              </div>
              <div>
                <h2 className="font-display text-xl font-semibold text-cream-50">My Harvest Batches</h2>
                <p className="text-sm text-cream-400">{listings.length} active listing{listings.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <Button 
              variant="botanical" 
              size="sm" 
              onClick={() => setShowCreateModal(true)}
              className="sm:ml-auto"
            >
              <Plus className="w-4 h-4" />
              <span>New Listing</span>
            </Button>
          </div>

          {listings.length === 0 ? (
            /* Empty State */
            <Card variant="panel" padding="lg" className="text-center border-bg-700">
              <div className="mx-auto mb-4 w-16 h-16 rounded-xl bg-bg-800 border border-bg-700 flex items-center justify-center">
                <Sprout className="w-8 h-8 text-botanical-400" />
              </div>
              <h3 className="font-display text-lg font-semibold text-cream-50 mb-2">No harvest batches yet</h3>
              <p className="text-cream-400 mb-6 max-w-xs mx-auto">
                Create your first listing to connect directly with buyers. Use voice input for quick entry.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  variant="botanical" 
                  size="md" 
                  onClick={() => setShowCreateModal(true)}
                  className="w-full sm:w-auto gap-2"
                >
                  <Mic className="w-4 h-4" />
                  <span>Add with Voice</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="md" 
                  onClick={() => setShowCreateModal(true)}
                  className="w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Manual Entry</span>
                </Button>
              </div>
            </Card>
          ) : (
            /* Listings Grid */
            <div className="space-y-3 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4">
              {listings.map((item) => (
                <article 
                  key={item.id} 
                  className="group relative"
                  data-listing-id={item.id}
                >
                  <Card variant="panel" padding="none" className="overflow-hidden h-full transition-all duration-200 hover:shadow-xl hover:border-botanical-600 border-bg-700">
                    {/* Image Section - Larger, more prominent */}
                    <div className="relative aspect-[4/3] overflow-hidden bg-bg-750">
                      <ImageWithFallback
                        src={item.imageUrl}
                        alt={`${item.crop} - ${item.variety}`}
                        fallbackTitle={item.crop}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                        loading="lazy"
                      />
                      
                      {/* Grade badge - Top left, always visible */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5">
                        <Badge 
                          variant={getGradeVariant(item.quality.grade)} 
                          size="sm" 
                          className="shadow-lg bg-bg-850/95 border-bg-700 backdrop-blur-sm"
                          dot
                        >
                          Grade {item.quality.grade}
                          <span className="hidden sm:inline ml-1 text-[10px] font-medium opacity-80">
                            {getGradeLabel(item.quality.grade)}
                          </span>
                        </Badge>
                      </div>

                      {/* Status badge - Top right */}
                      <div className="absolute top-3 right-3">
                        <StatusBadge status={item.status} />
                      </div>

                      {/* Quality confidence indicator - Bottom left */}
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                        <div className="flex items-center gap-2 bg-bg-850/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-bg-700">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-teal-400" />
                            <span className="text-xs font-medium text-cream-300">
                              CNN: {item.quality.confidence}%
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-cream-500 font-mono">
                            <Hash className="w-3 h-3" />
                            {item.anonSellerId}
                          </div>
                        </div>
                        
                        {/* Actions - Always visible, not hover-only */}
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="bg-bg-850/95 hover:bg-bg-800 text-cream-400 hover:text-forest-300 shadow-lg rounded-lg border border-bg-700"
                            aria-label="View details"
                            onClick={(e) => { e.stopPropagation(); }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {item.status === 'active' && onUpdateListingStatus && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="bg-bg-850/95 hover:bg-bg-800 text-cream-400 hover:text-copper-300 shadow-lg rounded-lg border border-bg-700"
                              aria-label="Withdraw listing"
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                onUpdateListingStatus(item.id, 'withdrawn');
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Content Section */}
                    <CardContent className="p-4 space-y-4">
                      {/* Header: Crop + Variety + Listing ID */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-display text-base font-semibold text-cream-50 truncate">
                              {item.crop}
                            </h3>
                            <Badge variant="cream" size="xs" className="shrink-0">
                              {item.variety}
                            </Badge>
                            <Badge variant="default" size="xs" className="shrink-0 font-mono">
                              {item.id}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-cream-500">
                            <span className="flex items-center gap-1">
                              <Droplets className="w-3 h-3" />
                              {item.createdVia === 'voice' ? 'Voice Entry' : 'Manual Entry'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {item.createdAt}
                            </span>
                          </div>
                        </div>
                        
                        {/* Price - Prominent, right-aligned */}
                        <div className="text-right shrink-0 min-w-[100px]">
                          <p className="text-[10px] font-semibold text-cream-500 uppercase tracking-wider mb-0.5">
                            Expected Price
                          </p>
                          <p className="font-display text-xl font-bold text-harvest-300">
                            ₹{item.priceExpected}/kg
                          </p>
                        </div>
                      </div>

                      {/* Divider */}
                      <hr className="border-bg-700" />

                      {/* Metrics Grid - 2x2 layout */}
                      <div className="grid grid-cols-2 gap-3">
                        {/* Quantity */}
                        <div className="p-3 bg-bg-750 rounded-lg border border-bg-700">
                          <div className="flex items-center gap-2 mb-1">
                            <Scale className="w-4 h-4 text-botanical-400" />
                            <span className="text-xs font-semibold text-cream-500 uppercase tracking-wider">
                              Available
                            </span>
                          </div>
                          <p className="font-display text-lg font-bold text-cream-100">
                            {item.quantityKg.toLocaleString()} kg
                          </p>
                          <p className="text-xs text-cream-500">
                            {(item.quantityKg / 100).toFixed(1)} Quintals
                          </p>
                        </div>

                        {/* AI Price Range */}
                        <div className="p-3 bg-bg-750 rounded-lg border border-bg-700">
                          <div className="flex items-center gap-2 mb-1">
                            <Tag className="w-4 h-4 text-harvest-400" />
                            <span className="text-xs font-semibold text-cream-500 uppercase tracking-wider">
                              AI Range
                            </span>
                          </div>
                          <p className="font-medium text-cream-100 text-sm">
                            ₹{item.priceAi.min} – ₹{item.priceAi.max}/kg
                          </p>
                          <p className="text-xs text-cream-500">
                            Fair: ₹{item.priceAi.fair}/kg
                          </p>
                        </div>
                      </div>

{/* Quality Details Row */}
                      <div className="p-3 bg-botanical-900/30 rounded-lg border border-botanical-700">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <BadgeCheck className="w-4 h-4 text-botanical-400" />
                            <span className="text-xs font-semibold text-botanical-300 uppercase tracking-wider">
                              Quality Assessment
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-botanical-300">
                            <span className="flex items-center gap-1 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-botanical-400" />
                              Color: {item.quality.colorUniformity}%
                            </span>
                            <span className="flex items-center gap-1 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-botanical-400" />
                              Firm: {item.quality.firmnessScore}%
                            </span>
                            <span className="flex items-center gap-1 font-medium">
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                item.quality.surfaceDefects <= 8 ? 'bg-success-500' : 
                                item.quality.surfaceDefects <= 18 ? 'bg-warning-500' : 'bg-copper-500'
                              }`} />
                              Defects: {item.quality.surfaceDefects}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Footer: Location + Action */}
                      <div className="flex items-center justify-between pt-2 border-t border-bg-700">
                        <div className="flex items-center gap-2 text-xs text-cream-500">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{item.village}, {item.district}</span>
                        </div>
                        <span className="text-xs font-medium text-botanical-300 flex items-center gap-1">
                          <GripVertical className="w-3.5 h-3.5" />
                          {item.status === 'active' ? 'Active' : item.status}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </article>
              ))}
            </div>
          )}
        </div>
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
  // Now using shared functions from parent scope
  return null; // The main logic moved to parent
}

const STATUS_STEPS: OrderStatus[] = ['pending', 'confirmed', 'in_transit', 'delivered', 'settled'];
const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  settled: 'Settled',
  matched: 'Matched',
  disputed: 'Disputed',
};

const STATUS_ICONS: Record<OrderStatus, React.ReactNode> = {
  pending: <Clock className="w-4 h-4" />,
  confirmed: <CheckCircle className="w-4 h-4" />,
  in_transit: <Truck className="w-4 h-4" />,
  delivered: <PackageIcon className="w-4 h-4" />,
  settled: <BanknoteIcon2 className="w-4 h-4" />,
  matched: <GitBranch className="w-4 h-4" />,
  disputed: <AlertTriangle className="w-4 h-4" />,
};

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
  const getStatusIndex = (status: OrderStatus) => STATUS_STEPS.indexOf(status);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-teal-900/30 border border-teal-700 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold text-cream-50">Orders & Lifecycle</h2>
            <p className="text-sm text-cream-400">{orders.length} order{orders.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <span className="text-xs text-cream-500 font-medium sm:ml-auto">
          Identity reveals automatically upon confirmation
        </span>
      </div>

      {/* Empty State */}
      {orders.length === 0 ? (
        <Card variant="panel" padding="lg" className="text-center border-bg-700">
          <div className="mx-auto mb-4 w-16 h-16 rounded-xl bg-bg-800 border border-bg-700 flex items-center justify-center">
            <ClipboardList className="w-8 h-8 text-teal-400" />
          </div>
          <h3 className="font-display text-lg font-semibold text-cream-50 mb-2">No orders yet</h3>
          <p className="text-cream-400 mb-6 max-w-xs mx-auto">
            Orders will appear here once buyers commit to your listings. You'll see the full lifecycle from confirmation to settlement.
          </p>
        </Card>
      ) : (
        <div className="space-y-3.5" role="feed" aria-label="Order lifecycle">
          {orders.map((ord) => {
            const statusIdx = getStatusIndex(ord.status);
            const isRevealed = ord.identityRevealed;
            
            return (
              <OrderCard
                key={ord.id}
                order={ord}
                statusIdx={statusIdx}
                isRevealed={isRevealed}
                onUpdateOrderStatus={onUpdateOrderStatus}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function OrderCard({
  order,
  statusIdx,
  isRevealed,
  onUpdateOrderStatus,
}: {
  order: Order;
  statusIdx: number;
  isRevealed: boolean;
  onUpdateOrderStatus?: (orderId: string, status: string) => void;
}) {
  const STATUS_VARIANTS: Record<OrderStatus, 'success' | 'warning' | 'danger' | 'info' | 'default' | 'harvest' | 'botanical' | 'teal' | 'copper'> = {
    pending: 'warning',
    confirmed: 'info',
    in_transit: 'info',
    delivered: 'success',
    settled: 'success',
    matched: 'info',
    disputed: 'danger',
  };

  return (
    <Card variant="panel" padding="none" className="overflow-hidden border-bg-700">
      {/* Status Lifecycle Progress Bar */}
      <div className="relative h-1.5 bg-bg-700">
        <div 
          className="absolute top-0 left-0 h-full bg-teal-500 rounded-full transition-all duration-500"
          style={{ width: `${((statusIdx + 1) / STATUS_STEPS.length) * 100}%` }}
        />
        {STATUS_STEPS.map((step, idx) => (
          <span
            key={step}
            className={`absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 transition-all duration-300 ${
              idx <= statusIdx 
                ? 'bg-teal-500 border-teal-500' 
                : 'bg-bg-850 border-bg-700'
            }`}
            style={{ left: `${(idx / (STATUS_STEPS.length - 1)) * 100}%` }}
          >
            {idx === statusIdx && <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-bg-850" />}
          </span>
        ))}
      </div>

      {/* Order Content */}
      <CardContent className="p-4 sm:p-5 space-y-4">
        {/* Header Row: Order ID + Status + Reveal Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-mono text-sm font-semibold text-cream-100">#{order.id}</span>
            
            {/* Enhanced Status Badge with Icon */}
            <Badge 
              variant={STATUS_VARIANTS[order.status] || 'default'} 
              size="sm" 
              dot
              className="gap-1.5"
            >
              {STATUS_ICONS[order.status]}
              <span className="capitalize">{STATUS_LABELS[order.status] || order.status.replace(/_/g, ' ')}</span>
            </Badge>
            
            {isRevealed && (
              <Badge variant="botanical" size="sm" dot className="gap-1.5">
                <Unlock className="w-3 h-3" />
                Identity Revealed
              </Badge>
            )}
          </div>
          <span className="text-xs text-cream-500 font-medium whitespace-nowrap">
            <Calendar className="w-3.5 h-3.5 inline-block mr-1" />
            Created: {order.createdAt}
          </span>
        </div>

        {/* Main Details Grid - 3 columns on desktop, stacked on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Harvest Item Column */}
          <div className="p-3 bg-bg-750 rounded-lg border border-bg-700">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-4 h-4 text-botanical-400" />
              <span className="text-xs font-semibold text-cream-500 uppercase tracking-wider">Harvest Item</span>
            </div>
            <p className="font-semibold text-cream-100 text-sm">{order.crop} <span className="font-normal text-cream-500">({order.variety})</span></p>
            <p className="text-xs text-cream-500 mt-1 font-medium">
              {order.quantityKg.toLocaleString()} kg @ ₹{order.agreedPricePerKg}/kg
            </p>
          </div>

          {/* Settlement Amount Column */}
          <div className="p-3 bg-teal-900/30 rounded-lg border border-teal-700">
            <div className="flex items-center gap-2 mb-2">
              <BanknoteIcon className="w-4 h-4 text-teal-400" />
              <span className="text-xs font-semibold text-teal-300 uppercase tracking-wider">Total Settlement</span>
            </div>
            <p className="font-display text-xl font-bold text-teal-300">
              ₹{order.totalAmount.toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-teal-400 mt-1 font-medium">Direct Bank Transfer / AEPS</p>
            {order.settledAt && (
              <p className="text-xs text-teal-500 mt-1">
                Settled: {order.settledAt}
              </p>
            )}
          </div>

          {/* Buyer / Procurement Column */}
          <div className="p-3 bg-copper-900/30 rounded-lg border border-copper-700">
            <div className="flex items-center gap-2 mb-2">
              <UserCheck className="w-4 h-4 text-copper-400" />
              <span className="text-xs font-semibold text-copper-300 uppercase tracking-wider">Buyer / Procurement</span>
            </div>
            <p className="font-semibold text-cream-100 text-sm">{order.buyerName}</p>
            <p className="text-xs text-cream-500 font-medium">{order.buyerType}</p>
            
            {/* Identity Reveal State */}
            {isRevealed ? (
              <div className="mt-2 pt-2 border-t border-copper-700 space-y-1.5 animate-fade-in">
                <div className="flex items-center gap-1.5 text-xs text-copper-300 font-medium">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{order.buyerPhone}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-copper-300 font-medium">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{order.deliveryAddress}</span>
                </div>
              </div>
            ) : (
              <div className="mt-2 pt-2 border-t border-copper-700">
                <div className="flex items-center gap-1.5 text-xs text-cream-500">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Identity locked — reveals on confirmation</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Revealed Details Panel - Full width when identity is revealed */}
        {isRevealed && (
          <div className="p-3 bg-teal-900/30 border border-teal-700 rounded-lg space-y-1.5 animate-slide-down">
            <p className="font-semibold text-teal-100 flex items-center gap-1.5 text-sm">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              Trade Confirmed: Mutual Identity Unlocked
            </p>
            <p className="text-xs text-cream-400 leading-relaxed">
              Buyer delivery address: <span className="font-semibold text-cream-100">{order.deliveryAddress}</span>. 
              Logistics carrier handles farmgate dispatch.
            </p>
            {order.poolId && (
              <p className="text-xs text-teal-300 flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5" />
                <span>Assigned to logistics pool: <span className="font-mono font-semibold">{order.poolId}</span></span>
              </p>
            )}
          </div>
        )}

        {/* Actions - Contextual based on status */}
        {onUpdateOrderStatus && (
          <div className="pt-2 flex flex-col sm:flex-row sm:justify-end gap-2 border-t border-bg-700">
            {order.status === 'pending' && (
              <Button 
                variant="botanical" 
                size="sm" 
                onClick={() => onUpdateOrderStatus(order.id, 'confirmed')}
                className="gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Confirm Order & Reveal Identity</span>
              </Button>
            )}
            {order.status === 'confirmed' && (
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => onUpdateOrderStatus(order.id, 'in_transit')}
                className="gap-2"
              >
                <Truck className="w-4 h-4" />
                <span>Mark In Transit</span>
              </Button>
            )}
            {order.status === 'delivered' && (
              <Button 
                variant="harvest" 
                size="sm" 
                onClick={() => onUpdateOrderStatus(order.id, 'settled')}
                className="gap-2"
              >
                <DollarSign className="w-4 h-4" />
                <span>Mark Settled</span>
              </Button>
            )}
          </div>
        )}

        {/* Settlement/Payment Info for settled orders */}
        {order.status === 'settled' && (
          <div className="p-3 bg-forest-900/30 border border-forest-700 rounded-lg space-y-1.5">
            <p className="font-semibold text-forest-100 flex items-center gap-1.5 text-sm">
              <CheckCircle2 className="w-4 h-4 text-forest-400" />
              Payment Settled
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-cream-500">Amount Received</p>
                <p className="font-bold text-forest-300">₹{order.totalAmount.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <p className="text-cream-500">Settled On</p>
                <p className="font-semibold text-cream-100">{order.settledAt || 'N/A'}</p>
              </div>
            </div>
            {order.farmerRating && (
              <div className="flex items-center gap-1.5 text-xs text-harvest-400">
                <Star className="w-3.5 h-3.5 fill-harvest-400 text-harvest-400" />
                <span>Buyer rated you: {order.farmerRating}/5</span>
              </div>
            )}
          </div>
        )}

        {/* Disputed State */}
        {order.status === 'disputed' && (
          <div className="p-3 bg-copper-900/30 border border-copper-700 rounded-lg space-y-1.5">
            <p className="font-semibold text-copper-100 flex items-center gap-1.5 text-sm">
              <AlertTriangle className="w-4 h-4 text-copper-400" />
              Order Disputed
            </p>
            <p className="text-xs text-cream-400">This order has been flagged for review. Admin will investigate.</p>
          </div>
        )}
      </CardContent>
    </Card>
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
          <p className="text-xs text-cream-500 font-medium mt-0.5">Eligibility checked for: {farmer.state} · {farmer.landSizeAcres} Acres · {farmer.primaryCrops.join(', ')}</p>
        </div>
        <span className="text-xs font-bold text-forest-300 bg-forest-900/30 px-3 py-1 rounded-full border border-forest-700">
          {filteredSchemes.length} scheme{filteredSchemes.length !== 1 ? 's' : ''} matched
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {SCHEME_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSchemeCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border cursor-pointer ${
              schemeCategory === cat
                ? 'bg-forest-600 text-bg-950 border-forest-600 shadow-sm shadow-forest-600/20'
                : 'bg-bg-800 text-cream-300 border-bg-700 hover:border-forest-500 hover:text-forest-300 hover:bg-forest-900/20'
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
            <Card key={sch.id} variant="outlined" padding="md" className="space-y-3 flex flex-col justify-between hover border-bg-700">
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <Badge variant="info" size="sm">{sch.category}</Badge>
                  <Badge variant="success" size="sm">Eligible</Badge>
                </div>
                <CardTitle className="text-base">{sch.title}</CardTitle>
                <p className="text-cream-300 leading-relaxed text-xs sm:text-sm font-medium">{sch.description}</p>
                {sch.eligibilityReason && (
                  <div className="p-2.5 bg-forest-900/30 rounded-xl text-xs text-forest-100 border border-forest-700">
                    <span className="font-bold text-forest-300">Why you qualify: </span>{sch.eligibilityReason}
                  </div>
                )}
                <div className="p-2.5 bg-harvest-900/30 rounded-xl text-xs font-bold text-harvest-200 border border-harvest-700">Benefit: {sch.benefitAmount}</div>
              </div>

              <CardFooter className="text-xs text-cream-400 font-semibold">
                <span>Deadline: {sch.applicationDeadline}</span>
                <a href={sch.sourceUrl} target="_blank" rel="noreferrer" className="text-forest-300 hover:text-forest-100 font-bold flex items-center gap-1 ml-auto">
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
      <Card variant="outlined" padding="lg" className="space-y-4 border-bg-700">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <Badge variant="info" size="sm">AI Harvest Working Capital</Badge>
              <CardTitle className="text-xl mt-1">Pre-Harvest & Liquidity Advance</CardTitle>
              <p className="text-xs text-cream-500 font-medium mt-0.5">Automated risk scoring based on fulfillment history, APMC volatility index, and produce quality.</p>
            </div>
            <Button
              size="lg"
              variant="harvest"
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
            >
              <IndianRupee className="w-4 h-4" />
              <span>Simulate AEPS Cash-Out</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-bg-750 rounded-2xl border border-bg-700">
              <p className="text-xs text-cream-500 font-semibold uppercase tracking-wider">Eligible Advance</p>
              <p className="text-lg font-bold text-forest-300 mt-1">₹{riskAssessment.eligibleAdvanceAmount.toLocaleString('en-IN')}</p>
            </div>
            <div className="p-3.5 bg-bg-750 rounded-2xl border border-bg-700">
              <p className="text-xs text-cream-500 font-semibold uppercase tracking-wider">Risk Score</p>
              <p className="text-lg font-bold text-cream-100 mt-1">{riskAssessment.riskScore} / 100</p>
            </div>
            <div className="p-3.5 bg-bg-750 rounded-2xl border border-bg-700">
              <p className="text-xs text-cream-500 font-semibold uppercase tracking-wider">Fulfillment Rate</p>
              <p className="text-sm font-bold text-cream-100 mt-1">{riskAssessment.factors.fulfillmentRate}</p>
            </div>
            <div className="p-3.5 bg-bg-750 rounded-2xl border border-bg-700">
              <p className="text-xs text-cream-500 font-semibold uppercase tracking-wider">Reputation Score</p>
              <p className="text-sm font-bold text-harvest-300 mt-1 flex items-center gap-1">
                <Star className="w-4 h-4 fill-harvest-400 text-harvest-400" />
                <span>{riskAssessment.factors.reputationScore} / 5.0</span>
              </p>
            </div>
          </div>

          <div className="p-4 bg-teal-900/30 border border-teal-700 rounded-2xl text-xs text-teal-100 space-y-1">
            <p className="font-bold text-teal-100">AI Credit Model Explanation:</p>
            <p className="leading-relaxed text-cream-300 font-medium">{riskAssessment.explanation}</p>
          </div>

          {advances.length > 0 && (
            <div className="pt-4 border-t border-bg-700">
              <h4 className="font-bold text-cream-100 mb-3 text-sm">Working Capital Request History</h4>
              <div className="space-y-3">
                {advances.map((adv) => {
                  return (
                    <div key={adv.id} className="flex justify-between items-center p-3.5 rounded-2xl border border-bg-700 bg-bg-850 shadow-xs">
                      <div>
                        <p className="font-bold text-cream-100 text-sm">₹{adv.amountRequested.toLocaleString('en-IN')}</p>
                        <p className="text-xs text-cream-500 font-mono">Ref: {adv.aepsTxnRef || adv.id}</p>
                        {adv.purpose && <p className="text-[11px] text-cream-500 font-medium">{adv.purpose}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        {adv.status === 'requested' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onOpenAepsModal(adv.amountRequested, adv.id)}
                            className="text-xs border-forest-500 text-forest-300 hover:bg-forest-900/30 flex items-center gap-1 font-bold"
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
    <Card variant="subtle-copper" padding="lg" className="max-w-2xl mx-auto space-y-4 border-copper-700">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-copper-900/30 text-copper-300 rounded-2xl"><AlertTriangle className="w-6 h-6" /></div>
        <div>
          <CardTitle className="text-lg">{t.safety.title}</CardTitle>
          <p className="text-xs text-cream-500 font-medium">{t.safety.subheading}</p>
        </div>
      </div>

      <div className="p-3.5 bg-copper-900/30 border border-copper-700 rounded-2xl text-xs text-copper-100 space-y-1">
        <p className="font-bold flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-copper-400" />
          100% Guaranteed Confidentiality
        </p>
        <p className="text-cream-300 leading-relaxed font-medium">{t.safety.guarantee}</p>
      </div>

      {safetyError && (
        <div className="p-3 bg-copper-900/30 border border-copper-700 rounded-xl text-xs text-copper-100 flex items-center gap-2 font-semibold">
          <AlertCircle className="w-4 h-4 text-copper-400 shrink-0" />
          <span>{safetyError}</span>
        </div>
      )}

      {safetySubmitted ? (
        <div className="p-6 bg-forest-900/30 border border-forest-700 rounded-2xl text-center space-y-2">
          <CheckCircle2 className="w-10 h-10 text-forest-400 mx-auto" />
          <h4 className="font-bold text-sm text-forest-100">Report Submitted to Admin Moderation Queue</h4>
          <p className="text-xs text-cream-500">Your report has been logged without storing any identifying data.</p>
        </div>
      ) : (
        <form onSubmit={handleSafetySubmit} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block text-xs font-semibold text-cream-300 mb-1">Issue Category</label>
            <Select
              options={SAFETY_CATEGORIES.map(c => ({ value: c.value, label: c.label }))}
              value={safetyCategory}
              onChange={(e) => setSafetyCategory(e.target.value)}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-cream-300 mb-1">Name / Description of Entity Involved</label>
            <Input
              placeholder="e.g. Sub-agent at Pimpalgaon gate, Trader X"
              value={safetyEntity}
              onChange={(e) => setSafetyEntity(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-cream-300 mb-1">Describe what happened</label>
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
              className="w-4 h-4 text-copper-500 rounded-sm focus:ring-copper-500 cursor-pointer bg-bg-800 border-bg-700"
            />
            <label htmlFor="anonCheck" className="text-xs font-semibold text-cream-300 cursor-pointer">
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
          <div className="p-3 bg-copper-900/30 border border-copper-700 rounded-xl text-xs text-copper-100 flex items-center gap-2 font-semibold">
            <AlertCircle className="w-4 h-4 text-copper-400 shrink-0" />
            <span>{publishError}</span>
          </div>
        )}
        {/* Mic Record Banner */}
        <div className="p-4 bg-forest-900/30 rounded-2xl border border-forest-700 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="space-y-1">
            <p className="text-xs font-bold text-forest-100">
              {isRecording ? t.farmer.listening : t.farmer.tapToSpeak}
            </p>
            <p className="text-[11px] text-forest-300 font-semibold">{t.farmer.speakPrompt}</p>
            {speechTranscript && (
              <p className="text-xs font-mono font-bold text-cream-100 bg-bg-800 px-2.5 py-1 rounded-lg border border-forest-700 inline-block mt-1">
                "{speechTranscript}"
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleToggleRecording}
            className={`relative w-14 h-14 rounded-full flex items-center justify-center text-bg-950 shadow-lg transition-all cursor-pointer shrink-0 ${
              isRecording ? 'bg-copper-500 animate-pulse scale-105' : 'bg-forest-500 hover:bg-forest-400'
            }`}
          >
            {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            {isRecording && <span className="absolute inset-0 rounded-full border-4 border-copper-400 animate-ping" />}
          </button>
        </div>

        {/* Form Input Slots */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-cream-300 mb-1">Crop</label>
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
            <label className="block font-semibold text-cream-300 mb-1">Variety</label>
            <Input
              value={varietyInput}
              onChange={(e) => setVarietyInput(e.target.value)}
              className="w-full"
            />
          </div>

          <div>
            <label className="block font-semibold text-cream-300 mb-1">Quantity (kg)</label>
            <Input
              type="number"
              value={quantityInput}
              onChange={(e) => setQuantityInput(Number(e.target.value))}
              step={50}
              min={50}
              className="w-full"
            />
            <span className="text-[10px] text-cream-500 font-semibold mt-0.5 block">= {(quantityInput / 100).toFixed(1)} Quintal</span>
          </div>

          <div>
            <label className="block font-semibold text-cream-300 mb-1">Expected Price (₹/kg)</label>
            <Input
              type="number"
              value={priceInput}
              onChange={(e) => setPriceInput(Number(e.target.value))}
              step={0.5}
              min={5}
              className="w-full text-harvest-300 font-bold"
            />
          </div>
        </div>

        {/* Photo Upload & CNN Quality Assessment */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-cream-300">Produce Photo (for CNN Quality Assessment)</label>

          <div className="relative w-full h-36 rounded-xl overflow-hidden border border-bg-700 bg-bg-750">
            {selectedPhotoUrl && (
              <ImageWithFallback src={selectedPhotoUrl} alt="Produce photo" fallbackTitle={cropInput} className="w-full h-full object-cover" />
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
            <label htmlFor="photo-upload" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-forest-300 bg-forest-900/30 hover:bg-forest-900/50 border border-forest-700 rounded-xl cursor-pointer transition-colors">
              <Camera className="w-3.5 h-3.5" /> Upload Photo
            </label>
            <input id="photo-upload" type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoFileChange} />
            <span className="text-[11px] text-cream-500 font-medium">or choose demo photo:</span>
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
                      ? 'bg-forest-900/30 border-forest-500 shadow-sm'
                      : 'bg-bg-800 border-bg-700 hover:border-bg-600'
                  }`}
                >
                  <ImageWithFallback src={demo.url} alt={demo.label} fallbackTitle={demo.label} className="w-16 h-12 object-cover rounded-lg" loading="lazy" />
                  <span className="text-[10px] text-cream-300 font-bold">{demo.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* AI Price Recommendation Band */}
        {aiPriceBand && (
          <div className="p-3.5 bg-harvest-900/30 border border-harvest-700 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-harvest-100 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-harvest-400" />
                AI Price Band (Agmarknet Mandi Model)
              </span>
              <span className="font-bold text-harvest-300">{aiPriceBand.confidence}% Confidence</span>
            </div>

            <div className="flex items-center justify-between text-xs font-mono font-bold bg-bg-800 p-2 rounded-xl border border-harvest-700">
              <span className="text-cream-500">Min: ₹{aiPriceBand.min}/kg</span>
              <span className="text-harvest-300 text-sm">Fair: ₹{aiPriceBand.fair}/kg</span>
              <span className="text-cream-500">Max: ₹{aiPriceBand.max}/kg</span>
            </div>

            <p className="text-[11px] text-harvest-100 font-medium">Benchmark: {aiPriceBand.benchmarkMandi}. Wholesale prices are currently trending {aiPriceBand.trend}.</p>
          </div>
        )}

        {/* Quality Assessment */}
        {isAssessingQuality && (
          <div className="p-3.5 bg-bg-750 border border-bg-700 rounded-2xl space-y-2 animate-pulse">
            <div className="flex items-center gap-2 text-xs text-cream-500 font-bold">
              <Camera className="w-4 h-4 text-forest-400" />
              <span>MobileNet CNN analysing produce quality...</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {['Color', 'Firmness', 'Defects'].map(label => (
                <div key={label} className="bg-bg-700 h-8 rounded-lg" />
              ))}
            </div>
          </div>
        )}
        {!isAssessingQuality && qualityGrade && (
          <div className={`p-3.5 border rounded-2xl space-y-2 ${
            qualityGrade.grade === 'A' ? 'bg-forest-900/30 border-forest-700' :
            qualityGrade.grade === 'B' ? 'bg-harvest-900/30 border-harvest-700' :
            'bg-copper-900/30 border-copper-700'
          }`}>
            <div className="flex items-center justify-between text-xs">
              <span className={`font-bold flex items-center gap-1.5 ${qualityGrade.grade === 'A' ? 'text-forest-100' : qualityGrade.grade === 'B' ? 'text-harvest-100' : 'text-copper-100'}`}>
                <Camera className="w-4 h-4" />
                CNN Grade {qualityGrade.grade} — {qualityGrade.freshnessLabel}
              </span>
              <Badge variant={qualityGrade.grade === 'A' ? 'success' : qualityGrade.grade === 'B' ? 'warning' : 'danger'} size="sm">
                {qualityGrade.confidence}%
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-bg-800 p-1.5 rounded-lg border border-bg-700">
                <p className="text-[10px] text-cream-500 font-semibold">Color Uniformity</p>
                <p className="font-bold text-cream-100">{qualityGrade.colorUniformity}%</p>
              </div>
              <div className="bg-bg-800 p-1.5 rounded-lg border border-bg-700">
                <p className="text-[10px] text-cream-500 font-semibold">Firmness</p>
                <p className="font-bold text-cream-100">{qualityGrade.firmnessScore}%</p>
              </div>
              <div className="bg-bg-800 p-1.5 rounded-lg border border-bg-700">
                <p className="text-[10px] text-cream-500 font-semibold">Defect %</p>
                <p className={`font-bold ${qualityGrade.surfaceDefects <= 8 ? 'text-forest-300' : qualityGrade.surfaceDefects <= 18 ? 'text-harvest-300' : 'text-copper-300'}`}>{qualityGrade.surfaceDefects}%</p>
              </div>
            </div>

            <p className="text-[11px] text-cream-400 leading-relaxed font-medium">{qualityGrade.notes}</p>
          </div>
        )}

        {/* Anonymous Shield Notice */}
        <div className="p-3 bg-bg-750 border border-bg-700 rounded-xl text-[11px] text-cream-400 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-forest-400 mt-0.5 shrink-0" />
          <p>
            {t.farmer.anonShieldNotice} Your listing will be published under Anonymous ID <span className="font-mono font-bold text-cream-100">{farmer.anonSellerId}</span>.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-bg-700">
          <Button variant="secondary" onClick={onClose} disabled={isPublishing}>Cancel</Button>
          <Button variant="botanical" onClick={onPublish} disabled={isPublishing} loading={isPublishing}>
            Publish Anonymously
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default FarmerView;