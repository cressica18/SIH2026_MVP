import React, { useState, useEffect, useCallback } from 'react';
import {
  Role,
  Language,
  SafetyReport,
  AppNotification,
  CollectorProfile,
  RecyclerProfile,
  ScrapLot,
  SmartPool,
  PoolOffer,
  SettlementRecord,
  GovScheme,
} from './types';
import {
  SEED_NOTIFICATIONS,
} from './data/seedData';
import { Navbar } from './components/Navbar';
import { AdminView } from './components/AdminView';
import { CollectorView } from './components/CollectorView';
import { RecyclerView } from './components/RecyclerView';
import { DemoWalkthroughModal } from './components/DemoWalkthroughModal';
import { AepsModal } from './components/AepsModal';
import { MarketInsightsModal } from './components/MarketInsightsModal';
import { useAuth } from './lib/auth-context';
import { OtpScreen } from './app/(auth)/otp-screen';
import { OnboardingScreen } from './components/OnboardingScreen';

export default function App() {
  const { isAuthenticated, user, switchRole, isLoading: isAuthLoading } = useAuth();
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  // Global State
  const [currentRole, setCurrentRole] = useState<Role>('collector');
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');
  const [adminSubTab, setAdminSubTab] = useState<string>('reports');
  const [collectorSubTab, setCollectorSubTab] = useState<string>('pools');
  const [recyclerSubTab, setRecyclerSubTab] = useState<string>('pools');

  // Modals
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [isAepsModalOpen, setIsAepsModalOpen] = useState(false);
  const [isMarketInsightsOpen, setIsMarketInsightsOpen] = useState(false);

  // Core Data Collections
  const [reports, setReports] = useState<SafetyReport[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>(SEED_NOTIFICATIONS);
  const [schemes, setSchemes] = useState<GovScheme[]>([]);
  const [scrapLots, setScrapLots] = useState<ScrapLot[]>([]);
  const [smartPools, setSmartPools] = useState<SmartPool[]>([]);
  const [poolOffers, setPoolOffers] = useState<PoolOffer[]>([]);
  const [settlements, setSettlements] = useState<SettlementRecord[]>([]);

  // Dynamic Collector / Recycler State
  const [collector, setCollector] = useState<CollectorProfile | null>(null);
  const [recycler, setRecycler] = useState<RecyclerProfile | null>(null);

  // Fetch profile on auth
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setCollector(null);
      setRecycler(null);
      setReports([]);
      setSchemes([]);
      setNotifications([]);
      return;
    }
    setCurrentRole(user.role);
    setIsProfileLoading(true);

    // Reset profiles and notifications for previous roles to avoid stale data
    setCollector(null);
    setRecycler(null);
    setNotifications([]);

    async function fetchProfileAndData() {
      try {
        const token = localStorage.getItem('kabadiwala_token');

        // Fetch Profile
        const res = await fetch('/api/users/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (user?.role === 'collector') setCollector(data.profile);
          else if (user?.role === 'recycler') setRecycler(data.profile);
        } else if (res.status === 404) {
          if (user?.role === 'collector') setCollector(null);
          else if (user?.role === 'recycler') setRecycler(null);
        }

        // Fetch Scrap Lots
        const scrapLotsRes = await fetch('/api/scrap-lots', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (scrapLotsRes.ok) {
          const scrapLotsData = await scrapLotsRes.json();
          setScrapLots(scrapLotsData.lots || []);
        }

        // Fetch Smart Pools
        const smartPoolsRes = await fetch('/api/smart-pools', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (smartPoolsRes.ok) {
          const smartPoolsData = await smartPoolsRes.json();
          setSmartPools(smartPoolsData.pools || []);
        }

        // Fetch Pool Offers
        const poolOffersRes = await fetch('/api/smart-pools/offers', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (poolOffersRes.ok) {
          const poolOffersData = await poolOffersRes.json();
          setPoolOffers(poolOffersData.offers || []);
        }

        // Fetch Settlements
        const settlementsRes = await fetch('/api/smart-pools/settlements', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (settlementsRes.ok) {
          const settlementsData = await settlementsRes.json();
          setSettlements(settlementsData.settlements || []);
        }

        // Fetch safety reports for admin
        if (user?.role === 'admin') {
          const reportsRes = await fetch('/api/reports/admin', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (reportsRes.ok) {
            const reportsData = await reportsRes.json();
            setReports(reportsData.reports || []);
          }
        }
      } catch (err) {
        console.error('Failed to fetch data', err);
      } finally {
        setIsProfileLoading(false);
      }
    }
    fetchProfileAndData();
  }, [isAuthenticated, user]);

  // Fetch notifications from backend with polling
  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem('kabadiwala_token');
    if (!token) return;
    try {
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  }, []);

  // Poll for notifications every 30 seconds
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, user, fetchNotifications]);

  // Add a new scrap lot from collector voice or manual input
  const handleAddScrapLot = async (newLot: ScrapLot): Promise<boolean> => {
    try {
      const token = localStorage.getItem('kabadiwala_token');
      const res = await fetch('/api/scrap-lots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newLot),
      });

      if (res.ok) {
        const createdLot = await res.json();
        setScrapLots((prev) => [createdLot, ...prev]);

        const notif: AppNotification = {
          id: `notif_${Date.now()}`,
          title: 'New Scrap Lot Listed',
          message: `Lot ${createdLot.materialType} (${createdLot.estimatedWeightKg} kg) is active under ${createdLot.anonCollectorId}.`,
          timestamp: 'Just now',
          read: false,
          roleTarget: 'recycler',
          type: 'match',
        };
        setNotifications((prev) => [notif, ...prev]);
        return true;
      } else {
        console.error('Failed to create scrap lot', await res.text());
        return false;
      }
    } catch (err) {
      console.error('Failed to create scrap lot', err);
      return false;
    }
  };

  // Update scrap lot status
  const handleUpdateScrapLotStatus = async (id: string, status: string) => {
    try {
      const token = localStorage.getItem('kabadiwala_token');
      const res = await fetch(`/api/scrap-lots/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const updated = await res.json();
        setScrapLots((prev) => prev.map((l) => (l.id === id ? updated : l)));
      }
    } catch (err) {
      console.error('Failed to update scrap lot status', err);
    }
  };

  // Create a pool offer from a recycler
  const handleCreatePoolOffer = async (offer: {
    poolId: string;
    offeredPricePerKg: number;
    notes?: string;
  }): Promise<boolean> => {
    try {
      const token = localStorage.getItem('kabadiwala_token');
      const res = await fetch('/api/smart-pools/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(offer),
      });
      if (!res.ok) {
        console.error('Failed to create pool offer', await res.text());
        return false;
      }
      const createdOffer = await res.json();
      setPoolOffers((prev) => [createdOffer, ...prev]);
      return true;
    } catch (err) {
      console.error('Failed to create pool offer', err);
      return false;
    }
  };

  // Complete a settlement handover
  const handleCompleteHandover = async (settlementId: string, qrCode?: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem('kabadiwala_token');
      const res = await fetch('/api/smart-pools/settlements/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ settlementId, qrCode }),
      });
      if (!res.ok) {
        console.error('Failed to complete handover', await res.text());
        return false;
      }
      const updatedSettlement = await res.json();
      setSettlements((prev) => prev.map((s) => (s.id === settlementId ? updatedSettlement : s)));
      return true;
    } catch (err) {
      console.error('Failed to complete handover', err);
      return false;
    }
  };

  // Admin updates report status
  const handleUpdateReportStatus = async (
    reportId: string,
    status: 'open' | 'reviewing' | 'resolved',
    resolutionNotes: string
  ): Promise<SafetyReport | null> => {
    try {
      const token = localStorage.getItem('kabadiwala_token');
      const res = await fetch(`/api/reports/admin/${reportId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, resolutionNotes }),
      });

      if (!res.ok) {
        console.error('Failed to update report status', await res.text());
        return null;
      }

      const data = await res.json();
      const updated: SafetyReport = data.report;

      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...updated } : r))
      );
      return updated;
    } catch (err) {
      console.error('Failed to update report status', err);
      return null;
    }
  };

  // Notification clear or read
  const handleMarkNotificationAsRead = async (notifId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
    );

    try {
      const token = localStorage.getItem('kabadiwala_token');
      if (token) {
        await fetch(`/api/notifications/${notifId}/read`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (err) {
      console.error('Failed to mark notification as read on backend', err);
    }
  };

  // Jump to step from Demo Story Modal
  const handleJumpToStep = async (role: Role, tabName?: string) => {
    if (role === 'admin' && tabName) setAdminSubTab(tabName);
    if (role === 'collector' && tabName) setCollectorSubTab(tabName);
    if (role === 'recycler' && tabName) setRecyclerSubTab(tabName);

    if (user?.role !== role) {
      await switchRole(role);
    } else {
      setCurrentRole(role);
    }
  };

  if (isAuthLoading || isProfileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-900">
        <div className="text-cream-400 text-sm">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <OtpScreen onSuccess={(role) => setCurrentRole(role)} />;
  }

  const needsOnboarding =
    (currentRole === 'collector' && !collector) ||
    (currentRole === 'recycler' && !recycler);

  if (needsOnboarding) {
    return (
      <OnboardingScreen
        onComplete={(profile: any) => {
          if (currentRole === 'collector') setCollector(profile);
          else if (currentRole === 'recycler') setRecycler(profile);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-bg-900 text-cream-100 font-sans flex flex-col selection:bg-harvest-500 selection:text-bg-950">
      <Navbar
        currentRole={currentRole}
        currentLanguage={currentLanguage}
        onLanguageChange={setCurrentLanguage}
        onOpenDemoGuide={() => setIsDemoModalOpen(true)}
        onOpenInsights={() => setIsMarketInsightsOpen(true)}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotificationAsRead}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {currentRole === 'collector' && collector && (
          <CollectorView
            collector={collector}
            lots={scrapLots}
            currentLanguage={currentLanguage}
            onAddLot={handleAddScrapLot}
            onUpdateLotStatus={handleUpdateScrapLotStatus}
            initialTab={collectorSubTab}
          />
        )}

        {currentRole === 'recycler' && recycler && (
          <RecyclerView
            recycler={recycler}
            pools={smartPools}
            offers={poolOffers}
            settlements={settlements}
            currentLanguage={currentLanguage}
            onCreateOffer={handleCreatePoolOffer}
            onCompleteHandover={handleCompleteHandover}
            onRefresh={async () => {
              const token = localStorage.getItem('kabadiwala_token');
              const [spRes, poRes, setRes] = await Promise.all([
                fetch('/api/smart-pools', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/smart-pools/offers', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/smart-pools/settlements', { headers: { Authorization: `Bearer ${token}` } }),
              ]);
              if (spRes.ok) setSmartPools((await spRes.json()).pools || []);
              if (poRes.ok) setPoolOffers((await poRes.json()).offers || []);
              if (setRes.ok) setSettlements((await setRes.json()).settlements || []);
            }}
            initialTab={recyclerSubTab}
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

      <footer className="bg-bg-850 border-t border-bg-700 py-6 px-4 text-center text-xs text-cream-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-semibold text-cream-100">
            Kabadiwala Connect • Verified Smart Lot Pool • SIH 26229 • Clean & Green Technology
          </p>
          <div className="flex items-center gap-4 text-[11px] text-cream-500">
            <span>Scrap Market Integration</span>
            <span className="text-cream-600">•</span>
            <span>AI Quality Assessment</span>
            <span className="text-cream-600">•</span>
            <span>Smart Pooling Engine</span>
          </div>
        </div>
      </footer>

      <DemoWalkthroughModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        onJumpToStep={handleJumpToStep}
      />

      <AepsModal
        isOpen={isAepsModalOpen}
        onClose={() => setIsAepsModalOpen(false)}
        farmerName="Collector"
        defaultAmount={20000}
        onSuccess={() => {}}
      />

      <MarketInsightsModal
        isOpen={isMarketInsightsOpen}
        onClose={() => setIsMarketInsightsOpen(false)}
      />
    </div>
  );
}
