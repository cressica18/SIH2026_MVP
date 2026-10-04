import React, { useState, useEffect, useCallback } from 'react';
import {
  CollectorProfile,
  ScrapLot,
  Language,
  QualityAssessment,
  PriceBand,
  LotStatus,
  SmartPool,
  PoolOffer,
} from '../types';
import { I18N_STRINGS } from '../data/i18n';
import { extractVoiceListing, getAiPriceRecommendation, assessMaterialQuality } from '../lib/api-client';
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
  Camera,
  Send,
  Eye,
  Phone,
  MapPin,
  X,
  ChevronRight,
  TrendingUp,
  FileText,
  Filter,
  Loader2,
  AlertCircle,
  ClipboardList,
  Fingerprint,
  Star,
  BadgeCheck,
  Scale,
  Tag,
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
  Factory,
  Cpu,
  HardDrive,
  Layers,
  Zap,
  Target,
  Award,
  Wallet,
  Flag,
  Recycle,
  Users,
  Link,
  Gavel,
  QrCode,
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

const MATERIAL_CATEGORIES = [
  { value: 'metal', label: 'Metal', icon: Factory },
  { value: 'plastic', label: 'Plastic', icon: Package },
  { value: 'paper', label: 'Paper', icon: FileText },
  { value: 'ewaste', label: 'E-Waste', icon: Cpu },
  { value: 'glass', label: 'Glass', icon: Layers },
  { value: 'rubber', label: 'Rubber', icon: RotateCcw },
  { value: 'mixed', label: 'Mixed', icon: GitBranch },
] as const;

const COMMON_MATERIALS: Record<string, string[]> = {
  metal: ['Copper Wire', 'Aluminum', 'Brass', 'Steel Scrap', 'Iron', 'Stainless Steel', 'Lead', 'Zinc'],
  plastic: ['HDPE', 'PET', 'PVC', 'PP', 'LDPE', 'PS', 'ABS', 'Mixed Plastic'],
  paper: ['Cardboard (OCC)', 'Newspaper', 'Office Paper', 'Magazines', 'Mixed Paper', 'Tetra Pak'],
  ewaste: ['PCB Boards', 'Cables', 'Batteries', 'Screens', 'Phones', 'Laptops', 'Components', 'Mixed E-Waste'],
  glass: ['Clear Glass', 'Green Glass', 'Brown Glass', 'Mixed Glass'],
  rubber: ['Tires', 'Rubber Sheets', 'Conveyor Belts', 'Mixed Rubber'],
  mixed: ['General Scrap', 'Household Mixed', 'Industrial Mixed', 'Construction Debris'],
};

interface CollectorViewProps {
  collector: CollectorProfile;
  lots: ScrapLot[];
  currentLanguage: Language;
  onAddLot: (lot: ScrapLot) => Promise<boolean>;
  onUpdateLotStatus?: (id: string, status: string) => void;
  initialTab?: string;
}

const COLLECTOR_TABS = [
  { id: 'pools', label: 'Smart Pools', icon: Users },
  { id: 'lots', label: 'My Lots', icon: Package },
  { id: 'safetyReport', label: 'Report', icon: Flag },
] as const;

type CollectorTabId = typeof COLLECTOR_TABS[number]['id'];

const SAFETY_CATEGORIES = [
  { value: 'Underpricing & Cartel', label: 'Recycler Cartel Underpricing / Collusion' },
  { value: 'Broker Exploitation', label: 'Middleman Extortion or Unauthorized Deductions' },
  { value: 'Harassment', label: 'Verbal or Physical Harassment' },
  { value: 'Payment Default', label: 'Delayed or Bounced Payment by Recycler' },
  { value: 'Transport Dispute', label: 'Transporter Overcharging or Refusing Pickup' },
];

const getGradeVariant = (grade: 'A' | 'B' | 'C') =>
  grade === 'A' ? 'botanical' : grade === 'B' ? 'olive' : 'copper';

const getGradeLabel = (grade: 'A' | 'B' | 'C') =>
  grade === 'A' ? 'Premium' : grade === 'B' ? 'Standard' : 'Basic';

const getCategoryIcon = (category: string) => {
  const cat = MATERIAL_CATEGORIES.find(c => c.value === category);
  return cat ? cat.icon : Recycle;
};

const getStatusColor = (status: LotStatus) => {
  switch (status) {
    case 'draft': return 'default';
    case 'available': return 'success';
    case 'pooled': return 'info';
    case 'sold': return 'botanical';
    default: return 'default';
  }
};

const getStatusLabel = (status: LotStatus) => {
  switch (status) {
    case 'draft': return 'Draft';
    case 'available': return 'Available';
    case 'pooled': return 'Pooled';
    case 'sold': return 'Sold';
    default: return status;
  }
};

export const CollectorView: React.FC<CollectorViewProps> = ({
  collector,
  lots,
  currentLanguage,
  onAddLot,
  onUpdateLotStatus,
  initialTab = 'pools',
}) => {
  const [activeTab, setActiveTab] = useState<CollectorTabId>((initialTab as CollectorTabId) || 'lots');
  const t = I18N_STRINGS[currentLanguage];

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState('');
  const [materialTypeInput, setMaterialTypeInput] = useState('Copper Wire');
  const [materialCategoryInput, setMaterialCategoryInput] = useState<'metal' | 'plastic' | 'paper' | 'ewaste' | 'glass' | 'rubber' | 'mixed'>('metal');
  const [estimatedWeightInput, setEstimatedWeightInput] = useState<number>(500);
  const [priceInput, setPriceInput] = useState<number>(620);
  const getDefaultCollectionDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  };

  const [collectionDateInput, setCollectionDateInput] = useState(getDefaultCollectionDate());
  const [notesInput, setNotesInput] = useState('');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [isAssessingQuality, setIsAssessingQuality] = useState(false);
  const [aiPriceBand, setAiPriceBand] = useState<PriceBand | null>(null);
  const [qualityGrade, setQualityGrade] = useState<QualityAssessment | null>(null);
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string>(
    'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=600&auto=format&fit=crop&q=80'
  );
  const [photoBase64, setPhotoBase64] = useState<string>('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  const [safetyCategory, setSafetyCategory] = useState<string>('Underpricing & Cartel');
  const [safetyEntity, setSafetyEntity] = useState<string>('');
  const [safetyDescription, setSafetyDescription] = useState<string>('');
  const [safetyAnonymous, setSafetyAnonymous] = useState<boolean>(true);
  const [safetySubmitted, setSafetySubmitted] = useState<boolean>(false);
  const [isSubmittingSafety, setIsSubmittingSafety] = useState<boolean>(false);

  const handleCollectorSubmitSafetyReport = async () => {
    if (!safetyDescription.trim()) return;
    setIsSubmittingSafety(true);
    try {
      const token = localStorage.getItem('kabadiwala_token');
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          category: safetyCategory,
          description: safetyDescription,
          isAnonymous: safetyAnonymous,
          reportedEntityName: safetyEntity || 'Local Recycler / Intermediary',
        }),
      });
      if (res.ok) {
        setSafetySubmitted(true);
        setSafetyDescription('');
        setSafetyEntity('');
      }
    } catch (err) {
      console.error('Failed to submit report', err);
    } finally {
      setIsSubmittingSafety(false);
    }
  };

  // Smart Pool state
  const [smartPools, setSmartPools] = useState<SmartPool[]>([]);
  const [poolOffers, setPoolOffers] = useState<PoolOffer[]>([]);
  const [selectedPool, setSelectedPool] = useState<SmartPool | null>(null);
  const [isLoadingPools, setIsLoadingPools] = useState(false);
  const [showPoolDetail, setShowPoolDetail] = useState(false);

  // Fetch smart pools on mount and when lots change
  useEffect(() => {
    fetchSmartPools();
  }, [collector.anonCollectorId]);

  const fetchSmartPools = async () => {
    setIsLoadingPools(true);
    try {
      const token = localStorage.getItem('kabadiwala_token');
      const res = await fetch('/api/smart-pools/collector/my-pools', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSmartPools(data.pools || []);
      }
    } catch (err) {
      console.error('Failed to fetch smart pools', err);
    } finally {
      setIsLoadingPools(false);
    }
  };

  const fetchPoolOffers = async (poolId: string) => {
    try {
      const token = localStorage.getItem('kabadiwala_token');
      const res = await fetch(`/api/smart-pools/${poolId}/offers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPoolOffers(data.offers || []);
      }
    } catch (err) {
      console.error('Failed to fetch pool offers', err);
    }
  };

  const handleJoinPool = async (lot: ScrapLot) => {
    try {
      const token = localStorage.getItem('kabadiwala_token');
      const res = await fetch('/api/smart-pools/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ poolId: lot.id, lotId: lot.id }),
      });
      if (res.ok) {
        await fetchSmartPools();
        setActiveTab('pools');
      }
    } catch (err) {
      console.error('Failed to join pool', err);
    }
  };

  const [poolActionError, setPoolActionError] = useState<string | null>(null);

  const handleCreatePool = async (lot: ScrapLot) => {
    setPoolActionError(null);
    try {
      const token = localStorage.getItem('kabadiwala_token');
      const res = await fetch('/api/smart-pools/create-from-lot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ lotId: lot.id }),
      });
      if (res.ok) {
        const pool = await res.json();
        setSmartPools(prev => [pool, ...prev]);
        setActiveTab('pools');
      } else {
        const err = await res.json();
        setPoolActionError(err.error || 'Could not create pool');
      }
    } catch (err) {
      console.error('Failed to create pool', err);
      setPoolActionError('An unexpected error occurred while creating the pool.');
    }
  };

  const handleRespondToOffer = async (offerId: string, action: 'accept' | 'reject') => {
    try {
      const token = localStorage.getItem('kabadiwala_token');
      const res = await fetch('/api/smart-pools/offers/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ offerId, action }),
      });
      if (res.ok) {
        await fetchSmartPools();
        if (selectedPool) {
          await fetchPoolOffers(selectedPool.id);
        }
      }
    } catch (err) {
      console.error('Failed to respond to offer', err);
    }
  };

  const handleLeavePool = async (poolId: string, lotId: string) => {
    try {
      const token = localStorage.getItem('kabadiwala_token');
      const res = await fetch('/api/smart-pools/leave', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ poolId, lotId }),
      });
      if (res.ok) {
        await fetchSmartPools();
      }
    } catch (err) {
      console.error('Failed to leave pool', err);
    }
  };

  useEffect(() => {
    const band = getAiPriceRecommendation(materialTypeInput, collector.district);
    setAiPriceBand(band);
  }, [materialTypeInput, collector.district]);

  useEffect(() => {
    setIsAssessingQuality(true);
    setQualityGrade(null);
    assessMaterialQuality(photoBase64 || selectedPhotoUrl, materialTypeInput)
      .then(setQualityGrade)
      .finally(() => setIsAssessingQuality(false));
  }, [selectedPhotoUrl, photoBase64, materialTypeInput]);

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
    setMaterialTypeInput(result.materialType);
    setEstimatedWeightInput(result.quantityKg);
    setPriceInput(result.priceExpectedPerKg);
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

  const handlePublishLot = async () => {
    if (!materialTypeInput || materialTypeInput.trim().length === 0) {
      setPublishError('Material type is required.');
      return;
    }
    const weight = Number(estimatedWeightInput);
    if (isNaN(weight) || weight <= 0) {
      setPublishError('Estimated weight must be a positive number.');
      return;
    }
    const price = Number(priceInput);
    if (isNaN(price) || price <= 0) {
      setPublishError('Expected price must be a positive number.');
      return;
    }
    if (!collectionDateInput) {
      setPublishError('Collection date is required.');
      return;
    }

    const dateParts = collectionDateInput.split('-');
    if (dateParts.length !== 3 || dateParts[0].length !== 4 || Number(dateParts[0]) < 2024 || isNaN(Date.parse(collectionDateInput))) {
      setPublishError('Please enter a valid collection date with a 4-digit year (YYYY-MM-DD).');
      return;
    }

    setIsPublishing(true);
    setPublishError(null);
    try {
      const newLot: ScrapLot = {
        id: `lot_${Date.now()}`,
        anonCollectorId: collector.anonCollectorId,
        collectorRealName: collector.name,
        collectorPhone: collector.phone,
        materialType: materialTypeInput.trim(),
        materialCategory: materialCategoryInput,
        estimatedWeightKg: weight,
        priceExpectedPerKg: price,
        priceAi: aiPriceBand || {
          min: Math.round(price * 0.9),
          fair: price,
          max: Math.round(price * 1.15),
          confidence: 90,
          historicalMarketAvg: Math.round(price * 0.95),
          trend: 'stable',
          benchmarkMarket: `${collector.district} Scrap Market`,
        },
        quality: qualityGrade || {
          grade: 'B',
          confidence: 88,
          colorUniformity: 85,
          surfaceDefects: 10,
          firmnessScore: 85,
          freshnessLabel: 'Standard scrap grade',
          notes: 'Quality assessed via AI Vision Analysis.',
        },
        imageUrl: selectedPhotoUrl,
        area: collector.area,
        district: collector.district,
        state: collector.state,
        lat: collector.lat,
        lng: collector.lng,
        collectionDate: collectionDateInput,
        notes: notesInput.trim() || undefined,
        status: 'available',
        createdVia: speechTranscript ? 'voice' : 'text',
        createdAt: 'Just now',
        collectorReputation: collector.reputationScore,
        distanceKm: 15,
        matchScore: 92,
      };

      const success = await onAddLot(newLot);
      if (success) {
        setShowCreateModal(false);
        setSpeechTranscript('');
        setMaterialTypeInput('Copper Wire');
        setMaterialCategoryInput('metal');
        setEstimatedWeightInput(500);
        setPriceInput(620);
        setCollectionDateInput(getDefaultCollectionDate());
        setNotesInput('');
        setPhotoBase64('');
        setSelectedPhotoUrl('https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=600&auto=format&fit=crop&q=80');
        setPublishError(null);
        setActiveTab('lots');
      } else {
        setPublishError('Failed to publish lot. Please check your connection and try again.');
      }
    } catch {
      setPublishError('An error occurred while publishing the lot.');
    } finally {
      setIsPublishing(false);
    }
  };

  const myLots = lots.filter((l) => l.anonCollectorId === collector.anonCollectorId);
  const availableLots = myLots.filter((l) => l.status === 'available');
  const draftLots = myLots.filter((l) => l.status === 'draft');
  const pooledLots = myLots.filter((l) => l.status === 'pooled');
  const soldLots = myLots.filter((l) => l.status === 'sold');

  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | LotStatus>('all');

  const filteredLots = myLots.filter((l) => {
    if (selectedStatusFilter === 'all') return true;
    return l.status === selectedStatusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Collector Profile Header */}
      <div className="relative bg-atmosphere-collector px-5 py-8 sm:px-8 sm:py-10 rounded-3xl border border-copper-800/40 overflow-hidden shadow-2xl mb-8">
        <div className="hero-field-viz" style={{ opacity: 0.3 }} />
        
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          <div className="md:col-span-2 space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="copper" size="sm" className="gap-1.5">
                <BadgeCheck className="w-3 h-3" />
                <span>Verified Collector</span>
              </Badge>
              <Badge variant="cream" size="sm" className="font-mono gap-1.5">
                <ShieldCheck className="w-3 h-3" />
                <span>Anon: {collector.anonCollectorId}</span>
              </Badge>
            </div>

            <div className="space-y-2">
              <h1 className="font-display text-2xl sm:text-3xl font-semibold text-cream-50 tracking-tight">
                {collector.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-cream-400">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-copper-400" />
                  <span className="font-medium text-cream-300">{collector.area}</span>
                  <span className="text-cream-600">·</span>
                  <span>{collector.district}</span>
                  <span className="text-cream-600">·</span>
                  <span>{collector.state}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-copper-400" />
                  <span className="font-medium text-cream-300">
                    {collector.vehicleType ? collector.vehicleType.charAt(0).toUpperCase() + collector.vehicleType.slice(1) : 'Vehicle'}
                  </span>
                  <span className="text-cream-600">·</span>
                  <span className="font-medium">{collector.collectionRadiusKm} km radius</span>
                  <span className="text-cream-600">·</span>
                  <span className="font-medium">{collector.primaryMaterials.slice(0, 2).join(', ')}</span>
                  {collector.primaryMaterials.length > 2 && (
                    <span className="text-cream-500">+{collector.primaryMaterials.length - 2} more</span>
                  )}
                </div>
              </div>
            </div>

            {/* Primary Actions - Prominent CTA Group */}
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <Button
                onClick={() => setShowCreateModal(true)}
                size="lg"
                variant="copper"
                className="flex-1 sm:flex-none gap-2"
              >
                <Plus className="w-5 h-5" />
                <span>Create Scrap Lot</span>
              </Button>
              <Button
                onClick={() => setActiveTab('pools')}
                size="lg"
                variant="outline"
                className="flex-1 sm:flex-none gap-2 border-copper-500 text-copper-300 hover:bg-copper-900/30"
              >
                <Users className="w-5 h-5" />
                <span>Join Smart Pool</span>
              </Button>
            </div>
          </div>

          <div className="hidden md:block">
            <div className="grid grid-cols-3 gap-3">
              <Card variant="subtle-copper" padding="md" className="text-center hover:shadow-lg transition-shadow border-copper-700">
                <div className="flex items-center justify-center gap-1.5 mb-2">
                  <Award className="w-5 h-5 text-harvest-400" />
                  <span className="text-xs font-semibold text-cream-500 uppercase tracking-wider">Trust Score</span>
                </div>
                <div className="flex items-center justify-center gap-1 text-2xl font-bold text-cream-50">
                  <Star className="w-6 h-6 fill-harvest-400 text-harvest-400" />
                  <span>{collector.reputationScore.toFixed(1)}</span>
                  <span className="text-lg font-normal text-cream-500">/ 5.0</span>
                </div>
                <p className="text-xs text-cream-500 mt-1">{collector.totalLotsSold} lots sold</p>
              </Card>

              <Card variant="subtle-copper" padding="md" className="text-center hover:shadow-lg transition-shadow border-harvest-700">
                <div className="flex items-center justify-center gap-1.5 mb-2">
                  <Banknote className="w-5 h-5 text-harvest-400" />
                  <span className="text-xs font-semibold text-cream-500 uppercase tracking-wider">Active Lots</span>
                </div>
                <p className="text-2xl font-bold text-harvest-300">{availableLots.length}</p>
                <p className="text-xs text-cream-500 mt-1">
                  {draftLots.length} draft · {pooledLots.length} pooled · {soldLots.length} sold
                </p>
              </Card>

              <Card variant="subtle-copper" padding="md" className="text-center hover:shadow-lg transition-shadow border-copper-700">
                <div className="flex items-center justify-center gap-1.5 mb-2">
                  <Users className="w-5 h-5 text-harvest-400" />
                  <span className="text-xs font-semibold text-cream-500 uppercase tracking-wider">Smart Pools</span>
                </div>
                <p className="text-2xl font-bold text-harvest-300">{smartPools.length}</p>
                <p className="text-xs text-cream-500 mt-1">
                  {smartPools.reduce((s, p) => s + p.totalWeightKg, 0).toLocaleString()} kg total
                </p>
              </Card>
            </div>

            <Card variant="panel" padding="md" className="mt-4 space-y-3 border-bg-700">
              <div className="flex items-center justify-between p-3 bg-bg-750 rounded-lg border border-bg-700">
                <div className="flex items-center gap-3">
                  <Recycle className="w-5 h-5 text-copper-400" />
                  <div>
                    <p className="text-xs text-cream-500 uppercase tracking-wider">Materials</p>
                    <p className="font-semibold text-cream-100">{collector.primaryMaterials.length} categories</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-cream-500 uppercase tracking-wider">Since</p>
                  <p className="font-semibold text-cream-100">Active</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="md:hidden mt-6 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Card variant="subtle-copper" padding="md" className="text-center border-copper-700">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Award className="w-4 h-4 text-harvest-400" />
                  <span className="text-xs font-semibold text-cream-500 uppercase tracking-wider">Trust Score</span>
                </div>
                <div className="flex items-center justify-center gap-1 text-xl font-bold text-cream-50">
                  <Star className="w-5 h-5 fill-harvest-400 text-harvest-400" />
                  <span>{collector.reputationScore.toFixed(1)}</span>
                  <span className="text-base font-normal text-cream-500">/ 5.0</span>
                </div>
                <p className="text-xs text-cream-500 mt-1">{collector.totalLotsSold} sold</p>
              </Card>

              <Card variant="subtle-copper" padding="md" className="text-center border-harvest-700">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Banknote className="w-4 h-4 text-harvest-400" />
                  <span className="text-xs font-semibold text-cream-500 uppercase tracking-wider">Active Lots</span>
                </div>
                <p className="text-xl font-bold text-harvest-300">{availableLots.length}</p>
                <Badge variant="success" size="xs" className="mt-1.5">
                  {draftLots.length} draft · {pooledLots.length} pooled
                </Badge>
              </Card>

              <Card variant="subtle-copper" padding="md" className="text-center border-copper-700">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Users className="w-4 h-4 text-harvest-400" />
                  <span className="text-xs font-semibold text-cream-500 uppercase tracking-wider">Smart Pools</span>
                </div>
                <p className="text-xl font-bold text-harvest-300">{smartPools.length}</p>
                <Badge variant="info" size="xs" className="mt-1.5">
                  {smartPools.reduce((s, p) => s + p.totalWeightKg, 0).toLocaleString()} kg
                </Badge>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav
        className="flex items-center gap-1 overflow-x-auto scrollbar-hidden border-b pb-0"
        style={{ borderColor: 'var(--color-bg-700)' }}
        role="tablist" aria-label="Collector portal sections"
      >
        {COLLECTOR_TABS.map((tab) => {
          let count = 0;
          if (tab.id === 'lots') count = myLots.length;
          else if (tab.id === 'pools') count = smartPools.length;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as CollectorTabId)}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              className={`
                relative flex items-center gap-2 px-4 py-3.5 text-sm font-medium
                transition-all duration-100 cursor-pointer whitespace-nowrap
                border-b-2 -mb-px
                ${isActive
                  ? 'text-copper-300 border-copper-400'
                  : 'text-cream-500 border-transparent hover:text-cream-200 hover:border-bg-600'
                }
              `}
            >
              <tab.icon className={`w-4 h-4 ${isActive ? 'text-copper-400' : 'text-cream-600'}`} aria-hidden="true" />
              <span>{t.nav[tab.id] || tab.label}</span>
              {count > 0 && (
                <span className={`px-1.5 py-px rounded text-[10px] font-bold font-mono ${
                  isActive
                    ? 'bg-copper-800/60 text-copper-200'
                    : 'bg-bg-750 text-cream-500'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* TAB: MY SCRAP LOTS */}
      {activeTab === 'lots' && (
        <div className="space-y-5" role="feed" aria-label="My scrap lots">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-copper-900/30 border border-copper-700 flex items-center justify-center">
                <Package className="w-5 h-5 text-copper-400" />
              </div>
              <div>
                <h2 className="font-display text-xl font-semibold text-cream-50">My Scrap Lots</h2>
                <p className="text-sm text-cream-400">{myLots.length} lot{myLots.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <Button 
              variant="copper" 
              size="sm" 
              onClick={() => setShowCreateModal(true)}
              className="sm:ml-auto"
            >
              <Plus className="w-4 h-4" />
              <span>New Lot</span>
            </Button>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by status">
            {[
              { status: 'all' as LotStatus | 'all', label: 'All', count: myLots.length },
              { status: 'draft', label: 'Draft', count: draftLots.length },
              { status: 'available', label: 'Available', count: availableLots.length },
              { status: 'pooled', label: 'Pooled', count: pooledLots.length },
              { status: 'sold', label: 'Sold', count: soldLots.length },
            ].map((filter) => (
              <button
                key={filter.status}
                onClick={() => setSelectedStatusFilter(filter.status as any)}
                role="tab"
                aria-selected={selectedStatusFilter === filter.status}
                className={`
                  px-3 py-1.5 rounded-lg text-xs font-medium
                  transition-all duration-100 cursor-pointer
                  border border-transparent
                  ${selectedStatusFilter === filter.status
                    ? 'bg-copper-900/40 text-copper-300 border-copper-700 font-semibold'
                    : 'bg-bg-800 text-cream-500 hover:text-cream-200 hover:bg-bg-750'
                  }
                `}
              >
                {filter.label}
                <span className="ml-1.5 px-1.5 py-px rounded text-[10px] font-bold font-mono bg-bg-900 text-cream-500">
                  {filter.count}
                </span>
              </button>
            ))}
          </div>

          {filteredLots.length === 0 ? (
            <Card variant="panel" padding="lg" className="text-center border-bg-700">
              <div className="mx-auto mb-4 w-16 h-16 rounded-xl bg-bg-800 border border-bg-700 flex items-center justify-center">
                <Recycle className="w-8 h-8 text-copper-400" />
              </div>
              <h3 className="font-display text-lg font-semibold text-cream-50 mb-2">No scrap lots yet</h3>
              <p className="text-cream-400 mb-6 max-w-xs mx-auto">
                Create your first scrap lot to connect directly with recyclers. Use voice input for quick entry.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  variant="copper" 
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
            <div className="space-y-3 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4">
              {filteredLots.map((item) => (
                <article 
                  key={item.id} 
                  className="group relative"
                  data-lot-id={item.id}
                >
                  <Card variant="panel" padding="none" className="overflow-hidden h-full transition-all duration-200 hover:shadow-xl hover:border-copper-600 border-bg-700">
                    <div className="relative aspect-[4/3] overflow-hidden bg-bg-750">
                      <ImageWithFallback
                        src={item.imageUrl}
                        alt={`${item.materialType} - ${item.materialCategory}`}
                        fallbackTitle={item.materialType}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                        loading="lazy"
                      />
                      
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

                      <div className="absolute top-3 right-3">
                        <StatusBadge status={item.status as any} />
                      </div>

                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                        <div className="flex items-center gap-2 bg-bg-850/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-bg-700">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-teal-400" />
                            <span className="text-xs font-medium text-cream-300">
                              AI Vision: {item.quality.confidence}%
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-cream-500 font-mono">
                            <Tag className="w-3 h-3" />
                            {item.anonCollectorId}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="bg-bg-850/95 hover:bg-bg-800 text-cream-400 hover:text-copper-300 shadow-lg rounded-lg border border-bg-700"
                            aria-label="View details"
                            onClick={(e) => { e.stopPropagation(); }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {item.status === 'available' && onUpdateLotStatus && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="bg-bg-850/95 hover:bg-bg-800 text-cream-400 hover:text-copper-300 shadow-lg rounded-lg border border-bg-700"
                              aria-label="Withdraw lot"
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                onUpdateLotStatus(item.id, 'draft');
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    <CardContent className="p-4 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-display text-base font-semibold text-cream-50 truncate">
                              {item.materialType}
                            </h3>
                            <Badge variant="copper" size="xs" className="shrink-0">
                              {item.materialCategory}
                            </Badge>
                            <Badge variant="default" size="xs" className="shrink-0 font-mono">
                              {item.id}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-cream-500">
                            <span className="flex items-center gap-1">
                              <Recycle className="w-3 h-3" />
                              {item.createdVia === 'voice' ? 'Voice Entry' : 'Manual Entry'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {item.createdAt}
                            </span>
                          </div>
                        </div>
                        
                        <div className="text-right shrink-0 min-w-[100px]">
                          <p className="text-[10px] font-semibold text-cream-500 uppercase tracking-wider mb-0.5">
                            Expected Price
                          </p>
                          <p className="font-display text-xl font-bold text-harvest-300">
                            ₹{item.priceExpectedPerKg}/kg
                          </p>
                        </div>
                      </div>

                      <hr className="border-bg-700" />

                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-bg-750 rounded-lg border border-bg-700">
                          <div className="flex items-center gap-2 mb-1">
                            <Scale className="w-4 h-4 text-copper-400" />
                            <span className="text-xs font-semibold text-cream-500 uppercase tracking-wider">
                              Est. Weight
                            </span>
                          </div>
                          <p className="font-display text-lg font-bold text-cream-100">
                            {item.estimatedWeightKg.toLocaleString()} kg
                          </p>
                        </div>

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

                      <div className="p-3 bg-copper-900/30 rounded-lg border border-copper-700">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <BadgeCheck className="w-4 h-4 text-copper-400" />
                            <span className="text-xs font-semibold text-copper-300 uppercase tracking-wider">
                              Quality Assessment
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-copper-300">
                            <span className="flex items-center gap-1 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-copper-400" />
                              Purity: {item.quality.colorUniformity}%
                            </span>
                            <span className="flex items-center gap-1 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-copper-400" />
                              Consistency: {item.quality.firmnessScore}%
                            </span>
                            <span className="flex items-center gap-1 font-medium">
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                item.quality.surfaceDefects <= 8 ? 'bg-success-500' : 
                                item.quality.surfaceDefects <= 18 ? 'bg-warning-500' : 'bg-copper-500'
                              }`} />
                              Contamination: {item.quality.surfaceDefects}%
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-bg-700">
                        <div className="flex items-center gap-2 text-xs text-cream-500">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{item.area}, {item.district}</span>
                        </div>
                        <span className="text-xs font-medium text-copper-300 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {item.collectionDate}
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


      {/* TAB: SMART POOLS */}
      {activeTab === 'pools' && (
        <SmartPoolsTab
          smartPools={smartPools}
          collector={collector}
          myLots={myLots}
          isLoading={isLoadingPools}
          t={t}
          poolActionError={poolActionError}
          onCreatePool={handleCreatePool}
          onJoinPool={handleJoinPool}
          onLeavePool={handleLeavePool}
          onViewPoolDetail={async (pool) => {
            setSelectedPool(pool);
            await fetchPoolOffers(pool.id);
            setShowPoolDetail(true);
          }}
          onRefresh={fetchSmartPools}
          setActiveTab={setActiveTab}
        />
      )}


      {/* TAB: SAFETY */}
      {activeTab === 'safetyReport' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-copper-900/30 border border-copper-700 flex items-center justify-center">
                <Flag className="w-5 h-5 text-copper-400" />
              </div>
              <div>
                <h2 className="font-display text-xl font-semibold text-cream-50">Report a Concern</h2>
                <p className="text-sm text-cream-400">100% Anonymous reporting for exploitation, cartel pricing, or harassment</p>
              </div>
            </div>
          </div>

          <Card variant="panel" padding="lg" className="border-bg-700 space-y-4 max-w-2xl">
            {safetySubmitted ? (
              <div className="p-6 bg-forest-950/30 border border-forest-700 rounded-xl text-center space-y-3">
                <ShieldCheck className="w-12 h-12 text-forest-400 mx-auto" />
                <h3 className="font-display text-lg font-semibold text-cream-50">Report Submitted Anonymously</h3>
                <p className="text-sm text-cream-300">
                  Thank you for keeping Kabadiwala Connect safe. Your report has been routed to the Admin moderation queue without logging your phone number or identity.
                </p>
                <Button variant="outline" size="sm" onClick={() => setSafetySubmitted(false)}>
                  Submit Another Report
                </Button>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); handleCollectorSubmitSafetyReport(); }} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-cream-300 uppercase tracking-wider mb-1">
                    Issue Category
                  </label>
                  <Select
                    value={safetyCategory}
                    onChange={(e) => setSafetyCategory(e.target.value)}
                    options={SAFETY_CATEGORIES}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-cream-300 uppercase tracking-wider mb-1">
                    Recycler / Yard / Entity Name (Optional)
                  </label>
                  <Input
                    value={safetyEntity}
                    onChange={(e) => setSafetyEntity(e.target.value)}
                    placeholder="e.g. Local Scrap Yard Intermediary"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-cream-300 uppercase tracking-wider mb-1">
                    Describe the Issue <span className="text-copper-400">*</span>
                  </label>
                  <Textarea
                    required
                    value={safetyDescription}
                    onChange={(e) => setSafetyDescription(e.target.value)}
                    placeholder="Provide details about forced underpricing, cartel collusion, or harassment..."
                    rows={4}
                    className="w-full"
                  />
                </div>

                <div className="p-3 bg-forest-950/30 border border-forest-800 rounded-lg flex items-center justify-between text-xs text-forest-300">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-forest-400 shrink-0" />
                    <span>Your phone number and name are 100% hidden.</span>
                  </div>
                  <label className="flex items-center gap-2 font-semibold cursor-pointer text-cream-200">
                    <input
                      type="checkbox"
                      checked={safetyAnonymous}
                      onChange={(e) => setSafetyAnonymous(e.target.checked)}
                      className="rounded bg-bg-800 border-bg-600 text-copper-500"
                    />
                    Submit Anonymously
                  </label>
                </div>

                <Button
                  type="submit"
                  variant="copper"
                  size="lg"
                  loading={isSubmittingSafety}
                  disabled={!safetyDescription.trim()}
                  className="w-full gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit Safety Report</span>
                </Button>
              </form>
            )}
          </Card>
        </div>
      )}

      {/* POOL DETAIL & OFFERS MODAL */}
      {selectedPool && (
        <Modal
          isOpen={showPoolDetail}
          onClose={() => setShowPoolDetail(false)}
          size="lg"
          title={`Smart Pool ${selectedPool.id} — ${selectedPool.materialType}`}
        >
          <div className="space-y-6 p-4 sm:p-6 max-h-[80vh] overflow-y-auto">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-bg-750 rounded-lg border border-bg-700">
                <p className="text-[10px] text-cream-500 uppercase">Status</p>
                <p className="font-bold text-copper-300 capitalize">{selectedPool.status}</p>
              </div>
              <div className="p-3 bg-bg-750 rounded-lg border border-bg-700">
                <p className="text-[10px] text-cream-500 uppercase">Members</p>
                <p className="font-bold text-cream-100">{selectedPool.members.length}</p>
              </div>
              <div className="p-3 bg-bg-750 rounded-lg border border-bg-700">
                <p className="text-[10px] text-cream-500 uppercase">Total Weight</p>
                <p className="font-bold text-cream-100">{selectedPool.totalWeightKg} kg</p>
              </div>
              <div className="p-3 bg-bg-750 rounded-lg border border-bg-700">
                <p className="text-[10px] text-cream-500 uppercase">Avg Price</p>
                <p className="font-bold text-harvest-300">₹{selectedPool.avgPricePerKg}/kg</p>
              </div>
            </div>

            {/* Handover & Settlement section if confirmed */}
            {selectedPool.status === 'confirmed' && (
              <Card variant="panel" padding="md" className="border-success-700 bg-success-950/20">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-success-400" />
                  <h4 className="font-display font-semibold text-cream-50">Match Confirmed with Recycler</h4>
                </div>
                <p className="text-sm text-cream-300 mb-3">
                  Recycler: <span className="font-semibold text-harvest-300">{selectedPool.recyclerName}</span> @ ₹{selectedPool.agreedPricePerKg}/kg
                </p>
                <div className="p-3 bg-bg-900 rounded-lg border border-bg-700 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-cream-500 uppercase font-mono">Handover Reference Code</p>
                    <p className="text-xl font-bold font-mono text-copper-300">{selectedPool.handoverRef || 'KCP-1-AB3F-XYZ7'}</p>
                  </div>
                  <Badge variant="success" size="md" className="gap-1">
                    <QrCode className="w-4 h-4" /> Ready for Pickup
                  </Badge>
                </div>
              </Card>
            )}

            {/* Offers List */}
            <div className="space-y-3">
              <h4 className="font-display font-semibold text-cream-50 flex items-center justify-between">
                <span>Received Recycler Offers ({poolOffers.length})</span>
                <Button variant="ghost" size="xs" onClick={() => fetchPoolOffers(selectedPool.id)} className="gap-1 text-copper-300">
                  <RotateCcw className="w-3.5 h-3.5" /> Refresh
                </Button>
              </h4>

              {poolOffers.length === 0 ? (
                <p className="text-sm text-cream-500 italic py-4 text-center bg-bg-800 rounded-lg">
                  No offers received from recyclers yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {poolOffers.map(offer => (
                    <div key={offer.id} className="p-4 bg-bg-800 rounded-xl border border-bg-700 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-cream-100">{offer.recyclerName}</p>
                          <p className="text-xs text-cream-500">{offer.createdAt}</p>
                        </div>
                        <Badge variant={offer.status === 'accepted' ? 'success' : offer.status === 'rejected' ? 'danger' : 'warning'}>
                          {offer.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm bg-bg-850 p-2.5 rounded-lg">
                        <div>
                          <span className="text-xs text-cream-500 block">Offered Rate</span>
                          <span className="font-bold text-harvest-300">₹{offer.offeredPricePerKg}/kg</span>
                        </div>
                        <div>
                          <span className="text-xs text-cream-500 block">Total Lot Value</span>
                          <span className="font-bold text-cream-100">₹{offer.totalValue.toLocaleString()}</span>
                        </div>
                      </div>

                      {offer.notes && (
                        <p className="text-xs text-cream-400 italic bg-bg-850 p-2 rounded">
                          "{offer.notes}"
                        </p>
                      )}

                      {offer.status === 'pending' && (
                        <div className="flex gap-2 pt-1">
                          <Button
                            variant="copper"
                            size="sm"
                            className="flex-1 gap-1"
                            onClick={() => handleRespondToOffer(offer.id, 'accept')}
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>Accept Offer</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 gap-1"
                            onClick={() => handleRespondToOffer(offer.id, 'reject')}
                          >
                            <X className="w-4 h-4" />
                            <span>Reject</span>
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-bg-700">
              <Button variant="outline" onClick={() => setShowPoolDetail(false)} className="w-full">
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* CREATE LOT MODAL */}
      <CreateLotModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setPublishError(null);
        }}
        collector={collector}
        currentLanguage={currentLanguage}
        t={t}
        speechTranscript={speechTranscript}
        setSpeechTranscript={setSpeechTranscript}
        materialTypeInput={materialTypeInput}
        setMaterialTypeInput={setMaterialTypeInput}
        materialCategoryInput={materialCategoryInput}
        setMaterialCategoryInput={setMaterialCategoryInput}
        estimatedWeightInput={estimatedWeightInput}
        setEstimatedWeightInput={setEstimatedWeightInput}
        priceInput={priceInput}
        setPriceInput={setPriceInput}
        collectionDateInput={collectionDateInput}
        setCollectionDateInput={setCollectionDateInput}
        notesInput={notesInput}
        setNotesInput={setNotesInput}
        isProcessingAI={isProcessingAI}
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
        onPublish={handlePublishLot}
      />
    </div>
  );
};

function CreateLotModal({
  isOpen,
  onClose,
  collector,
  currentLanguage,
  t,
  speechTranscript,
  setSpeechTranscript,
  materialTypeInput,
  setMaterialTypeInput,
  materialCategoryInput,
  setMaterialCategoryInput,
  estimatedWeightInput,
  setEstimatedWeightInput,
  priceInput,
  setPriceInput,
  collectionDateInput,
  setCollectionDateInput,
  notesInput,
  setNotesInput,
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
  collector: CollectorProfile;
  currentLanguage: Language;
  t: any;
  speechTranscript: string;
  setSpeechTranscript: (v: string) => void;
  materialTypeInput: string;
  setMaterialTypeInput: (v: string) => void;
  materialCategoryInput: 'metal' | 'plastic' | 'paper' | 'ewaste' | 'glass' | 'rubber' | 'mixed';
  setMaterialCategoryInput: (v: 'metal' | 'plastic' | 'paper' | 'ewaste' | 'glass' | 'rubber' | 'mixed') => void;
  estimatedWeightInput: number;
  setEstimatedWeightInput: (v: number) => void;
  priceInput: number;
  setPriceInput: (v: number) => void;
  collectionDateInput: string;
  setCollectionDateInput: (v: string) => void;
  notesInput: string;
  setNotesInput: (v: string) => void;
  isProcessingAI: boolean;
  isAssessingQuality: boolean;
  aiPriceBand: PriceBand | null;
  qualityGrade: QualityAssessment | null;
  selectedPhotoUrl: string;
  setSelectedPhotoUrl: (v: string) => void;
  photoBase64: string;
  setPhotoBase64: (v: string) => void;
  handlePhotoFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isRecording: boolean;
  handleToggleRecording: () => void;
  isPublishing: boolean;
  publishError: string | null;
  onPublish: () => void;
}) {
  const today = new Date().toISOString().split('T')[0];

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="full" title={t.collector.createLot}>
      <div className="space-y-6 p-4 sm:p-6 max-h-[85vh] overflow-y-auto">
        {/* Voice Input Section */}
        <Card variant="panel" padding="lg" className="border-copper-700 bg-copper-900/20">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isRecording ? 'bg-copper-500 animate-pulse' : 'bg-copper-900/30 border border-copper-700'
            }`}>
              <button
                onClick={handleToggleRecording}
                className="w-8 h-8 rounded-full flex items-center justify-center text-cream-50 transition-colors"
                aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
              >
                {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            </div>
            <div className="flex-1">
              <h3 className="font-display text-lg font-semibold text-cream-50">
                {isRecording ? t.collector.listening : t.collector.tapToSpeak}
              </h3>
              <p className="text-sm text-cream-400">{t.collector.speakPrompt}</p>
            </div>
            {isProcessingAI && (
              <Loader2 className="w-6 h-6 text-copper-400 animate-spin" />
            )}
          </div>
          
          {speechTranscript && (
            <div className="p-3 bg-bg-750 rounded-lg border border-bg-700">
              <p className="text-sm text-cream-300 italic">"{speechTranscript}"</p>
            </div>
          )}
        </Card>

        {/* Form Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Material Type */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-cream-300 mb-2">
              {t.collector.materialType} <span className="text-copper-400">*</span>
            </label>
            <Input
              value={materialTypeInput}
              onChange={(e) => setMaterialTypeInput(e.target.value)}
              placeholder={t.collector.materialType}
              className="w-full"
            />
          </div>

          {/* Material Category */}
          <div>
            <label className="block text-sm font-medium text-cream-300 mb-2">
              {t.collector.materialCategory} <span className="text-copper-400">*</span>
            </label>
            <Select
              value={materialCategoryInput}
              onChange={(e) => setMaterialCategoryInput(e.target.value as any)}
              options={MATERIAL_CATEGORIES.map(c => ({ value: c.value, label: c.label }))}
              className="w-full"
            />
          </div>

          {/* Estimated Weight */}
          <div>
            <label className="block text-sm font-medium text-cream-300 mb-2">
              {t.collector.estimatedWeight} <span className="text-copper-400">*</span>
            </label>
            <Input
              type="number"
              value={estimatedWeightInput}
              onChange={(e) => setEstimatedWeightInput(Number(e.target.value) || 0)}
              placeholder="500"
              className="w-full"
            />
          </div>

          {/* Expected Price */}
          <div>
            <label className="block text-sm font-medium text-cream-300 mb-2">
              {t.collector.expectedPrice} <span className="text-copper-400">*</span>
            </label>
            <Input
              type="number"
              value={priceInput}
              onChange={(e) => setPriceInput(Number(e.target.value) || 0)}
              placeholder="620"
              className="w-full"
            />
          </div>

          {/* Collection Date */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-cream-300 mb-2">
              Collection Date <span className="text-copper-400">*</span>
            </label>
            <Input
              type="date"
              value={collectionDateInput}
              onChange={(e) => setCollectionDateInput(e.target.value)}
              min={today}
              className="w-full"
            />
          </div>

          {/* Notes */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-cream-300 mb-2">
              Notes (Optional)
            </label>
            <Textarea
              value={notesInput}
              onChange={(e) => setNotesInput(e.target.value)}
              placeholder="e.g., Collected from demolition site, clean and sorted"
              rows={2}
              className="w-full"
            />
          </div>
        </div>

        {/* Photo Upload */}
        <div>
          <label className="block text-sm font-medium text-cream-300 mb-2">
            Lot Photo
          </label>
          <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-bg-750 border border-bg-700">
            <ImageWithFallback
              src={selectedPhotoUrl}
              alt="Lot preview"
              fallbackTitle={materialTypeInput}
              className="w-full h-full object-cover"
            />
            <label className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoFileChange}
                className="sr-only"
              />
              <div className="flex items-center justify-center gap-2 text-cream-50">
                <Camera className="w-5 h-5" />
                <span className="text-sm font-medium">Tap to change photo</span>
              </div>
            </label>
          </div>
        </div>

        {/* AI Price Band */}
        {aiPriceBand && (
          <Card variant="panel" padding="md" className="border-harvest-700 bg-harvest-900/20">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-harvest-400" />
              <span className="text-xs font-semibold text-harvest-300 uppercase tracking-wider">{t.collector.aiPriceBand}</span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-2 bg-bg-800 rounded-lg">
                <p className="text-[10px] text-cream-500 uppercase">Min</p>
                <p className="font-bold text-cream-100">₹{aiPriceBand.min}/kg</p>
              </div>
              <div className="p-2 bg-bg-800 rounded-lg">
                <p className="text-[10px] text-cream-500 uppercase">Fair</p>
                <p className="font-bold text-harvest-300">₹{aiPriceBand.fair}/kg</p>
              </div>
              <div className="p-2 bg-bg-800 rounded-lg">
                <p className="text-[10px] text-cream-500 uppercase">Max</p>
                <p className="font-bold text-cream-100">₹{aiPriceBand.max}/kg</p>
              </div>
            </div>
            <p className="text-xs text-cream-500 mt-2 text-center">
              Benchmark: {aiPriceBand.benchmarkMarket} · Trend: {aiPriceBand.trend}
            </p>
          </Card>
        )}

        {/* AI Quality Scan */}
        {qualityGrade && (
          <Card variant="panel" padding="md" className="border-teal-700 bg-teal-900/20">
            <div className="flex items-center gap-2 mb-2">
              <BadgeCheck className="w-4 h-4 text-teal-400" />
              <span className="text-xs font-semibold text-teal-300 uppercase tracking-wider">{t.collector.aiQualityScan}</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-cream-300">Predicted Grade</p>
                <p className="font-display text-2xl font-bold text-teal-300">Grade {qualityGrade.grade}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-cream-500">Confidence</p>
                <p className="font-bold text-cream-100">{qualityGrade.confidence}%</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3 text-xs text-cream-400">
              <div>Purity: {qualityGrade.colorUniformity}%</div>
              <div>Consistency: {qualityGrade.firmnessScore}%</div>
              <div>Contamination: {qualityGrade.surfaceDefects}%</div>
            </div>
          </Card>
        )}

        {isAssessingQuality && !qualityGrade && (
          <Card variant="panel" padding="md" className="border-teal-700 bg-teal-900/20">
            <div className="flex items-center gap-2">
              <LoaderCircle className="w-4 h-4 text-teal-400 animate-spin" />
              <span className="text-sm text-teal-300">Assessing material quality...</span>
            </div>
          </Card>
        )}

        {/* Anonymity Notice */}
        <Card variant="panel" padding="md" className="border-forest-700 bg-forest-900/20">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-4 h-4 text-forest-400" />
            <span className="text-xs font-semibold text-forest-300 uppercase tracking-wider">{t.collector.publishAnon}</span>
          </div>
          <p className="text-xs text-cream-400">{t.collector.anonShieldNotice}</p>
        </Card>

        {publishError && (
          <div className="p-3 bg-copper-900/30 border border-copper-700 rounded-lg text-copper-300 text-sm">
            {publishError}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-bg-700">
          <Button
            variant="outline"
            size="lg"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="copper"
            size="lg"
            onClick={onPublish}
            disabled={isPublishing}
            className="flex-1 gap-2"
          >
            {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>{isPublishing ? 'Creating...' : 'Create Lot & Sell Now'}</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function SmartPoolsTab({
  smartPools,
  collector,
  myLots,
  isLoading,
  t,
  poolActionError,
  onCreatePool,
  onJoinPool,
  onLeavePool,
  onViewPoolDetail,
  onRefresh,
  setActiveTab,
}: {
  smartPools: SmartPool[];
  collector: CollectorProfile;
  myLots: ScrapLot[];
  isLoading: boolean;
  t: any;
  poolActionError?: string | null;
  onCreatePool: (lot: ScrapLot) => void;
  onJoinPool: (lot: ScrapLot) => void;
  onLeavePool: (poolId: string, lotId: string) => void;
  onViewPoolDetail: (pool: SmartPool) => void;
  onRefresh: () => void;
  setActiveTab: (tab: CollectorTabId) => void;
}) {
  const availableLots = myLots.filter(l => l.status === 'available');
  const pooledLots = myLots.filter(l => l.status === 'pooled');

  const getStatusColor = (status: SmartPool['status']) => {
    switch (status) {
      case 'forming': return 'default';
      case 'open': return 'info';
      case 'matched': return 'warning';
      case 'confirmed': return 'success';
      case 'in_transit': return 'info';
      case 'completed': return 'botanical';
      case 'cancelled': return 'danger';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: SmartPool['status']) => {
    switch (status) {
      case 'forming': return 'Forming';
      case 'open': return 'Open for Bids';
      case 'matched': return 'Matched';
      case 'confirmed': return 'Confirmed';
      case 'in_transit': return 'In Transit';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-copper-400 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-copper-900/30 border border-copper-700 flex items-center justify-center">
            <Users className="w-5 h-5 text-copper-400" />
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold text-cream-50">Verified Smart Lot Pools</h2>
            <p className="text-sm text-cream-400">Pool compatible lots for better prices and consolidated pickup</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh} className="sm:ml-auto gap-1">
          <RotateCcw className="w-4 h-4" />
          <span>Refresh</span>
        </Button>
      </div>

      {poolActionError && (
        <div className="p-3 bg-copper-900/40 border border-copper-700 rounded-lg text-copper-300 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-copper-400" />
          <span>{poolActionError}</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card variant="subtle-copper" padding="md" className="text-center border-copper-700">
          <p className="text-xs text-cream-500 uppercase tracking-wider">My Pools</p>
          <p className="font-display text-2xl font-bold text-harvest-300">{smartPools.length}</p>
        </Card>
        <Card variant="subtle-copper" padding="md" className="text-center border-harvest-700">
          <p className="text-xs text-cream-500 uppercase tracking-wider">Total Weight</p>
          <p className="font-display text-2xl font-bold text-harvest-300">
            {smartPools.reduce((sum, p) => sum + p.totalWeightKg, 0).toLocaleString()} kg
          </p>
        </Card>
        <Card variant="subtle-copper" padding="md" className="text-center border-copper-700">
          <p className="text-xs text-cream-500 uppercase tracking-wider">Available to Pool</p>
          <p className="font-display text-2xl font-bold text-harvest-300">{availableLots.length}</p>
        </Card>
      </div>

      {/* Available Lots that can join pools */}
      {availableLots.length > 0 && (
        <Card variant="panel" padding="lg" className="border-bg-700">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-harvest-400" />
            <h3 className="font-display text-lg font-semibold text-cream-50">Lots Ready to Pool</h3>
          </div>
          <p className="text-sm text-cream-400 mb-4">
            These available lots can be pooled with compatible nearby lots for better prices.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {availableLots.map(lot => (
              <div key={lot.id} className="p-3 bg-bg-750 rounded-lg border border-bg-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-cream-100 truncate">{lot.materialType}</span>
                  <Badge variant={getGradeVariant(lot.quality.grade)} size="xs">Grade {lot.quality.grade}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-cream-400 mb-3">
                  <div><span className="font-medium">Weight:</span> {lot.estimatedWeightKg} kg</div>
                  <div><span className="font-medium">Price:</span> ₹{lot.priceExpectedPerKg}/kg</div>
                  <div><span className="font-medium">Area:</span> {lot.area}</div>
                  <div><span className="font-medium">Collect by:</span> {lot.collectionDate}</div>
                </div>
                <Button
                  variant="copper"
                  size="sm"
                  className="w-full gap-1"
                  onClick={() => onCreatePool(lot)}
                >
                  <Link className="w-4 h-4" />
                  <span>Create / Join Pool</span>
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Smart Pools List */}
      {smartPools.length === 0 && availableLots.length === 0 ? (
        <Card variant="panel" padding="lg" className="text-center border-bg-700">
          <div className="mx-auto mb-4 w-16 h-16 rounded-xl bg-bg-800 border border-bg-700 flex items-center justify-center">
            <Users className="w-8 h-8 text-copper-400" />
          </div>
          <h3 className="font-display text-lg font-semibold text-cream-50 mb-2">No smart pools yet</h3>
          <p className="text-cream-400 mb-6 max-w-xs mx-auto">
            Create a smart pool by selecting an available lot, or wait for compatible lots to appear.
          </p>
          <Button variant="copper" onClick={() => setActiveTab('lots')} className="gap-2">
            <Plus className="w-4 h-4" />
            <span>Create New Lot</span>
          </Button>
        </Card>
      ) : smartPools.length > 0 && (
        <div className="space-y-3" role="feed" aria-label="Smart pools">
          {smartPools.map(pool => (
            <article key={pool.id} className="group relative">
              <Card variant="panel" padding="none" className="overflow-hidden transition-all duration-200 hover:shadow-xl hover:border-copper-600 border-bg-700">
                <CardContent className="p-4 sm:p-5 space-y-4">
                  {/* Pool Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-copper-900/30 border border-copper-700 flex items-center justify-center">
                        <Recycle className="w-6 h-6 text-copper-400" />
                      </div>
                      <div>
                        <h3 className="font-display text-base font-semibold text-cream-50 truncate">
                          {pool.materialType} Pool
                        </h3>
                        <p className="text-xs text-cream-500 font-mono">{pool.id}</p>
                      </div>
                    </div>
                    <Badge variant={getStatusColor(pool.status)} size="sm" dot className="shrink-0">
                      {getStatusLabel(pool.status)}
                    </Badge>
                  </div>

                  {/* Pool Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-bg-750 rounded-lg border border-bg-700 text-center">
                      <p className="text-[10px] text-cream-500 uppercase tracking-wider">Members</p>
                      <p className="font-display text-xl font-bold text-cream-100">{pool.members.length}</p>
                    </div>
                    <div className="p-3 bg-bg-750 rounded-lg border border-bg-700 text-center">
                      <p className="text-[10px] text-cream-500 uppercase tracking-wider">Total Weight</p>
                      <p className="font-display text-xl font-bold text-cream-100">{pool.totalWeightKg.toLocaleString()} kg</p>
                    </div>
                    <div className="p-3 bg-bg-750 rounded-lg border border-bg-700 text-center">
                      <p className="text-[10px] text-cream-500 uppercase tracking-wider">Avg Price</p>
                      <p className="font-display text-xl font-bold text-harvest-300">₹{pool.avgPricePerKg}/kg</p>
                    </div>
                    <div className="p-3 bg-bg-750 rounded-lg border border-bg-700 text-center">
                      <p className="text-[10px] text-cream-500 uppercase tracking-wider">Est. Value</p>
                      <p className="font-display text-xl font-bold text-harvest-300">₹{pool.totalValue?.toLocaleString() || (pool.totalWeightKg * pool.avgPricePerKg).toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Members */}
                  <div className="p-3 bg-copper-900/20 rounded-lg border border-copper-700/30">
                    <p className="text-xs font-semibold text-copper-300 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      Pool Members ({pool.members.length})
                    </p>
                    <div className="space-y-1">
                      {pool.members.map((member, idx) => (
                        <div key={member.lotId} className="flex items-center justify-between text-xs p-2 bg-bg-800 rounded border border-bg-700">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-copper-700 flex items-center justify-center text-[10px] font-bold text-cream-50">
                              {idx + 1}
                            </span>
                            <div>
                              <p className="font-medium text-cream-100">{member.collectorName || `Collector ${member.anonCollectorId.slice(-4)}`}</p>
                              <p className="text-cream-500">{member.materialType} · {member.estimatedWeightKg} kg</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-harvest-300">₹{member.priceExpectedPerKg}/kg</p>
                            <p className="text-cream-500">{member.area}, {member.district}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pool Details */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-cream-400">
                    <div className="p-2 bg-bg-750 rounded-lg">
                      <p className="font-medium text-cream-500">District</p>
                      <p>{pool.district}, {pool.state}</p>
                    </div>
                    <div className="p-2 bg-bg-750 rounded-lg">
                      <p className="font-medium text-cream-500">Pickup Window</p>
                      <p>{pool.pickupWindowStart} to {pool.pickupWindowEnd}</p>
                    </div>
                    <div className="p-2 bg-bg-750 rounded-lg">
                      <p className="font-medium text-cream-500">Price Range</p>
                      <p>₹{pool.priceRange.min} – ₹{pool.priceRange.max}/kg</p>
                    </div>
                    {pool.recyclerName && (
                      <div className="p-2 bg-bg-750 rounded-lg">
                        <p className="font-medium text-cream-500">Recycler</p>
                        <p className="text-harvest-300">{pool.recyclerName}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-bg-700">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1"
                      onClick={() => onViewPoolDetail(pool)}
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Details</span>
                    </Button>
                    {pool.status === 'open' && pool.members.some(m => m.anonCollectorId === collector.anonCollectorId) && (
                      <>
                        <Button
                          variant="copper"
                          size="sm"
                          className="flex-1 gap-1"
                          onClick={() => onViewPoolDetail(pool)}
                        >
                          <Gavel className="w-4 h-4" />
                          <span>View Offers</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-1"
                          onClick={() => {
                            const myMember = pool.members.find(m => m.anonCollectorId === collector.anonCollectorId);
                            onLeavePool(pool.id, myMember?.lotId || '');
                          }}
                        >
                          <X className="w-4 h-4" />
                          <span>Leave Pool</span>
                        </Button>
                      </>
                    )}
                    {pool.status === 'confirmed' && pool.members.some(m => m.anonCollectorId === collector.anonCollectorId) && (
                      <Button
                        variant="olive"
                        size="sm"
                        className="flex-1 gap-1"
                        onClick={() => onViewPoolDetail(pool)}
                      >
                        <QrCode className="w-4 h-4" />
                        <span>Handover / Settlement</span>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}