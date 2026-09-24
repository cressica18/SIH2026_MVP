import React, { useState } from 'react';
import {
  BuyerProfile,
  Listing,
  Order,
  Language,
} from '../types';
import { I18N_STRINGS } from '../data/i18n';
import {
  Search,
  Filter,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Phone,
  MapPin,
  Clock,
  Truck,
  IndianRupee,
  Star,
  Eye,
  AlertCircle,
  X,
  ChevronRight,
} from 'lucide-react';

interface BuyerViewProps {
  buyer: BuyerProfile;
  listings: Listing[];
  orders: Order[];
  currentLanguage: Language;
  onPlaceOrder: (order: Order) => Promise<boolean>;
  onUpdateOrderStatus: (orderId: string, status: string) => void;
  onRateFarmer: (orderId: string, rating: number) => Promise<boolean>;
  initialTab?: string;
}

export const BuyerView: React.FC<BuyerViewProps> = ({
  buyer,
  listings,
  orders,
  currentLanguage,
  onPlaceOrder,
  onUpdateOrderStatus,
  onRateFarmer,
  initialTab = 'marketplace',
}) => {
  const [activeTab, setActiveTab] = useState<'marketplace' | 'orders'>(
    initialTab === 'orders' ? 'orders' : 'marketplace'
  );

  const [selectedCrop, setSelectedCrop] = useState<string>('All');
  const [selectedGrade, setSelectedGrade] = useState<string>('All');
  const [maxPrice, setMaxPrice] = useState<number>(60);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Listing for Order Placement Modal
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [orderQuantity, setOrderQuantity] = useState<number>(1000);
  const [deliveryAddress, setDeliveryAddress] = useState<string>(
    'Plot 44, Food Park MIDC, Pune, Maharashtra'
  );
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Rating Modal
  const [ratingOrderId, setRatingOrderId] = useState<string | null>(null);
  const [selectedStarRating, setSelectedStarRating] = useState<number>(5);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [ratingError, setRatingError] = useState<string | null>(null);

  const t = I18N_STRINGS[currentLanguage];

  // Filtering listings
  const filteredListings = listings.filter((item) => {
    if (selectedCrop !== 'All' && item.crop !== selectedCrop) return false;
    if (selectedGrade !== 'All' && item.quality.grade !== selectedGrade) return false;
    if (item.priceExpected > maxPrice) return false;
    if (
      searchQuery &&
      !item.crop.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !item.variety.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !item.district.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  // Recommended Listings (sorted by match score)
  const recommendedListings = [...listings]
    .filter((l) => (l.matchScore || 0) >= 90)
    .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

  const handleOpenOrderModal = (listing: Listing) => {
    setSelectedListing(listing);
    setOrderQuantity(Math.min(1000, listing.quantityKg));
    setOrderError(null);
  };

  const handleSubmitOrder = async () => {
    if (!selectedListing) return;
    setIsSubmittingOrder(true);
    setOrderError(null);

    try {
      const newOrder: Order = {
        id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
        listingId: selectedListing.id,
        crop: selectedListing.crop,
        variety: selectedListing.variety,
        quantityKg: Number(orderQuantity),
        agreedPricePerKg: selectedListing.priceExpected,
        totalAmount: Number(orderQuantity) * selectedListing.priceExpected,
        buyerId: buyer.id,
        buyerName: buyer.businessName || buyer.name,
        buyerType: buyer.buyerType,
        buyerPhone: buyer.phone,
        anonSellerId: selectedListing.anonSellerId,
        // Private seller details sent to backend; only revealed after farmer confirms
        sellerRealName: selectedListing.farmerRealName,
        sellerPhone: selectedListing.farmerPhone,
        sellerVillage: selectedListing.village,
        sellerDistrict: selectedListing.district,
        sellerState: selectedListing.state,
        status: 'pending',
        identityRevealed: false,
        deliveryAddress,
        createdAt: 'Just now',
      };

      const success = await onPlaceOrder(newOrder);
      if (success) {
        setSelectedListing(null);
        setActiveTab('orders');
      } else {
        setOrderError('Failed to place order. Please check quantity or try again.');
      }
    } catch {
      setOrderError('An unexpected error occurred while placing order.');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const handleRateSubmit = async () => {
    if (!ratingOrderId) return;
    setIsSubmittingRating(true);
    setRatingError(null);
    try {
      const success = await onRateFarmer(ratingOrderId, selectedStarRating);
      if (success) {
        setRatingOrderId(null);
      } else {
        setRatingError('Failed to submit rating. Order must be settled first.');
      }
    } catch {
      setRatingError('An error occurred while submitting rating.');
    } finally {
      setIsSubmittingRating(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Buyer Header Banner */}
      <div className="bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-5 sm:p-7 shadow-lg shadow-indigo-950/20">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-700/60 text-blue-200 border border-blue-500/40">
                Verified Buyer / Procurement
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Direct Farmgate Access
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              {buyer.businessName || buyer.name}
            </h2>
            <p className="text-xs sm:text-sm text-blue-200">
              Procurement Location: {buyer.district}, {buyer.state} • Type: {buyer.buyerType.toUpperCase()}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('marketplace')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'marketplace'
                  ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30'
                  : 'bg-white/10 text-blue-100 hover:bg-white/20'
              }`}
            >
              🛒 Direct Marketplace
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30'
                  : 'bg-white/10 text-blue-100 hover:bg-white/20'
              }`}
            >
              📦 My Orders ({orders.length})
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'marketplace' && (
        <div className="space-y-6">
          
          {/* AI Recommended Section */}
          {recommendedListings.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <h3 className="text-base sm:text-lg font-bold text-stone-900">
                    {t.buyer.recommendedForYou}
                  </h3>
                </div>
                <span className="text-xs text-stone-500">
                  Ranked by Price Fit, Quality Grade, Proximity & Trust
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendedListings.slice(0, 2).map((item) => (
                  <div
                    key={`rec_${item.id}`}
                    className="p-4 bg-gradient-to-br from-amber-50/60 to-emerald-50/40 rounded-2xl border border-amber-200/80 shadow-xs flex flex-col sm:flex-row gap-4"
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.crop}
                      className="w-full sm:w-32 h-32 rounded-xl object-cover shrink-0"
                    />
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-stone-900 text-amber-300">
                          {item.anonSellerId}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white flex items-center gap-1 shadow-xs">
                          <Sparkles className="w-3 h-3" />
                          {item.matchScore}% Match
                        </span>
                      </div>

                      <div>
                        <h4 className="font-bold text-base text-stone-900">
                          {item.crop} - {item.variety}
                        </h4>
                        <p className="text-xs text-stone-500">
                          {item.village}, {item.district} ({item.distanceKm} km away)
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="font-bold text-emerald-700 text-base">
                          ₹{item.priceExpected}/kg
                        </span>
                        <span className="text-stone-500 font-medium">
                          Available: {item.quantityKg} kg
                        </span>
                        <button
                          onClick={() => handleOpenOrderModal(item)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer transition-colors text-xs"
                        >
                          Procure Lot
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search & Filter Bar */}
          <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search by crop, variety, or district..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
                <select
                  value={selectedCrop}
                  onChange={(e) => setSelectedCrop(e.target.value)}
                  className="px-3 py-2 text-xs font-semibold bg-stone-50 border border-stone-200 rounded-xl focus:outline-none"
                >
                  <option value="All">All Crops</option>
                  <option value="Tomato">Tomato</option>
                  <option value="Onion">Onion</option>
                  <option value="Potato">Potato</option>
                  <option value="Green Chilli">Green Chilli</option>
                  <option value="Soybean">Soybean</option>
                </select>

                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="px-3 py-2 text-xs font-semibold bg-stone-50 border border-stone-200 rounded-xl focus:outline-none"
                >
                  <option value="All">All Quality Grades</option>
                  <option value="A">Grade A Only</option>
                  <option value="B">Grade B & Above</option>
                </select>

                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium whitespace-nowrap">
                  <span>Max: ₹{maxPrice}/kg</span>
                  <input
                    type="range"
                    min={10}
                    max={80}
                    step={2}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-16 accent-blue-600"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Listings Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredListings.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-44 bg-stone-100 overflow-hidden">
                    <img
                      src={item.imageUrl}
                      alt={item.crop}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-bold shadow-sm ${
                        item.quality.grade === 'A' ? 'bg-emerald-600 text-white' :
                        item.quality.grade === 'B' ? 'bg-amber-500 text-white' :
                        'bg-rose-600 text-white'
                      }`}>
                        Grade {item.quality.grade}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-stone-900/80 text-amber-300">
                        {item.anonSellerId}
                      </span>
                    </div>

                    <div className="absolute bottom-2.5 right-2.5">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-700/90 text-white flex items-center gap-1">
                        ★ {item.farmerReputation}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-2.5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-base text-stone-900">
                          {item.crop}
                        </h4>
                        <p className="text-xs text-stone-500">
                          {item.variety} • {item.district}, {item.state}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-stone-400 font-medium">
                          Offer Price
                        </p>
                        <p className="text-base font-extrabold text-emerald-700">
                          ₹{item.priceExpected}/kg
                        </p>
                      </div>
                    </div>

                    <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-100 text-xs space-y-1">
                      <div className="flex items-center justify-between text-stone-600">
                        <span>Total Lot Size:</span>
                        <span className="font-bold text-stone-900">{item.quantityKg} kg</span>
                      </div>
                      <div className="flex items-center justify-between text-stone-600">
                        <span>AI Mandi Benchmark:</span>
                        <span className="font-bold text-emerald-700">₹{item.priceAi.fair}/kg</span>
                      </div>
                      <div className="flex items-center justify-between text-stone-600">
                        <span>CNN Quality:</span>
                        <span className={`font-bold ${
                          item.quality.grade === 'A' ? 'text-emerald-700' :
                          item.quality.grade === 'B' ? 'text-amber-600' :
                          'text-rose-600'
                        }`}>{item.quality.freshnessLabel} ({item.quality.confidence}%)</span>
                      </div>
                    </div>

                    <div className="p-2 bg-blue-50/60 rounded-lg text-[11px] text-blue-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>Anonymous seller. Name & phone unlock upon order confirm.</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0">
                  <button
                    onClick={() => handleOpenOrderModal(item)}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-98"
                  >
                    <span>Place Procurement Order</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* TAB 2: MY ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-bold text-stone-900">
              Procurement Orders & Identity Reveal Tracker
            </h3>
            <span className="text-xs text-stone-500">
              Contract state machine with real-time settlement
            </span>
          </div>

          <div className="space-y-3">
            {orders.map((ord) => (
              <div
                key={ord.id}
                className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-stone-900">
                      Order #{ord.id}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800">
                      {ord.status.replace('_', ' ')}
                    </span>
                    {ord.identityRevealed && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        Seller Identity Unlocked
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
                    <span className="text-stone-400 block">Payable Amount:</span>
                    <span className="font-extrabold text-emerald-700 text-base">
                      ₹{ord.totalAmount.toLocaleString('en-IN')}
                    </span>
                    <span className="text-stone-500 block">
                      Settlement at Farmgate / Consolidation
                    </span>
                  </div>

                  <div>
                    <span className="text-stone-400 block">Seller Information:</span>
                    <span className="font-mono font-bold text-stone-900">
                      {ord.anonSellerId}
                    </span>
                    {ord.identityRevealed && ord.sellerRealName ? (
                      <div className="mt-0.5 space-y-0.5 text-emerald-900 font-semibold">
                        <p className="flex items-center gap-1">
                          👤 {ord.sellerRealName} ({ord.sellerVillage}, {ord.sellerDistrict})
                        </p>
                        <p className="flex items-center gap-1 text-emerald-700">
                          <Phone className="w-3 h-3" />
                          {ord.sellerPhone}
                        </p>
                      </div>
                    ) : (
                      <p className="text-stone-400 italic">
                        Hidden until confirmed
                      </p>
                    )}
                  </div>
                </div>

                {/* Identity Reveal Success Alert Box */}
                {ord.identityRevealed && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2 mt-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-bold">
                        Identity Reveal Complete: Direct Farmer Contact Unlocked
                      </p>
                      <p className="text-stone-600">
                        You can coordinate dispatch directly with farmer <span className="font-semibold text-stone-900">{ord.sellerRealName}</span> at <span className="font-semibold text-stone-900">{ord.sellerPhone}</span>.
                      </p>
                    </div>
                  </div>
                )}

                {/* Settlement Button for Delivered Orders */}
                {ord.status === 'delivered' && (
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => onUpdateOrderStatus(ord.id, 'settled')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <IndianRupee className="w-3.5 h-3.5" />
                      <span>Release Payment & Settle</span>
                    </button>
                  </div>
                )}

                {/* Post Settlement Rating */}
                {ord.status === 'settled' && !ord.buyerRating && (
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => setRatingOrderId(ord.id)}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Star className="w-3.5 h-3.5" />
                      <span>Rate Farmer Fulfillment</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PLACE ORDER MODAL */}
      {selectedListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col">
            
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-900 to-indigo-950 text-white">
              <h3 className="text-base font-bold">
                Confirm Procurement Commitment
              </h3>
              <button
                onClick={() => setSelectedListing(null)}
                className="p-1 text-blue-200 hover:text-white rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {orderError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{orderError}</span>
                </div>
              )}

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-blue-700" />
                  Farmer Confirmation Required
                </p>
                <p className="text-stone-600">
                  By clicking Confirm, your request is sent to the farmer. The order status becomes <span className="font-bold text-stone-900">Pending</span>. Once the farmer accepts, their contact details will be disclosed.
                </p>
              </div>

              <div>
                <span className="text-stone-400 block font-medium">Selected Batch:</span>
                <p className="text-sm font-bold text-stone-900">
                  {selectedListing.crop} ({selectedListing.variety}) - Grade {selectedListing.quality.grade}
                </p>
                <p className="text-stone-500">
                  Seller: {selectedListing.anonSellerId} • District: {selectedListing.district}
                </p>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Procurement Quantity (kg)
                </label>
                <input
                  type="number"
                  max={selectedListing.quantityKg}
                  min={100}
                  step={50}
                  value={orderQuantity}
                  onChange={(e) => setOrderQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-bold border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[10px] text-stone-400 mt-0.5 block">
                  Max Available in Lot: {selectedListing.quantityKg} kg
                </span>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Delivery Destination
                </label>
                <input
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1 font-mono">
                <div className="flex justify-between text-stone-600">
                  <span>Unit Price:</span>
                  <span>₹{selectedListing.priceExpected}/kg</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Quantity:</span>
                  <span>{orderQuantity} kg</span>
                </div>
                <div className="flex justify-between text-stone-900 font-bold text-sm pt-1 border-t border-stone-200">
                  <span>Total Payable:</span>
                  <span className="text-emerald-700">₹{(orderQuantity * selectedListing.priceExpected).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <button
                type="button"
                disabled={isSubmittingOrder}
                onClick={handleSubmitOrder}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer active:scale-98 disabled:opacity-50"
              >
                {isSubmittingOrder ? 'Submitting Order...' : 'Request Order (Pending Farmer Approval)'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* RATING MODAL */}
      {ratingOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-stone-200 p-6 space-y-4 text-center">
            <h3 className="font-bold text-base text-stone-900">
              Rate Farmer Fulfillment
            </h3>
            <p className="text-xs text-stone-500">
              Your rating directly updates the farmer's transparent reputation score on Vasundhara.
            </p>

            {ratingError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-1.5 text-left">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{ratingError}</span>
              </div>
            )}

            <div className="flex justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setSelectedStarRating(star)}
                  className="text-2xl cursor-pointer hover:scale-110 transition-transform"
                >
                  {star <= selectedStarRating ? '★' : '☆'}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                disabled={isSubmittingRating}
                onClick={() => {
                  setRatingOrderId(null);
                  setRatingError(null);
                }}
                className="flex-1 py-2 text-xs font-semibold text-stone-600 bg-stone-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                disabled={isSubmittingRating}
                onClick={handleRateSubmit}
                className="flex-1 py-2 text-xs font-bold text-white bg-emerald-600 rounded-xl shadow-xs disabled:opacity-50"
              >
                {isSubmittingRating ? 'Submitting...' : 'Submit Rating'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
