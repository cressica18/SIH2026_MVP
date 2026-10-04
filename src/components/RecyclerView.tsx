import React, { useState, useEffect } from 'react';
import {
  RecyclerProfile,
  SmartPool,
  PoolOffer,
  SettlementRecord,
  Language,
} from '../types';
import { I18N_STRINGS } from '../data/i18n';
import {
  Factory,
  Users,
  ClipboardList,
  Recycle,
  Eye,
  Gavel,
  QrCode,
  MapPin,
  Clock,
  Filter,
  Loader2,
  Package,
  BadgeCheck,
  Scale,
  Tag,
  RotateCcw,
  CheckCircle,
  X,
  FileText,
  HardDrive,
  GitBranch,
  Send,
  Building,
  Check,
  ShieldCheck,
  DollarSign,
  TrendingUp,
  Award,
} from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { Input, Textarea } from './ui/Input';
import { Badge } from './ui/Badge';
import { Modal } from './ui/Modal';

interface RecyclerViewProps {
  recycler: RecyclerProfile;
  pools: SmartPool[];
  offers: PoolOffer[];
  settlements: SettlementRecord[];
  currentLanguage: Language;
  onCreateOffer: (offer: { poolId: string; offeredPricePerKg: number; notes?: string }) => Promise<boolean>;
  onCompleteHandover: (settlementId: string, qrCode?: string) => Promise<boolean>;
  onRefresh: () => void;
  initialTab?: string;
}

const RECYCLER_TABS = [
  { id: 'pools', label: 'Browse Smart Pools', icon: Users },
  { id: 'offers', label: 'My Offers', icon: Gavel },
  { id: 'settlements', label: 'Settlements & Handover', icon: QrCode },
] as const;

type RecyclerTabId = typeof RECYCLER_TABS[number]['id'];

const MATERIAL_CATEGORIES = [
  { value: 'metal', label: 'Metal', icon: Factory },
  { value: 'plastic', label: 'Plastic', icon: Package },
  { value: 'paper', label: 'Paper', icon: FileText },
  { value: 'ewaste', label: 'E-Waste', icon: HardDrive },
  { value: 'glass', label: 'Glass', icon: GitBranch },
  { value: 'rubber', label: 'Rubber', icon: RotateCcw },
  { value: 'mixed', label: 'Mixed', icon: GitBranch },
] as const;

export const RecyclerView: React.FC<RecyclerViewProps> = ({
  recycler,
  pools,
  offers,
  settlements,
  currentLanguage,
  onCreateOffer,
  onCompleteHandover,
  onRefresh,
  initialTab = 'pools',
}) => {
  const [activeTab, setActiveTab] = useState<RecyclerTabId>((initialTab as RecyclerTabId) || 'pools');
  const t = I18N_STRINGS[currentLanguage] || I18N_STRINGS['en'];

  // Make offer modal state
  const [selectedPoolForOffer, setSelectedPoolForOffer] = useState<SmartPool | null>(null);
  const [offeredPrice, setOfferedPrice] = useState<number>(0);
  const [offerNotes, setOfferNotes] = useState<string>('');
  const [isSubmittingOffer, setIsSubmittingOffer] = useState<boolean>(false);
  const [offerError, setOfferError] = useState<string | null>(null);

  // Pool filter states
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchDistrict, setSearchDistrict] = useState<string>('');

  // Handover completion state
  const [selectedSettlement, setSelectedSettlement] = useState<SettlementRecord | null>(null);
  const [inputQrCode, setInputQrCode] = useState<string>('');
  const [isCompletingHandover, setIsCompletingHandover] = useState<boolean>(false);
  const [handoverError, setHandoverError] = useState<string | null>(null);

  const myOffers = offers.filter(o => o.recyclerId === recycler.id);
  const mySettlements = settlements.filter(s => s.recyclerId === recycler.id);

  const filteredPools = pools.filter(p => {
    if (p.status !== 'open' && p.status !== 'matched') return false;
    if (selectedCategory !== 'all' && p.materialCategory !== selectedCategory) return false;
    if (searchDistrict && !p.district.toLowerCase().includes(searchDistrict.toLowerCase())) return false;
    return true;
  });

  const handleOpenOfferModal = (pool: SmartPool) => {
    setSelectedPoolForOffer(pool);
    setOfferedPrice(pool.avgPricePerKg);
    setOfferNotes('');
    setOfferError(null);
  };

  const handleSubmitOffer = async () => {
    if (!selectedPoolForOffer) return;
    if (!offeredPrice || offeredPrice <= 0) {
      setOfferError('Offered price per kg must be greater than 0.');
      return;
    }

    setIsSubmittingOffer(true);
    setOfferError(null);

    const success = await onCreateOffer({
      poolId: selectedPoolForOffer.id,
      offeredPricePerKg: Number(offeredPrice),
      notes: offerNotes.trim() || undefined,
    });

    setIsSubmittingOffer(false);
    if (success) {
      setSelectedPoolForOffer(null);
      onRefresh();
      setActiveTab('offers');
    } else {
      setOfferError('Failed to submit offer. Please check your connection or license eligibility.');
    }
  };

  const handleHandoverSubmit = async () => {
    if (!selectedSettlement) return;
    setIsCompletingHandover(true);
    setHandoverError(null);
    const success = await onCompleteHandover(selectedSettlement.id, inputQrCode || selectedSettlement.handoverRef);
    setIsCompletingHandover(false);
    if (success) {
      setSelectedSettlement(null);
      setInputQrCode('');
      onRefresh();
    } else {
      setHandoverError('Failed to complete handover. Please check settlement ID or network connection.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Recycler Profile Header */}
      <div className="relative bg-atmosphere-recycler px-5 py-8 sm:px-8 sm:py-10 rounded-3xl border border-teal-800/40 overflow-hidden shadow-2xl mb-8">
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          <div className="md:col-span-2 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="botanical" size="sm" className="gap-1.5">
                <BadgeCheck className="w-3.5 h-3.5" />
                <span>Authorized Recycler</span>
              </Badge>
              <Badge variant="cream" size="sm" className="font-mono gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                <span>License: {recycler.licenseNumber}</span>
              </Badge>
            </div>

            <div className="space-y-1">
              <h1 className="font-display text-2xl sm:text-3xl font-semibold text-cream-50 tracking-tight">
                {recycler.businessName}
              </h1>
              <p className="text-cream-300 text-sm flex items-center gap-2">
                <Building className="w-4 h-4 text-teal-400" />
                <span>Representative: {recycler.name}</span>
                <span className="text-cream-600">·</span>
                <MapPin className="w-4 h-4 text-copper-400" />
                <span>{recycler.district}, {recycler.state}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="text-xs text-cream-400">Accepted Materials:</span>
              {recycler.acceptedMaterials.map((mat) => (
                <Badge key={mat} variant="copper" size="xs" className="uppercase font-mono">
                  {mat}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Card variant="subtle-copper" padding="md" className="text-center border-teal-800 bg-teal-950/30">
              <span className="text-[10px] font-semibold text-cream-400 uppercase tracking-wider block mb-1">
                Rating
              </span>
              <p className="font-display text-2xl font-bold text-teal-300">
                {recycler.reputationScore.toFixed(1)} <span className="text-xs text-cream-500 font-normal">/ 5</span>
              </p>
            </Card>

            <Card variant="subtle-copper" padding="md" className="text-center border-teal-800 bg-teal-950/30">
              <span className="text-[10px] font-semibold text-cream-400 uppercase tracking-wider block mb-1">
                Daily Cap
              </span>
              <p className="font-display text-xl font-bold text-cream-100">
                {(recycler.capacityKgPerDay / 1000).toFixed(1)} T
              </p>
            </Card>

            <Card variant="subtle-copper" padding="md" className="text-center border-teal-800 bg-teal-950/30">
              <span className="text-[10px] font-semibold text-cream-400 uppercase tracking-wider block mb-1">
                Active Bids
              </span>
              <p className="font-display text-2xl font-bold text-harvest-300">
                {myOffers.length}
              </p>
            </Card>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <nav className="flex items-center gap-1 border-b border-bg-700 pb-0 overflow-x-auto scrollbar-hidden">
        {RECYCLER_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          let count = 0;
          if (tab.id === 'pools') count = filteredPools.length;
          if (tab.id === 'offers') count = myOffers.length;
          if (tab.id === 'settlements') count = mySettlements.length;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 -mb-px cursor-pointer whitespace-nowrap transition-colors
                ${isActive
                  ? 'text-teal-300 border-teal-400 bg-teal-950/20'
                  : 'text-cream-400 border-transparent hover:text-cream-200 hover:border-bg-600'
                }
              `}
            >
              <tab.icon className={`w-4 h-4 ${isActive ? 'text-teal-400' : 'text-cream-500'}`} />
              <span>{tab.label}</span>
              {count > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-bg-800 text-cream-300 border border-bg-700">
                  {count}
                </span>
              )}
            </button>
          );
        })}

        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          className="ml-auto text-cream-400 hover:text-cream-100 gap-1"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Refresh</span>
        </Button>
      </nav>

      {/* TAB 1: BROWSE SMART POOLS */}
      {activeTab === 'pools' && (
        <div className="space-y-5">
          {/* Filters */}
          <Card variant="panel" padding="md" className="border-bg-700">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-semibold text-cream-400 flex items-center gap-1 mr-2">
                  <Filter className="w-3.5 h-3.5" /> Category:
                </span>
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-teal-900/50 text-teal-300 border border-teal-700'
                      : 'bg-bg-800 text-cream-400 border border-bg-700 hover:text-cream-200'
                  }`}
                >
                  All
                </button>
                {MATERIAL_CATEGORIES.map(cat => (
                  <button
                    key={cat.value}
                    onClick={() => setSelectedCategory(cat.value)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                      selectedCategory === cat.value
                        ? 'bg-teal-900/50 text-teal-300 border border-teal-700'
                        : 'bg-bg-800 text-cream-400 border border-bg-700 hover:text-cream-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="w-full sm:w-48">
                <Input
                  placeholder="Filter by district..."
                  value={searchDistrict}
                  onChange={(e) => setSearchDistrict(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>
          </Card>

          {/* Pools Grid */}
          {filteredPools.length === 0 ? (
            <Card variant="panel" padding="lg" className="text-center border-bg-700">
              <div className="mx-auto mb-4 w-16 h-16 rounded-xl bg-bg-800 border border-bg-700 flex items-center justify-center">
                <Users className="w-8 h-8 text-copper-400" />
              </div>
              <h3 className="font-display text-lg font-semibold text-cream-50 mb-2">No active smart pools found</h3>
              <p className="text-cream-400 mb-4 max-w-xs mx-auto text-sm">
                There are currently no open smart pools matching your selected material filter.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPools.map(pool => {
                const hasMyOffer = myOffers.some(o => o.poolId === pool.id);

                return (
                  <Card key={pool.id} variant="panel" padding="none" className="overflow-hidden border-bg-700 hover:border-teal-600 transition-all">
                    <CardContent className="p-5 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <Badge variant="copper" size="xs" className="uppercase mb-1">
                            {pool.materialCategory}
                          </Badge>
                          <h3 className="font-display text-lg font-semibold text-cream-50">
                            {pool.materialType} Pool
                          </h3>
                          <p className="text-xs text-cream-500 font-mono">{pool.id}</p>
                        </div>
                        <Badge variant={pool.status === 'open' ? 'info' : 'warning'} size="sm">
                          {pool.status === 'open' ? 'Open for Bids' : pool.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 p-3 bg-bg-800 rounded-lg text-xs">
                        <div>
                          <span className="text-cream-500 block">Total Volume</span>
                          <span className="font-bold text-cream-100 text-sm">{pool.totalWeightKg.toLocaleString()} kg</span>
                        </div>
                        <div>
                          <span className="text-cream-500 block">Expected Avg Rate</span>
                          <span className="font-bold text-harvest-300 text-sm">₹{pool.avgPricePerKg}/kg</span>
                        </div>
                        <div>
                          <span className="text-cream-500 block">Location</span>
                          <span className="font-medium text-cream-200">{pool.district}, {pool.state}</span>
                        </div>
                        <div>
                          <span className="text-cream-500 block">Collectors</span>
                          <span className="font-medium text-cream-200">{pool.members.length} members</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-bg-700">
                        <span className="text-xs text-cream-500">Pickup window: {pool.pickupWindowStart}</span>
                        <Button
                          variant={hasMyOffer ? "outline" : "copper"}
                          size="sm"
                          className="gap-1.5"
                          onClick={() => handleOpenOfferModal(pool)}
                        >
                          <Gavel className="w-4 h-4" />
                          <span>{hasMyOffer ? "Update Offer" : "Make Offer"}</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY OFFERS */}
      {activeTab === 'offers' && (
        <div className="space-y-4">
          <h2 className="font-display text-xl font-semibold text-cream-50 flex items-center gap-2">
            <Gavel className="w-5 h-5 text-teal-400" />
            <span>My Submitted Offers ({myOffers.length})</span>
          </h2>

          {myOffers.length === 0 ? (
            <Card variant="panel" padding="lg" className="text-center border-bg-700">
              <p className="text-cream-400">You have not submitted any offers yet.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {myOffers.map(offer => {
                const pool = pools.find(p => p.id === offer.poolId);

                return (
                  <Card key={offer.id} variant="panel" padding="md" className="border-bg-700">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-cream-100">{pool?.materialType || offer.poolId}</span>
                          <Badge variant={offer.status === 'accepted' ? 'success' : offer.status === 'rejected' ? 'danger' : 'warning'}>
                            {offer.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-cream-400">
                          Offered Rate: <span className="font-semibold text-harvest-300">₹{offer.offeredPricePerKg}/kg</span> · Total Value: <span className="font-semibold text-cream-200">₹{offer.totalValue.toLocaleString()}</span>
                        </p>
                        {offer.notes && <p className="text-xs italic text-cream-500">"{offer.notes}"</p>}
                      </div>

                      <div className="text-right text-xs text-cream-500">
                        <p>Submitted: {offer.createdAt}</p>
                        <p>Expires: {offer.expiresAt}</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SETTLEMENTS & HANDOVER */}
      {activeTab === 'settlements' && (
        <div className="space-y-4">
          <h2 className="font-display text-xl font-semibold text-cream-50 flex items-center gap-2">
            <QrCode className="w-5 h-5 text-teal-400" />
            <span>Confirmed Settlements & Handover ({mySettlements.length})</span>
          </h2>

          {mySettlements.length === 0 ? (
            <Card variant="panel" padding="lg" className="text-center border-bg-700">
              <p className="text-cream-400">No confirmed settlements yet. Once a collector accepts your offer, handover details will appear here.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {mySettlements.map(settlement => (
                <Card key={settlement.id} variant="panel" padding="md" className="border-bg-700 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-bg-700 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-cream-500 uppercase font-mono">{settlement.id}</p>
                        <Badge variant="default" size="xs">Historical Record</Badge>
                      </div>
                      <h3 className="font-bold text-cream-100 text-lg">
                        Pool: {settlement.poolId}
                      </h3>
                      <p className="text-xs text-cream-400">
                        Total Weight: {settlement.totalWeightKg} kg @ ₹{settlement.agreedPricePerKg}/kg
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={settlement.status === 'completed' ? 'success' : 'warning'} size="md">
                        {settlement.status === 'completed' ? 'Historical / Completed' : 'Pending Pickup'}
                      </Badge>
                      <p className="text-lg font-bold text-harvest-300 mt-1">₹{settlement.totalValue.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3 bg-bg-800 rounded-lg space-y-2">
                      <p className="text-xs font-semibold text-copper-300 uppercase">Handover Verification</p>
                      <p className="text-xs text-cream-400">Reference Code:</p>
                      <p className="font-mono text-lg font-bold text-cream-50">{settlement.handoverRef}</p>

                      {settlement.status !== 'completed' && (
                        <Button
                          variant="copper"
                          size="sm"
                          className="w-full mt-2 gap-1.5"
                          onClick={() => {
                            setSelectedSettlement(settlement);
                            setInputQrCode(settlement.handoverRef);
                          }}
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Complete Handover</span>
                        </Button>
                      )}
                    </div>

                    <div className="p-3 bg-bg-800 rounded-lg space-y-1 text-xs">
                      <p className="font-semibold text-copper-300 uppercase mb-2">Member Collectors ({settlement.memberSettlements.length})</p>
                      {settlement.memberSettlements.map(m => (
                        <div key={m.lotId} className="flex justify-between border-b border-bg-750 pb-1">
                          <span className="text-cream-300">{m.collectorName || m.anonCollectorId}</span>
                          <span className="font-medium text-harvest-300">₹{m.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MAKE OFFER MODAL */}
      {selectedPoolForOffer && (
        <Modal
          isOpen={!!selectedPoolForOffer}
          onClose={() => setSelectedPoolForOffer(null)}
          title={`Submit Offer for Pool ${selectedPoolForOffer.id}`}
        >
          <div className="space-y-4 p-4">
            <div className="p-3 bg-bg-800 rounded-lg text-xs space-y-1">
              <p><span className="text-cream-500">Material:</span> <span className="text-cream-100 font-semibold">{selectedPoolForOffer.materialType}</span></p>
              <p><span className="text-cream-500">Total Pool Weight:</span> <span className="text-cream-100 font-semibold">{selectedPoolForOffer.totalWeightKg} kg</span></p>
              <p><span className="text-cream-500">Expected Avg Rate:</span> <span className="text-harvest-300 font-semibold">₹{selectedPoolForOffer.avgPricePerKg}/kg</span></p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-cream-300 mb-1">
                Your Offered Price (₹ per kg) *
              </label>
              <Input
                type="number"
                value={offeredPrice}
                onChange={(e) => setOfferedPrice(Number(e.target.value) || 0)}
                placeholder="e.g. 520"
              />
              <p className="text-[11px] text-cream-500 mt-1">
                Total calculated value: ₹{(selectedPoolForOffer.totalWeightKg * (offeredPrice || 0)).toLocaleString()}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-cream-300 mb-1">
                Notes / Transport Conditions (Optional)
              </label>
              <Textarea
                value={offerNotes}
                onChange={(e) => setOfferNotes(e.target.value)}
                placeholder="e.g. Rate includes direct factory transport pickup from district depot."
                rows={2}
              />
            </div>

            {offerError && (
              <p className="text-xs text-copper-400 bg-copper-950/40 p-2 rounded border border-copper-800">
                {offerError}
              </p>
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setSelectedPoolForOffer(null)}>
                Cancel
              </Button>
              <Button
                variant="copper"
                className="flex-1 gap-1.5"
                disabled={isSubmittingOffer}
                onClick={handleSubmitOffer}
              >
                {isSubmittingOffer ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Submit Offer</span>
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* COMPLETE HANDOVER MODAL */}
      {selectedSettlement && (
        <Modal
          isOpen={!!selectedSettlement}
          onClose={() => {
            setSelectedSettlement(null);
            setHandoverError(null);
          }}
          title={`Complete Handover — Settlement ${selectedSettlement.id}`}
        >
          <div className="space-y-4 p-4">
            <p className="text-xs text-cream-300">
              Enter or confirm the Handover QR Code / Reference Code received from the collector upon material pickup at facility.
            </p>

            <div>
              <label className="block text-xs font-semibold text-cream-300 mb-1">
                Handover Reference Code *
              </label>
              <Input
                value={inputQrCode}
                onChange={(e) => setInputQrCode(e.target.value)}
                placeholder="KCP-1-AB3F-XYZ7"
              />
            </div>

            {handoverError && (
              <p className="text-xs text-copper-400 bg-copper-950/40 p-2 rounded border border-copper-800">
                {handoverError}
              </p>
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => { setSelectedSettlement(null); setHandoverError(null); }}>
                Cancel
              </Button>
              <Button
                variant="copper"
                className="flex-1 gap-1.5"
                disabled={isCompletingHandover}
                onClick={handleHandoverSubmit}
              >
                {isCompletingHandover ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                <span>Confirm Pickup & Settle</span>
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
