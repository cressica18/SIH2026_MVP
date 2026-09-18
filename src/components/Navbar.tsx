import React, { useState } from 'react';
import {
  Role,
  Language,
  AppNotification,
} from '../types';
import { I18N_STRINGS } from '../data/i18n';
import {
  Sprout,
  UserCheck,
  Truck,
  ShieldCheck,
  Globe,
  Bell,
  Sparkles,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react';

interface NavbarProps {
  currentRole: Role;
  onRoleChange: (role: Role) => void;
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  notifications: AppNotification[];
  onOpenDemoGuide: () => void;
  onOpenInsights: () => void;
  onMarkNotificationRead: (id: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onRoleChange,
  currentLanguage,
  onLanguageChange,
  notifications,
  onOpenDemoGuide,
  onOpenInsights,
  onMarkNotificationRead,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const t = I18N_STRINGS[currentLanguage];

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2">
          
          {/* Brand Logo & Tagline */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-700/20 shrink-0">
              <Sprout className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl text-emerald-950 tracking-tight">
                  {t.appName}
                </span>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  SIH 2026 MVP
                </span>
              </div>
              <p className="text-xs text-stone-500 truncate hidden sm:block">
                {t.tagline}
              </p>
            </div>
          </div>

          {/* Role Switcher Pills */}
          <div className="hidden lg:flex items-center p-1 bg-stone-100/90 rounded-xl border border-stone-200/80">
            <button
              onClick={() => onRoleChange('farmer')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentRole === 'farmer'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-700 hover:text-emerald-700 hover:bg-stone-200/60'
              }`}
            >
              <Sprout className="w-3.5 h-3.5" />
              {t.roles.farmer}
            </button>
            <button
              onClick={() => onRoleChange('buyer')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentRole === 'buyer'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-700 hover:text-emerald-700 hover:bg-stone-200/60'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              {t.roles.buyer}
            </button>
            <button
              onClick={() => onRoleChange('logistics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentRole === 'logistics'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-700 hover:text-emerald-700 hover:bg-stone-200/60'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              {t.roles.logistics}
            </button>
            <button
              onClick={() => onRoleChange('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentRole === 'admin'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-700 hover:text-emerald-700 hover:bg-stone-200/60'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              {t.roles.admin}
            </button>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Judge Demo Flow Button */}
            <button
              onClick={onOpenDemoGuide}
              className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-sm shadow-amber-600/20 transition-all active:scale-95 cursor-pointer shrink-0"
              title="7-Step Evaluation Demo Walkthrough"
            >
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span className="hidden sm:inline">Demo Walkthrough</span>
              <span className="sm:hidden">Demo</span>
            </button>

            {/* Mandi Insights Button */}
            <button
              onClick={onOpenInsights}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 transition-all cursor-pointer shrink-0"
              title="Live Mandi Price Insights"
            >
              <TrendingUp className="w-4 h-4 text-emerald-700" />
              <span className="hidden md:inline">Mandi Insights</span>
            </button>

            {/* Language Switcher Dropdown */}
            <div className="relative flex items-center">
              <div className="flex items-center gap-1 bg-stone-100 border border-stone-200 rounded-xl px-2 py-1 text-xs">
                <Globe className="w-3.5 h-3.5 text-stone-600 shrink-0" />
                <select
                  value={currentLanguage}
                  onChange={(e) => onLanguageChange(e.target.value as Language)}
                  className="bg-transparent font-medium text-stone-800 focus:outline-none cursor-pointer"
                >
                  <option value="en">English (EN)</option>
                  <option value="hi">हिंदी (HI)</option>
                  <option value="mr">मराठी (MR)</option>
                  <option value="te">తెలుగు (TE)</option>
                  <option value="pa">ਪੰਜਾਬੀ (PA)</option>
                </select>
              </div>
            </div>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-stone-600 hover:text-emerald-700 hover:bg-stone-100 rounded-xl transition-all cursor-pointer"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Popover */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-stone-200 z-50 p-4">
                  <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                    <h4 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                      <Bell className="w-4 h-4 text-emerald-600" />
                      Live Platform Alerts
                    </h4>
                    <span className="text-xs text-stone-400">
                      {unreadCount} unread
                    </span>
                  </div>
                  <div className="divide-y divide-stone-100 max-h-72 overflow-y-auto mt-2">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => onMarkNotificationRead(notif.id)}
                        className={`p-2.5 rounded-lg transition-colors cursor-pointer text-left ${
                          notif.read ? 'bg-transparent opacity-75' : 'bg-emerald-50/70'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <p className="text-xs font-bold text-stone-900">
                            {notif.title}
                          </p>
                          <span className="text-[10px] text-stone-400 whitespace-nowrap">
                            {notif.timestamp}
                          </span>
                        </div>
                        <p className="text-xs text-stone-600 mt-1 line-clamp-2">
                          {notif.message}
                        </p>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="w-full mt-3 py-1.5 text-xs text-center font-semibold text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Mobile Role Switcher Strip */}
        <div className="flex lg:hidden overflow-x-auto py-2 border-t border-stone-100 gap-2 no-scrollbar">
          <button
            onClick={() => onRoleChange('farmer')}
            className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap ${
              currentRole === 'farmer'
                ? 'bg-emerald-600 text-white'
                : 'bg-stone-100 text-stone-700'
            }`}
          >
            🌾 {t.roles.farmer}
          </button>
          <button
            onClick={() => onRoleChange('buyer')}
            className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap ${
              currentRole === 'buyer'
                ? 'bg-emerald-600 text-white'
                : 'bg-stone-100 text-stone-700'
            }`}
          >
            🛒 {t.roles.buyer}
          </button>
          <button
            onClick={() => onRoleChange('logistics')}
            className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap ${
              currentRole === 'logistics'
                ? 'bg-emerald-600 text-white'
                : 'bg-stone-100 text-stone-700'
            }`}
          >
            🚚 {t.roles.logistics}
          </button>
          <button
            onClick={() => onRoleChange('admin')}
            className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap ${
              currentRole === 'admin'
                ? 'bg-emerald-600 text-white'
                : 'bg-stone-100 text-stone-700'
            }`}
          >
            🛡️ {t.roles.admin}
          </button>
        </div>

      </div>
    </header>
  );
};
