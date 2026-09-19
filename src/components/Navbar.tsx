import React, { useState, useRef, useEffect } from 'react';
import { Role, Language, AppNotification } from '../types';
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
  X,
  ChevronDown,
} from 'lucide-react';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { EmptyState } from './ui/EmptyState';

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

const LANGUAGES: { code: Language; label: string; nativeLabel: string }[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिंदी' },
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी' },
  { code: 'te', label: 'Telugu', nativeLabel: 'తెలుగు' },
  { code: 'pa', label: 'Punjabi', nativeLabel: 'ਪੰਜਾਬੀ' },
];

const ROLES: { value: Role; label: string; icon: React.ReactNode }[] = [
  { value: 'farmer', label: 'Farmer', icon: <Sprout className="w-4 h-4" /> },
  { value: 'buyer', label: 'Buyer', icon: <UserCheck className="w-4 h-4" /> },
  { value: 'logistics', label: 'Logistics', icon: <Truck className="w-4 h-4" /> },
  { value: 'admin', label: 'Admin', icon: <ShieldCheck className="w-4 h-4" /> },
];

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
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const languageRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);

  const t = I18N_STRINGS[currentLanguage];
  const unreadCount = notifications.filter((n) => !n.read).length;
  const currentLang = LANGUAGES.find((l) => l.code === currentLanguage);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (languageRef.current && !languageRef.current.contains(event.target as Node)) {
        setShowLanguageMenu(false);
      }
      if (roleRef.current && !roleRef.current.contains(event.target as Node)) {
        setShowRoleMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notif: AppNotification) => {
    onMarkNotificationRead(notif.id);
    setShowNotifications(false);
  };

  const handleLanguageChange = (lang: Language) => {
    onLanguageChange(lang);
    setShowLanguageMenu(false);
  };

  const handleRoleChange = (role: Role) => {
    onRoleChange(role);
    setShowRoleMenu(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3 min-w-0 flex-shrink-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm shrink-0">
              <Sprout className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div className="min-w-0 hidden sm:block">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl text-emerald-950 tracking-tight truncate">
                  {t.appName}
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                  SIH 2026 MVP
                </span>
              </div>
              <p className="text-xs text-stone-500 truncate">
                {t.tagline}
              </p>
            </div>
          </div>

          {/* Role Switcher - Desktop */}
          <div className="hidden lg:flex items-center gap-1 p-1 bg-stone-50 rounded-xl border border-stone-200">
            {ROLES.map((role) => (
              <button
                key={role.value}
                onClick={() => handleRoleChange(role.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currentRole === role.value
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-stone-700 hover:text-emerald-700 hover:bg-stone-100'
                }`}
              >
                {role.icon}
                <span>{t.roles[role.value]}</span>
              </button>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Demo Guide */}
            <Button
              variant="secondary"
              size="sm"
              onClick={onOpenDemoGuide}
              className="hidden sm:flex gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>Demo Guide</span>
            </Button>

            {/* Insights */}
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenInsights}
              className="hidden md:flex gap-1.5"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Insights</span>
            </Button>

            {/* Language Switcher */}
            <div className="relative" ref={languageRef}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                className="flex items-center gap-1.5"
                aria-haspopup="true"
                aria-expanded={showLanguageMenu}
              >
                <Globe className="w-4 h-4" />
                <span className="hidden sm:inline font-medium text-stone-700">
                  {currentLang?.nativeLabel || currentLang?.label}
                </span>
                <ChevronDown className="w-3.5 h-3.5" />
              </Button>

              {showLanguageMenu && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-stone-200 py-1 z-50 animate-fade-in">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`w-full px-3 py-2 text-left text-sm font-medium transition-colors ${
                        currentLanguage === lang.code
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{lang.nativeLabel}</span>
                        <span className="text-xs text-stone-400">({lang.label})</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="relative" ref={notificationsRef}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2"
                aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
                aria-haspopup="true"
                aria-expanded={showNotifications}
              >
                <Bell className="w-5 h-5 text-stone-600" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>

{showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-stone-200 z-50 animate-fade-in">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
                    <h4 className="font-semibold text-sm text-stone-900 flex items-center gap-2">
                      <Bell className="w-4 h-4 text-emerald-600" />
                      Notifications
                    </h4>
                    <span className="text-xs text-stone-400">
                      {unreadCount} unread
                    </span>
                  </div>
                  <div className="divide-y divide-stone-100 max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <EmptyState variant="notifications" className="py-8" />
                    ) : (
                      notifications.map((notif) => (
                        <button
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`w-full px-4 py-3 text-left transition-colors ${
                            notif.read ? 'bg-white' : 'bg-emerald-50/50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-xs font-semibold ${notif.read ? 'text-stone-700' : 'text-stone-900'}`}>
                              {notif.title}
                            </p>
                            <span className="text-[10px] text-stone-400 whitespace-nowrap flex-shrink-0">
                              {notif.timestamp}
                            </span>
                          </div>
                          <p className="text-xs text-stone-500 mt-1 line-clamp-2">
                            {notif.message}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full px-4 py-2 border-t border-stone-100"
                    onClick={() => setShowNotifications(false)}
                  >
                    Close
                  </Button>
                </div>
              )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full px-4 py-2 border-t border-stone-100"
                    onClick={() => setShowNotifications(false)}
                  >
                    Close
                  </Button>
                </div>
            </div>

            {/* Role Switcher - Mobile */}
            <div className="lg:hidden" ref={roleRef}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="w-full justify-between"
              >
                <span className="flex items-center gap-2">
                  {ROLES.find((r) => r.value === currentRole)?.icon}
                  <span className="font-medium text-stone-700">{t.roles[currentRole]}</span>
                </span>
                <ChevronDown className="w-4 h-4 text-stone-400" />
              </Button>

              {showRoleMenu && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-xl border border-stone-200 py-1 z-50 animate-fade-in">
                  {ROLES.map((role) => (
                    <button
                      key={role.value}
                      onClick={() => handleRoleChange(role.value)}
                      className={`w-full px-4 py-3 text-left font-semibold transition-colors ${
                        currentRole === role.value
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {role.icon}
                        <span>{t.roles[role.value]}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Role Strip */}
        <div className="lg:hidden flex overflow-x-auto py-2 border-t border-stone-100 gap-2 no-scrollbar pb-2">
          {ROLES.map((role) => (
            <button
              key={role.value}
              onClick={() => handleRoleChange(role.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap flex items-center gap-1.5 ${
                currentRole === role.value
                  ? 'bg-emerald-600 text-white'
                  : 'bg-stone-100 text-stone-700'
              }`}
            >
              {role.icon}
              <span>{t.roles[role.value]}</span>
            </button>
          ))}
        </div>
    </header>
  );
};