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
  ShoppingCart,
  Package,
  User,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from './ui/Card';
import { Button } from './ui/Button';
import { Badge, StatusBadge } from './ui/Badge';
import { Modal } from './ui/Modal';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { EmptyState } from './ui/EmptyState';
import { ImageWithFallback } from './ui/ImageWithFallback';

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

    const qty = Number(orderQuantity);
    if (isNaN(qty) || qty <= 0) {
      setOrderError('Procurement quantity must be a positive number.');
      return;
    }

    if (qty > selectedListing.quantityKg) {
      setOrderError(`Procurement quantity cannot exceed available lot size (${selectedListing.quantityKg} kg).`);
      return;
    }

    if (!deliveryAddress || deliveryAddress.trim().length === 0) {
      setOrderError('Delivery destination address is required.');
      return;
    }

    setIsSubmittingOrder(true);
    setOrderError(null);

    try {
      const newOrder: Order = {
        id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
        listingId: selectedListing.id,
        crop: selectedListing.crop,
        variety: selectedListing.variety,
        quantityKg: qty,
        agreedPricePerKg: selectedListing.priceExpected,
        totalAmount: qty * selectedListing.priceExpected,
        buyerId: buyer.id,
        buyerName: buyer.businessName || buyer.name,
        buyerType: buyer.buyerType,
        buyerPhone: buyer.phone,
        anonSellerId: selectedListing.anonSellerId,
        sellerRealName: selectedListing.farmerRealName,
        sellerPhone: selectedListing.farmerPhone,
        sellerVillage: selectedListing.village,
        sellerDistrict: selectedListing.district,
        sellerState: selectedListing.state,
        status: 'pending',
        identityRevealed: false,
        deliveryAddress: deliveryAddress.trim(),
        createdAt: 'Just now',
      };

      const success = await onPlaceOrder(newOrder);
      if (success) {
        setSelectedListing(null);
        setOrderQuantity(1000);
        setDeliveryAddress('Plot 44, Food Park MIDC, Pune, Maharashtra');
        setOrderError(null);
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
        setSelectedStarRating(5);
        setRatingError(null);
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
      <Card variant="elevated" padding="lg" className="bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 text-white border-none shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="info" size="sm" className="bg-blue-500/20 text-blue-200 border-blue-500/40">
                Verified Buyer / Procurement
              </Badge>
              <Badge variant="success" size="sm" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40">
                Direct Farmgate Access
              </Badge>
            </div>
            <CardTitle className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {buyer.businessName || buyer.name}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-blue-200 font-semibold">
              Procurement Location: {buyer.district}, {buyer.state} • Type: {buyer.buyerType.toUpperCase()}
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('marketplace')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'marketplace'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'bg-white/10 text-blue-100 hover:bg-white/20'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Direct Marketplace</span>
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'bg-white/10 text-blue-100 hover:bg-white/20'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>My Orders</span>
              {orders.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500 text-white">
                  {orders.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </Card>

      {activeTab === 'marketplace' && (
        <div className="space-y-6">
          
          {/* AI Recommended Section */}
          {recommendedListings.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <CardTitle>{t.buyer.recommendedForYou}</CardTitle>
                </div>
                <span className="text-xs text-stone-600 font-semibold">
                  Ranked by Price Fit, Quality Grade & Proximity
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendedListings.slice(0, 2).map((item) => (
                  <Card
                    key={`rec_${item.id}`}
                    variant="bordered"
                    padding="sm"
                    className="bg-gradient-to-br from-amber-50/60 to-emerald-50/40 border-amber-300 flex flex-col sm:flex-row gap-4"
                  >
                    <ImageWithFallback
                      src={item.imageUrl}
                      alt={item.crop}
                      fallbackTitle={item.crop}
                      className="w-full sm:w-36 h-36 rounded-xl object-cover shrink-0"
                    />
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <Badge variant="neutral" size="sm" className="font-mono bg-stone-900 text-amber-300">
                          {item.anonSellerId}
                        </Badge>
                        <Badge variant="warning" size="sm" className="bg-amber-500 text-white flex items-center gap-1 border-none shadow-2xs font-extrabold">
                          <Sparkles className="w-3 h-3" />
                          {item.matchScore}% Match
                        </Badge>
                      </div>

                      <div>
                        <h4 className="font-bold text-base text-stone-900">
                          {item.crop} - {item.variety}
                        </h4>
                        <p className="text-xs text-stone-600 font-medium">
                          {item.village}, {item.district} ({item.distanceKm} km away)
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="font-black text-emerald-800 text-base">
                          ₹{item.priceExpected}/kg
                        </span>
                        <span className="text-stone-700 font-bold">
                          Lot: {item.quantityKg} kg
                        </span>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleOpenOrderModal(item)}
                        >
                          Procure Lot
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Search & Filter Bar */}
          <Card variant="bordered" padding="sm">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-stone-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search by crop, variety, or district..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-stone-900 placeholder:text-stone-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar">
                <select
                  value={selectedCrop}
                  onChange={(e) => setSelectedCrop(e.target.value)}
                  className="px-3 py-2 text-xs font-bold bg-white border border-stone-300 rounded-xl focus:outline-none cursor-pointer text-stone-800"
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
                  className="px-3 py-2 text-xs font-bold bg-white border border-stone-300 rounded-xl focus:outline-none cursor-pointer text-stone-800"
                >
                  <option value="All">All Quality Grades</option>
                  <option value="A">Grade A Only</option>
                  <option value="B">Grade B & Above</option>
                </select>

                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-800 whitespace-nowrap">
                  <span>Max: ₹{maxPrice}/kg</span>
                  <input
                    type="range"
                    min={10}
                    max={80}
                    step={2}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-16 accent-blue-600 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Listings Grid */}
          {filteredListings.length === 0 ? (
            <EmptyState variant="matches" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredListings.map((item) => (
                <Card
                  key={item.id}
                  variant="bordered"
                  padding="none"
                  hover
                  className="overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-44 bg-stone-100 overflow-hidden">
                      <ImageWithFallback
                        src={item.imageUrl}
                        alt={item.crop}
                        fallbackTitle={item.crop}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                        <Badge variant={item.quality.grade === 'A' ? 'success' : item.quality.grade === 'B' ? 'warning' : 'danger'} size="sm">
                          Grade {item.quality.grade}
                        </Badge>
                        <Badge variant="neutral" size="sm" className="font-mono bg-stone-900/90 text-amber-300">
                          {item.anonSellerId}
                        </Badge>
                      </div>

                      <div className="absolute bottom-2.5 right-2.5">
                        <Badge variant="success" size="sm" className="bg-emerald-800 text-white flex items-center gap-1 shadow-2xs border-none">
                          <Star className="w-3 h-3 fill-current text-amber-300" />
                          <span>{item.farmerReputation}</span>
                        </Badge>
                      </div>
                    </div>

                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-base text-stone-900">
                            {item.crop}
                          </h4>
                          <p className="text-xs text-stone-600 font-medium">
                            {item.variety} • {item.district}, {item.state}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-stone-500 font-semibold">
                            Offer Price
                          </p>
                          <p className="text-base font-black text-emerald-800">
                            ₹{item.priceExpected}/kg
                          </p>
                        </div>
                      </div>

                      <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-1">
                        <div className="flex items-center justify-between text-stone-700">
                          <span className="font-medium">Total Lot Size:</span>
                          <span className="font-bold text-stone-900">{item.quantityKg} kg</span>
                        </div>
                        <div className="flex items-center justify-between text-stone-700">
                          <span className="font-medium">AI Mandi Fair Price:</span>
                          <span className="font-bold text-emerald-800">₹{item.priceAi.fair}/kg</span>
                        </div>
                        <div className="flex items-center justify-between text-stone-700">
                          <span className="font-medium">CNN Quality:</span>
                          <span className={`font-bold ${
                            item.quality.grade === 'A' ? 'text-emerald-800' :
                            item.quality.grade === 'B' ? 'text-amber-700' :
                            'text-rose-700'
                          }`}>{item.quality.freshnessLabel} ({item.quality.confidence}%)</span>
                        </div>
                      </div>

                      <div className="p-2 bg-blue-50 rounded-lg text-[11px] text-blue-950 flex items-center gap-1.5 border border-blue-200 font-medium">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                        <span>Anonymous seller. Details unlock upon order confirm.</span>
                      </div>
                    </CardContent>
                  </div>

                  <div className="p-4 pt-0">
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={() => handleOpenOrderModal(item)}
                    >
                      <span>Place Procurement Order</span>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

        </div>
      )}

      {/* TAB 2: MY ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <CardTitle>Procurement Orders & Identity Reveal Tracker</CardTitle>
            <span className="text-xs text-stone-600 font-semibold">
              Contract state machine with real-time settlement
            </span>
          </div>

          {orders.length === 0 ? (
            <EmptyState variant="orders" />
          ) : (
            <div className="space-y-3.5">
              {orders.map((ord) => (
                <Card key={ord.id} variant="bordered" padding="md" className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-stone-900">
                        Order #{ord.id}
                      </span>
                      <StatusBadge status={ord.status} />
                      {ord.identityRevealed && (
                        <Badge variant="success" size="sm" dot>
                          <Eye className="w-3 h-3" />
                          Seller Identity Unlocked
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-stone-500 font-semibold">
                      Created: {ord.createdAt}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
                    <div>
                      <span className="text-stone-500 block text-xs font-semibold">Harvest Item:</span>
                      <span className="font-bold text-stone-900">
                        {ord.crop} ({ord.variety})
                      </span>
                      <span className="text-stone-600 block text-xs font-medium">
                        {ord.quantityKg} kg @ ₹{ord.agreedPricePerKg}/kg
                      </span>
                    </div>

                    <div>
                      <span className="text-stone-500 block text-xs font-semibold">Payable Amount:</span>
                      <span className="font-black text-emerald-800 text-base">
                        ₹{ord.totalAmount.toLocaleString('en-IN')}
                      </span>
                      <span className="text-stone-600 block text-xs font-medium">
                        Settlement at Farmgate
                      </span>
                    </div>

                    <div>
                      <span className="text-stone-500 block text-xs font-semibold">Seller Information:</span>
                      <span className="font-mono font-bold text-stone-900 text-xs">
                        {ord.anonSellerId}
                      </span>
                      {ord.identityRevealed && ord.sellerRealName ? (
                        <div className="mt-1 space-y-0.5 text-xs text-emerald-950 font-semibold">
                          <p className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-emerald-800" />
                            <span>{ord.sellerRealName} ({ord.sellerVillage}, {ord.sellerDistrict})</span>
                          </p>
                          <p className="flex items-center gap-1 text-emerald-800 font-bold">
                            <Phone className="w-3.5 h-3.5" />
                            <span>{ord.sellerPhone}</span>
                          </p>
                        </div>
                      ) : (
                        <p className="text-stone-500 italic text-xs font-medium">
                          Hidden until farmer confirms
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Identity Reveal Success Alert Box */}
                  {ord.identityRevealed && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-bold text-emerald-900">
                          Identity Reveal Complete: Direct Farmer Contact Unlocked
                        </p>
                        <p className="text-stone-700 mt-0.5 font-medium">
                          You can coordinate dispatch directly with farmer <span className="font-bold text-stone-900">{ord.sellerRealName}</span> at <span className="font-bold text-stone-900">{ord.sellerPhone}</span>.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Settlement Button for Delivered Orders */}
                  {ord.status === 'delivered' && (
                    <div className="pt-2 flex justify-end">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => onUpdateOrderStatus(ord.id, 'settled')}
                      >
                        <IndianRupee className="w-3.5 h-3.5" />
                        <span>Release Payment & Settle Trade</span>
                      </Button>
                    </div>
                  )}

                  {/* Post Settlement Rating */}
                  {ord.status === 'settled' && !ord.buyerRating && (
                    <div className="pt-2 flex justify-end">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setRatingOrderId(ord.id)}
                        className="bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100"
                      >
                        <Star className="w-3.5 h-3.5 text-amber-600 fill-current" />
                        <span>Rate Farmer Fulfillment</span>
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PLACE ORDER MODAL */}
      <Modal
        isOpen={!!selectedListing}
        onClose={() => setSelectedListing(null)}
        title="Confirm Procurement Commitment"
        size="md"
      >
        {selectedListing && (
          <div className="space-y-4 text-xs sm:text-sm">
            {orderError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2 font-semibold">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{orderError}</span>
              </div>
            )}

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-950 space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-blue-900">
                <ShieldCheck className="w-4 h-4 text-blue-700" />
                Farmer Approval Required
              </p>
              <p className="text-stone-700 text-xs font-medium">
                By requesting lot procurement, order status becomes <span className="font-bold text-stone-900">Pending</span>. Seller identity reveals automatically once the farmer confirms.
              </p>
            </div>

            <div>
              <span className="text-stone-500 block font-semibold text-xs">Selected Harvest Lot:</span>
              <p className="text-sm font-bold text-stone-900">
                {selectedListing.crop} ({selectedListing.variety}) - Grade {selectedListing.quality.grade}
              </p>
              <p className="text-stone-600 text-xs font-medium">
                Seller: {selectedListing.anonSellerId} • District: {selectedListing.district}
              </p>
            </div>

            <div>
              <label className="block font-bold text-stone-800 mb-1 text-xs">
                Procurement Quantity (kg)
              </label>
              <input
                type="number"
                max={selectedListing.quantityKg}
                min={100}
                step={50}
                value={orderQuantity}
                onChange={(e) => setOrderQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-bold border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-stone-900 bg-white"
              />
              <span className="text-[10px] text-stone-500 mt-0.5 block font-semibold">
                Max Available in Lot: {selectedListing.quantityKg} kg
              </span>
            </div>

            <div>
              <label className="block font-bold text-stone-800 mb-1 text-xs">
                Delivery Destination Address
              </label>
              <input
                type="text"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm font-semibold border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-stone-900 bg-white"
              />
            </div>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1 font-mono text-xs">
              <div className="flex justify-between text-stone-700">
                <span>Unit Offer Price:</span>
                <span className="font-bold">₹{selectedListing.priceExpected}/kg</span>
              </div>
              <div className="flex justify-between text-stone-700">
                <span>Quantity Requested:</span>
                <span className="font-bold">{orderQuantity} kg</span>
              </div>
              <div className="flex justify-between text-stone-900 font-bold text-sm pt-1 border-t border-stone-200">
                <span>Total Payable Amount:</span>
                <span className="text-emerald-800 font-black">₹{(orderQuantity * selectedListing.priceExpected).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <Button
              variant="primary"
              fullWidth
              loading={isSubmittingOrder}
              onClick={handleSubmitOrder}
            >
              Request Order (Pending Farmer Approval)
            </Button>
          </div>
        )}
      </Modal>

      {/* RATING MODAL */}
      <Modal
        isOpen={!!ratingOrderId}
        onClose={() => {
          setRatingOrderId(null);
          setRatingError(null);
        }}
        title="Rate Farmer Fulfillment"
        description="Your rating updates the farmer's transparent trust reputation score on Vasundhara."
        size="sm"
      >
        <div className="space-y-4 text-center">
          {ratingError && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-1.5 text-left font-semibold">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{ratingError}</span>
            </div>
          )}

          <div className="flex justify-center gap-2 py-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setSelectedStarRating(star)}
                className="p-1 cursor-pointer hover:scale-110 transition-transform focus:outline-none"
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= selectedStarRating
                      ? 'text-amber-500 fill-amber-500'
                      : 'text-stone-300'
                  }`}
                />
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <Button
              variant="secondary"
              fullWidth
              disabled={isSubmittingRating}
              onClick={() => {
                setRatingOrderId(null);
                setRatingError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              fullWidth
              loading={isSubmittingRating}
              onClick={handleRateSubmit}
            >
              Submit Rating
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};
