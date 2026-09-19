import React, { useState, useEffect, useCallback } from 'react';
import {
  Role,
  Language,
  Listing,
  Order,
  LogisticsPool,
  SafetyReport,
  AppNotification,
  FarmerProfile,
  BuyerProfile,
  LogisticsProfile,
  GovScheme,
  AdvanceRequest,
  RiskAssessment,
} from './types';
import {
  SEED_FARMERS,
  SEED_BUYERS,
  SEED_LOGISTICS,
  SEED_LISTINGS,
  SEED_ORDERS,
  SEED_LOGISTICS_POOLS,
  SEED_GOV_SCHEMES,
  SEED_SAFETY_REPORTS,
  SEED_NOTIFICATIONS,
  SEED_RISK_ASSESSMENTS,
} from './data/seedData';
import { Navbar } from './components/Navbar';
import { FarmerView } from './components/FarmerView';
import { BuyerView } from './components/BuyerView';
import { LogisticsView } from './components/LogisticsView';
import { AdminView } from './components/AdminView';
import { DemoWalkthroughModal } from './components/DemoWalkthroughModal';
import { AepsModal } from './components/AepsModal';
import { MarketInsightsModal } from './components/MarketInsightsModal';
import { useAuth } from './lib/auth-context';
import { OtpScreen } from './app/(auth)/otp-screen';
import { OnboardingScreen } from './components/OnboardingScreen';

export default function App() {
  const { isAuthenticated, user, isLoading: isAuthLoading } = useAuth();
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  // Global State
  const [currentRole, setCurrentRole] = useState<Role>('farmer');
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');
  const [farmerSubTab, setFarmerSubTab] = useState<string>('listings');
  const [buyerSubTab, setBuyerSubTab] = useState<string>('marketplace');
  const [logisticsSubTab, setLogisticsSubTab] = useState<string>('pools');
  const [adminSubTab, setAdminSubTab] = useState<string>('reports');

  // Modals
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [isAepsModalOpen, setIsAepsModalOpen] = useState(false);
  const [isMarketInsightsOpen, setIsMarketInsightsOpen] = useState(false);
  const [aepsWithdrawAmount, setAepsWithdrawAmount] = useState<number>(20000);

  // Core Data Collections
  const [listings, setListings] = useState<Listing[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [pools, setPools] = useState<LogisticsPool[]>([]);
  const [reports, setReports] = useState<SafetyReport[]>(SEED_SAFETY_REPORTS);
  const [notifications, setNotifications] = useState<AppNotification[]>(SEED_NOTIFICATIONS);
  const [schemes, setSchemes] = useState<GovScheme[]>([]);
  const [advances, setAdvances] = useState<AdvanceRequest[]>([]);

  // Dynamic Farmer / Risk / Buyer State
  const [farmer, setFarmer] = useState<FarmerProfile | null>(null);
  const [buyer, setBuyer] = useState<BuyerProfile | null>(null);
  const [logistics, setLogistics] = useState<LogisticsProfile | null>(null);
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null);

  // Fetch profile on auth
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    setCurrentRole(user.role);
    setIsProfileLoading(true);

    async function fetchProfileAndListings() {
      try {
        const token = localStorage.getItem('vasundhara_token');
        
        // Fetch Profile
        const res = await fetch('/api/users/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (user?.role === 'farmer') setFarmer(data.profile);
          else if (user?.role === 'buyer') setBuyer(data.profile);
          else if (user?.role === 'logistics') setLogistics(data.profile);
        } else if (res.status === 404) {
          // Profile needs to be created
          if (user?.role === 'farmer') setFarmer(null);
          else if (user?.role === 'buyer') setBuyer(null);
          else if (user?.role === 'logistics') setLogistics(null);
        }

        // Fetch Listings
        if (user?.role === 'buyer') {
          const matchRes = await fetch(`/api/matching/buyer/${user.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (matchRes.ok) {
            setListings(await matchRes.json());
          } else {
            // fallback
            const listingsRes = await fetch('/api/listings', {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (listingsRes.ok) {
              const listingsData = await listingsRes.json();
              setListings(listingsData.listings);
            }
          }
        } else {
          // public / other roles
          const listingsRes = await fetch('/api/listings', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (listingsRes.ok) {
            const listingsData = await listingsRes.json();
            setListings(listingsData.listings);
          }
        }

        // Fetch role-scoped orders
        const ordersRes = await fetch('/api/orders', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          setOrders(ordersData.orders);
        }

        // Fetch logistics pools (public)
        const poolsRes = await fetch('/api/logistics/pools');
        if (poolsRes.ok) {
          const poolsData = await poolsRes.json();
          setPools(poolsData.pools);
        }

        // Fetch schemes — personalized match for farmers, public list for others
        if (user?.role === 'farmer' && user?.id) {
          const schemesRes = await fetch(`/api/schemes/match/${user.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (schemesRes.ok) {
            const schemesData = await schemesRes.json();
            setSchemes(schemesData.schemes);
          } else {
            // Fallback to public list if match endpoint fails
            const fallbackRes = await fetch('/api/schemes');
            if (fallbackRes.ok) {
              const fallbackData = await fallbackRes.json();
              setSchemes(fallbackData.schemes);
            }
          }
        } else {
          const schemesRes = await fetch('/api/schemes');
          if (schemesRes.ok) {
            const schemesData = await schemesRes.json();
            setSchemes(schemesData.schemes);
          }
        }


        // Fetch finance/risk data if applicable
        if (user?.role === 'farmer' || user?.role === 'admin') {
          // Fetch advances
          const advancesRes = await fetch('/api/finance/advances', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (advancesRes.ok) {
            const advData = await advancesRes.json();
            setAdvances(advData.advances);
          }

          // Fetch risk profile (for farmer view)
          if (user?.role === 'farmer') {
            const riskRes = await fetch(`/api/finance/risk/${user.id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (riskRes.ok) {
              setRiskAssessment(await riskRes.json());
            }

            // Phase 12: Fetch live reputation score from reputation service
            const repRes = await fetch(`/api/reputation/${user.id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (repRes.ok) {
              const repData = await repRes.json();
              setFarmer((prev) =>
                prev ? { ...prev, reputationScore: repData.score } : prev
              );
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch data', err);
      } finally {
        setIsProfileLoading(false);
      }
    }
    fetchProfileAndListings();
  }, [isAuthenticated, user]);

  // Fetch notifications from backend with polling
  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem('vasundhara_token');
    if (!token) return;
    try {
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  }, []);

  // Poll for notifications every 30 seconds
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    fetchNotifications(); // Initial fetch
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, user, fetchNotifications]);

  // Add a new listing from farmer voice or manual input
  const handleAddListing = async (newListing: Listing) => {
    try {
      const token = localStorage.getItem('vasundhara_token');
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newListing)
      });
      
      if (res.ok) {
        const createdListing = await res.json();
        setListings((prev) => [createdListing, ...prev]);

        // Push system notification
        const notif: AppNotification = {
          id: `notif_${Date.now()}`,
          title: 'New Harvest Batch Listed',
          message: `Batch ${createdListing.crop} (${createdListing.quantityKg} kg) is active under ${createdListing.anonSellerId}.`,
          timestamp: 'Just now',
          read: false,
          roleTarget: 'buyer',
          type: 'order',
        };
        setNotifications((prev) => [notif, ...prev]);
      }
    } catch (err) {
      console.error('Failed to create listing', err);
    }
  };

  // Update listing status
  const handleUpdateListingStatus = async (id: string, status: string) => {
    try {
      const token = localStorage.getItem('vasundhara_token');
      const res = await fetch(`/api/listings/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        const updated = await res.json();
        setListings((prev) => prev.map((l) => (l.id === id ? updated : l)));
      }
    } catch (err) {
      console.error('Failed to update listing status', err);
    }
  };

  // Buyer places an order — POST to backend, then update local state
  const handlePlaceOrder = async (newOrder: Order) => {
    try {
      const token = localStorage.getItem('vasundhara_token');
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newOrder),
      });
      if (!res.ok) {
        console.error('Failed to create order', await res.text());
        return;
      }
      const createdOrder: Order = await res.json();
      setOrders((prev) => [createdOrder, ...prev]);

      // Update listing availability in local state (backend already reduced qty)
      setListings((prev) =>
        prev.map((l) =>
          l.id === createdOrder.listingId
            ? {
                ...l,
                quantityKg: Math.max(0, l.quantityKg - createdOrder.quantityKg),
                status: l.quantityKg - createdOrder.quantityKg <= 0 ? 'matched' : 'active',
              }
            : l
        )
      );

      // Notifications
      const notifFarmer: AppNotification = {
        id: `notif_${Date.now()}_1`,
        title: 'Order Confirmed: Identity Revealed',
        message: `Buyer ${createdOrder.buyerName} committed to order #${createdOrder.id}. Contact unlocked: ${createdOrder.buyerPhone}.`,
        timestamp: 'Just now',
        read: false,
        roleTarget: 'farmer',
        type: 'reveal',
      };
      const notifLogistics: AppNotification = {
        id: `notif_${Date.now()}_2`,
        title: 'New Pickup Corridor Added',
        message: `Order #${createdOrder.id} ready for pooling in ${createdOrder.sellerDistrict} corridor.`,
        timestamp: 'Just now',
        read: false,
        roleTarget: 'logistics',
        type: 'logistics',
      };
      setNotifications((prev) => [notifFarmer, notifLogistics, ...prev]);
    } catch (err) {
      console.error('Failed to place order', err);
    }
  };

  // Update Order Status (Phase 11 State Machine)
  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const token = localStorage.getItem('vasundhara_token');
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        console.error('Failed to update order status', await res.text());
        return;
      }
      const updatedOrder = await res.json();
      setOrders((prev) => prev.map((ord) => (ord.id === orderId ? updatedOrder : ord)));
    } catch (err) {
      console.error('Failed to update order status', err);
    }
  };

  // Buyer rates farmer fulfillment — Phase 12: persist to backend reputation service
  const handleRateFarmer = async (orderId: string, rating: number) => {
    // Update local order state immediately (optimistic)
    setOrders((prev) =>
      prev.map((ord) => (ord.id === orderId ? { ...ord, buyerRating: rating } : ord))
    );

    try {
      const token = localStorage.getItem('vasundhara_token');
      const order = orders.find((o) => o.id === orderId);
      if (!order) return;

      // The target is the farmer identified by anonSellerId — we use anonSellerId for now;
      // the backend resolves to the farmer's userId from SEED_FARMERS.
      // For farmers whose identities are revealed, the sellerRealName is exposed but userId is not
      // in the order payload. We use the listing-based sellerId approach:
      // the order's anonSellerId maps to a farmer.id via SEED_FARMERS in the backend.
      // We pass anonSellerId as targetUserId and the backend normalises it.
      const res = await fetch('/api/reputation/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          orderId,
          targetUserId: order.anonSellerId, // backend resolves via SEED_FARMERS
          eventType: 'buyer_rating',
          scoreImpact: rating,
          notes: `Buyer rating for order ${orderId}`,
        }),
      });

      if (res.ok) {
        const { updatedScore } = await res.json();
        // Update local farmer reputation score if we have a farmer view loaded
        if (farmer && updatedScore) {
          setFarmer((prev) =>
            prev ? { ...prev, reputationScore: updatedScore.score } : prev
          );
        }
      } else {
        console.warn('Failed to post reputation event (may need a settled order)', await res.text());
      }
    } catch (err) {
      console.error('Failed to post reputation event', err);
    }
  };


  // Logistics carrier status updates — PATCH backend pool then update local state
  const handleUpdatePoolStatus = async (
    poolId: string,
    status: 'assigned' | 'in_transit' | 'delivered'
  ) => {
    try {
      const token = localStorage.getItem('vasundhara_token');
      const res = await fetch(`/api/logistics/pools/${poolId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        console.error('Failed to update pool status', await res.text());
        return;
      }
      const updatedPool = await res.json();
      setPools((prev) => prev.map((p) => (p.id === poolId ? updatedPool : p)));

      if (status === 'delivered') {
        // Backend already marks orders as settled; refresh orders
        const ordToken = localStorage.getItem('vasundhara_token');
        const ordRes = await fetch('/api/orders', {
          headers: { Authorization: `Bearer ${ordToken}` },
        });
        if (ordRes.ok) {
          const ordData = await ordRes.json();
          setOrders(ordData.orders);
        }
      }
    } catch (err) {
      console.error('Failed to update pool status', err);
    }
  };

  // Complete specific waypoint stop
  const handleCompleteStop = async (poolId: string, stopId: string) => {
    try {
      const token = localStorage.getItem('vasundhara_token');
      const res = await fetch(`/api/logistics/pools/${poolId}/stops/${stopId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        console.error('Failed to update stop status', await res.text());
        return;
      }
      const updatedPool = await res.json();
      setPools((prev) => prev.map((p) => (p.id === poolId ? updatedPool : p)));

      // If this triggered delivery, refresh orders
      if (updatedPool.status === 'delivered') {
        const ordToken = localStorage.getItem('vasundhara_token');
        const ordRes = await fetch('/api/orders', {
          headers: { Authorization: `Bearer ${ordToken}` },
        });
        if (ordRes.ok) {
          const ordData = await ordRes.json();
          setOrders(ordData.orders);
        }
      }
    } catch (err) {
      console.error('Failed to update stop status', err);
    }
  };

  const handleCreatePool = async (orderIds: string[]) => {
    try {
      const token = localStorage.getItem('vasundhara_token');
      const res = await fetch('/api/logistics/pools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderIds }),
      });
      if (!res.ok) {
        console.error('Failed to create pool', await res.text());
        return;
      }
      const newPool = await res.json();
      setPools((prev) => [...prev, newPool]);
      
      // Refresh orders since their poolId/status changed
      const ordRes = await fetch('/api/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (ordRes.ok) {
        const ordData = await ordRes.json();
        setOrders(ordData.orders);
      }
    } catch (err) {
      console.error('Failed to create pool', err);
    }
  };

  // Whistleblower Safety Report submission
  const handleSubmitSafetyReport = (rep: {
    category: any;
    description: string;
    isAnonymous: boolean;
    reportedEntityName: string;
  }) => {
    const newReport: SafetyReport = {
      id: `REP-${Math.floor(100 + Math.random() * 900)}`,
      reporterName: rep.isAnonymous ? 'Anonymous Farmer' : (farmer?.name || 'Farmer'),
      isAnonymous: rep.isAnonymous,
      category: rep.category,
      reportedEntityName: rep.reportedEntityName,
      description: rep.description,
      status: 'open',
      createdAt: 'Just now',
    };

    setReports((prev) => [newReport, ...prev]);

    // Add alert notification for Admin
    const notifAdmin: AppNotification = {
      id: `notif_${Date.now()}`,
      title: 'New Anonymous Safety Report',
      message: `Report filed regarding ${rep.reportedEntityName} (${rep.category}).`,
      timestamp: 'Just now',
      read: false,
      roleTarget: 'admin',
      type: 'safety',
    };
    setNotifications((prev) => [notifAdmin, ...prev]);
  };

  const handleRequestAdvance = async (amount: number, purpose: string, simulateAeps: boolean) => {
    try {
      const token = localStorage.getItem('vasundhara_token');
      const res = await fetch('/api/finance/advances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amountRequested: amount, purpose, simulateAeps })
      });
      if (res.ok) {
        const adv = await res.json();
        setAdvances((prev) => [adv, ...prev]);
        if (simulateAeps) {
          setIsAepsModalOpen(true);
        }
      } else {
        console.error('Failed to request advance', await res.text());
      }
    } catch (err) {
      console.error('Error requesting advance', err);
    }
  };

  // Admin update on report status
  const handleUpdateReportStatus = (
    reportId: string,
    status: 'open' | 'reviewing' | 'resolved',
    resolutionNotes: string
  ) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId ? { ...r, status, resolutionNotes } : r
      )
    );
  };

  // Notification clear or read
  const handleMarkNotificationAsRead = (notifId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
    );
  };

  // Jump to step from 7-Step Demo Story Modal
  const handleJumpToStep = (role: Role, tabName?: string) => {
    setCurrentRole(role);
    if (role === 'farmer' && tabName) setFarmerSubTab(tabName);
    if (role === 'buyer' && tabName) setBuyerSubTab(tabName);
    if (role === 'logistics' && tabName) setLogisticsSubTab(tabName);
    if (role === 'admin' && tabName) setAdminSubTab(tabName);
  };

  const handleOpenAepsModalWithAmount = (amount: number) => {
    setAepsWithdrawAmount(amount);
    setIsAepsModalOpen(true);
  };

  const handleAepsSuccess = (amount: number, txnRef: string) => {
      const notif: AppNotification = {
        id: `notif_${Date.now()}`,
        title: 'AEPS Cash-Out Disbursed',
        message: `₹${amount.toLocaleString('en-IN')} withdrawn via Bank Mitra (Ref: ${txnRef}).`,
        timestamp: 'Just now',
        read: false,
        roleTarget: 'farmer',
        type: 'finance',
      };
      setNotifications((prev) => [notif, ...prev]);
    };

    if (isAuthLoading || isProfileLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-stone-100">
          <div className="text-stone-600 text-sm">Loading...</div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return <OtpScreen onSuccess={(role) => setCurrentRole(role)} />;
    }

    const needsOnboarding =
      (currentRole === 'farmer' && !farmer) ||
      (currentRole === 'buyer' && !buyer) ||
      (currentRole === 'logistics' && !logistics);

    if (needsOnboarding) {
      return (
        <OnboardingScreen
          onComplete={(profile: any) => {
            if (currentRole === 'farmer') setFarmer(profile);
            else if (currentRole === 'buyer') setBuyer(profile);
            else if (currentRole === 'logistics') setLogistics(profile);
          }}
        />
      );
    }

return (
      <div className="min-h-screen bg-stone-100/70 text-stone-900 font-sans flex flex-col selection:bg-emerald-500 selection:text-white">
       
       {/* Top Navigation Bar */}
       <Navbar
         currentRole={currentRole}
         currentLanguage={currentLanguage}
         onLanguageChange={setCurrentLanguage}
         onOpenDemoGuide={() => setIsDemoModalOpen(true)}
         onOpenInsights={() => setIsMarketInsightsOpen(true)}
         notifications={notifications}
         onMarkNotificationRead={handleMarkNotificationAsRead}
       />

      {/* Main Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {currentRole === 'farmer' && farmer && (
          <FarmerView
            farmer={farmer}
            listings={listings.filter((l) => l.anonSellerId === farmer.anonSellerId)}
            orders={orders.filter((o) => o.anonSellerId === farmer.anonSellerId)}
            schemes={schemes}
            riskAssessment={riskAssessment!}
            advances={advances}
            currentLanguage={currentLanguage}
            onAddListing={handleAddListing}
            onUpdateListingStatus={handleUpdateListingStatus}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onOpenAepsModal={handleOpenAepsModalWithAmount}
            onSubmitSafetyReport={handleSubmitSafetyReport}
            onRequestAdvance={handleRequestAdvance}
            initialTab={farmerSubTab}
          />
        )}

        {currentRole === 'buyer' && buyer && (
          <BuyerView
            buyer={buyer}
            listings={listings.filter((l) => l.status === 'active')}
            orders={orders.filter((o) => o.buyerId === buyer.id)}
            currentLanguage={currentLanguage}
            onPlaceOrder={handlePlaceOrder}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onRateFarmer={handleRateFarmer}
            initialTab={buyerSubTab}
          />
        )}

        {currentRole === 'logistics' && logistics && (
          <LogisticsView
            logistics={logistics}
            pools={pools}
            orders={orders} // Pass orders to view unassigned ones
            currentLanguage={currentLanguage}
            onUpdatePoolStatus={handleUpdatePoolStatus}
            onCompleteStop={handleCompleteStop}
            onCreatePool={handleCreatePool}
          />
        )}

        {currentRole === 'admin' && (
          <AdminView
            reports={reports}
            schemes={schemes}
            currentLanguage={currentLanguage}
            onUpdateReportStatus={handleUpdateReportStatus}
            initialTab={adminSubTab}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-stone-200 py-6 px-4 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-semibold text-stone-700">
            Vasundhara (वसुंधरा) • Direct Farmgate Digital Commerce & Trust Platform
          </p>
          <div className="flex items-center gap-4 text-[11px] text-stone-500">
            <span>Agmarknet Mandi Integration</span>
            <span>•</span>
            <span>MobileNet CNN Quality Grading</span>
            <span>•</span>
            <span>AEPS Cash-Out</span>
          </div>
        </div>
      </footer>

      {/* 7-Step Evaluation Demo Walkthrough Modal */}
      <DemoWalkthroughModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        onJumpToStep={handleJumpToStep}
      />

      {/* Simulated AEPS Biometric Cash-Out Modal */}
      <AepsModal
        isOpen={isAepsModalOpen}
        onClose={() => setIsAepsModalOpen(false)}
        farmerName={farmer?.name || 'Farmer'}
        defaultAmount={aepsWithdrawAmount}
        onSuccess={handleAepsSuccess}
      />

      {/* Agmarknet Mandi Price Insights Modal */}
      <MarketInsightsModal
        isOpen={isMarketInsightsOpen}
        onClose={() => setIsMarketInsightsOpen(false)}
      />

    </div>
  );
}
