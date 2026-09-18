import React, { useState } from 'react';
import {
  Role,
  Language,
  Listing,
  Order,
  LogisticsPool,
  SafetyReport,
  AppNotification,
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

export default function App() {
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
  const [listings, setListings] = useState<Listing[]>(SEED_LISTINGS);
  const [orders, setOrders] = useState<Order[]>(SEED_ORDERS);
  const [pools, setPools] = useState<LogisticsPool[]>(SEED_LOGISTICS_POOLS);
  const [reports, setReports] = useState<SafetyReport[]>(SEED_SAFETY_REPORTS);
  const [notifications, setNotifications] = useState<AppNotification[]>(SEED_NOTIFICATIONS);

  // Dynamic Farmer / Risk / Buyer State
  const [farmer, setFarmer] = useState(SEED_FARMERS[0]);
  const [buyer, setBuyer] = useState(SEED_BUYERS[0]);
  const [logistics, setLogistics] = useState(SEED_LOGISTICS[0]);
  const [riskAssessment, setRiskAssessment] = useState(SEED_RISK_ASSESSMENTS['farmer_1']);

  // Add a new listing from farmer voice or manual input
  const handleAddListing = (newListing: Listing) => {
    setListings((prev) => [newListing, ...prev]);

    // Push system notification
    const notif: AppNotification = {
      id: `notif_${Date.now()}`,
      title: 'New Harvest Batch Listed',
      message: `Batch ${newListing.crop} (${newListing.quantityKg} kg) is active under ${newListing.anonSellerId}.`,
      timestamp: 'Just now',
      read: false,
      roleTarget: 'buyer',
      type: 'order',
    };
    setNotifications((prev) => [notif, ...prev]);
  };

  // Buyer places an order (which instantly triggers mutual identity reveal)
  const handlePlaceOrder = (newOrder: Order) => {
    setOrders((prev) => [newOrder, ...prev]);

    // Update listing availability or status
    setListings((prev) =>
      prev.map((l) =>
        l.id === newOrder.listingId
          ? {
              ...l,
              quantityKg: Math.max(0, l.quantityKg - newOrder.quantityKg),
              status: l.quantityKg - newOrder.quantityKg <= 0 ? 'matched' : 'active',
            }
          : l
      )
    );

    // Create notification for farmer that trade was confirmed and identity revealed
    const notifFarmer: AppNotification = {
      id: `notif_${Date.now()}_1`,
      title: 'Order Confirmed: Identity Revealed',
      message: `Buyer ${newOrder.buyerName} committed to order #${newOrder.id}. Contact unlocked: ${newOrder.buyerPhone}.`,
      timestamp: 'Just now',
      read: false,
      roleTarget: 'farmer',
      type: 'reveal',
    };

    const notifLogistics: AppNotification = {
      id: `notif_${Date.now()}_2`,
      title: 'New Pickup Corridor Added',
      message: `Order #${newOrder.id} ready for pooling in ${newOrder.sellerDistrict} corridor.`,
      timestamp: 'Just now',
      read: false,
      roleTarget: 'logistics',
      type: 'logistics',
    };

    setNotifications((prev) => [notifFarmer, notifLogistics, ...prev]);
  };

  // Confirm order state
  const handleConfirmOrder = (orderId: string) => {
    setOrders((prev) =>
      prev.map((ord) =>
        ord.id === orderId
          ? {
              ...ord,
              status: 'confirmed',
              identityRevealed: true,
              identityRevealedAt: new Date().toLocaleTimeString(),
            }
          : ord
      )
    );
  };

  // Buyer rates farmer fulfillment
  const handleRateFarmer = (orderId: string, rating: number) => {
    setOrders((prev) =>
      prev.map((ord) => (ord.id === orderId ? { ...ord, buyerRating: rating } : ord))
    );

    // Recalculate farmer reputation
    setFarmer((prev) => ({
      ...prev,
      reputationScore: Number(((prev.reputationScore * 38 + rating) / 39).toFixed(1)),
      totalOrdersFulfilled: prev.totalOrdersFulfilled + 1,
    }));
  };

  // Logistics carrier status updates
  const handleUpdatePoolStatus = (
    poolId: string,
    status: 'assigned' | 'in_transit' | 'delivered'
  ) => {
    setPools((prev) =>
      prev.map((p) => (p.id === poolId ? { ...p, status } : p))
    );

    if (status === 'delivered') {
      // Mark relevant orders as delivered & settled
      const targetPool = pools.find((p) => p.id === poolId);
      if (targetPool) {
        setOrders((prev) =>
          prev.map((ord) =>
            targetPool.orderIds.includes(ord.id)
              ? { ...ord, status: 'settled' }
              : ord
          )
        );
      }
    }
  };

  // Complete specific waypoint stop
  const handleCompleteStop = (poolId: string, stopId: string) => {
    setPools((prev) =>
      prev.map((p) => {
        if (p.id !== poolId) return p;
        const updatedStops = p.routeStops.map((s) =>
          s.id === stopId ? { ...s, completed: true } : s
        );
        const allCompleted = updatedStops.every((s) => s.completed);
        return {
          ...p,
          routeStops: updatedStops,
          status: allCompleted ? 'delivered' : p.status,
        };
      })
    );
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
      reporterName: rep.isAnonymous ? 'Anonymous Farmer' : farmer.name,
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

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900 font-sans flex flex-col selection:bg-emerald-500 selection:text-white">
      
      {/* Top Navigation Bar */}
      <Navbar
        currentRole={currentRole}
        currentLanguage={currentLanguage}
        onRoleChange={setCurrentRole}
        onLanguageChange={setCurrentLanguage}
        onOpenDemoGuide={() => setIsDemoModalOpen(true)}
        onOpenInsights={() => setIsMarketInsightsOpen(true)}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotificationAsRead}
      />

      {/* Main Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {currentRole === 'farmer' && (
          <FarmerView
            farmer={farmer}
            listings={listings}
            orders={orders.filter((o) => o.anonSellerId === farmer.anonSellerId)}
            schemes={SEED_GOV_SCHEMES}
            riskAssessment={riskAssessment}
            currentLanguage={currentLanguage}
            onAddListing={handleAddListing}
            onOpenAepsModal={handleOpenAepsModalWithAmount}
            onSubmitSafetyReport={handleSubmitSafetyReport}
            initialTab={farmerSubTab}
          />
        )}

        {currentRole === 'buyer' && (
          <BuyerView
            buyer={buyer}
            listings={listings.filter((l) => l.status === 'active')}
            orders={orders.filter((o) => o.buyerId === buyer.id)}
            currentLanguage={currentLanguage}
            onPlaceOrder={handlePlaceOrder}
            onConfirmOrder={handleConfirmOrder}
            onRateFarmer={handleRateFarmer}
            initialTab={buyerSubTab}
          />
        )}

        {currentRole === 'logistics' && (
          <LogisticsView
            logistics={logistics}
            pools={pools}
            currentLanguage={currentLanguage}
            onUpdatePoolStatus={handleUpdatePoolStatus}
            onCompleteStop={handleCompleteStop}
          />
        )}

        {currentRole === 'admin' && (
          <AdminView
            reports={reports}
            schemes={SEED_GOV_SCHEMES}
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
        farmerName={farmer.name}
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
