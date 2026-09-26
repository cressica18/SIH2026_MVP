import React, { useState, useRef, useEffect } from 'react';
import { Role, Language, AppNotification } from '../types';
import { I18N_STRINGS } from '../data/i18n';
import { useAuth } from '../lib/auth-context';
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
  Menu,
} from 'lucide-react';
import { Button } from './ui/Button';
import { EmptyState } from './ui/EmptyState';

interface NavbarProps {
  currentRole: Role;
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

const ROLE_CONFIG: Record<Role, { label: string; icon: React.ReactNode }> = {
  farmer: { label: 'Farmer', icon: <Sprout className="w-4 h-4" /> },
  buyer: { label: 'Buyer', icon: <UserCheck className="w-4 h-4" /> },
  logistics: { label: 'Logistics', icon: <Truck className="w-4 h-4" /> },
  admin: { label: 'Admin', icon: <ShieldCheck className="w-4 h-4" /> },
};

const ROLE_CLASSES: Record<Role, string> = {
  farmer: 'bg-botanical-900/40 text-botanical-300 border-botanical-800 hover:bg-botanical-900/60',
  buyer: 'bg-deepteal-900/40 text-deepteal-300 border-deepteal-800 hover:bg-deepteal-900/60',
  logistics: 'bg-olive-900/40 text-olive-300 border-olive-800 hover:bg-olive-900/60',
  admin: 'bg-sage-900/40 text-sage-300 border-sage-800 hover:bg-sage-900/60',
};

const ROLE_ACTIVE: Record<Role, string> = {
  farmer: 'bg-botanical-500 text-bg-950 border-botanical-500 shadow-sm shadow-botanical-500/20',
  buyer: 'bg-deepteal-500 text-bg-950 border-deepteal-500 shadow-sm shadow-deepteal-500/20',
  logistics: 'bg-olive-500 text-bg-950 border-olive-500 shadow-sm shadow-olive-500/20',
  admin: 'bg-sage-500 text-bg-950 border-sage-500 shadow-sm shadow-sage-500/20',
};

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  currentLanguage,
  onLanguageChange,
  notifications,
  onOpenDemoGuide,
  onOpenInsights,
  onMarkNotificationRead,
}) => {
  const { switchRole } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const languageRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const t = I18N_STRINGS[currentLanguage];
  const unreadCount = notifications.filter((n) => !n.read).length;
  const currentLang = LANGUAGES.find((l) => l.code === currentLanguage);
  const currentRoleConfig = ROLE_CONFIG[currentRole];

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
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setShowMobileMenu(false);
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

  const handleRoleChange = async (role: Role) => {
    await switchRole(role);
    setShowRoleMenu(false);
    setShowMobileMenu(false);
  };

  return (
    <header className="page-header">
      <div className="container-page">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3 min-w-0 flex-shrink-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-forest-500 via-botanical-400 to-deepteal-400 flex items-center justify-center text-bg-950 shadow-sm shrink-0 brand-mark" />
            <div className="min-w-0 hidden sm:block">
              <div className="flex items-center gap-2">
                <span className="font-display font-semibold text-lg sm:text-xl text-cream-100 tracking-tight truncate">
                  {t.appName}
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-bg-800 text-cream-500 border border-bg-700 whitespace-nowrap">
                  SIH 2026 MVP
                </span>
              </div>
              <p className="text-xs text-cream-400 truncate">
                {t.tagline}
              </p>
            </div>
          </div>

          {/* Desktop Role Switcher - Minimal, Typographic */}
          <div className="hidden lg:flex items-center gap-1 p-1 bg-bg-800 rounded-md border border-bg-700">
            {(Object.keys(ROLE_CONFIG) as Role[]).map((role) => {
              const config = ROLE_CONFIG[role];
              const isActive = currentRole === role;
              return (
                <button
                  key={role}
                  onClick={() => handleRoleChange(role)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-medium transition-all ${
                    isActive ? ROLE_ACTIVE[role] : `${ROLE_CLASSES[role]}`
                  }`}
                >
                  {config.icon}
                  <span>{t.roles[role]}</span>
                </button>
              );
            })}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Demo Guide */}
            <Button variant="outline" size="sm" onClick={onOpenDemoGuide} className="hidden sm:flex gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>Demo Guide</span>
            </Button>

            {/* Insights */}
            <Button variant="ghost" size="sm" onClick={onOpenInsights} className="hidden md:flex gap-1.5">
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
                <span className="hidden sm:inline font-medium text-cream-300">
                  {currentLang?.nativeLabel || currentLang?.label}
                </span>
                <ChevronDown className="w-3.5 h-3.5" />
              </Button>

              {showLanguageMenu && (
                <div className="absolute right-0 mt-2 w-40 bg-bg-850 rounded-lg shadow-xl border border-bg-700 py-1 z-50 animate-fade-in">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`w-full px-3 py-2 text-left text-sm font-medium transition-colors ${
                        currentLanguage === lang.code
                          ? 'bg-bg-700 text-forest-300'
                          : 'text-cream-300 hover:bg-bg-800'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{lang.nativeLabel}</span>
                        <span className="text-xs text-cream-500">({lang.label})</span>
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
                <Bell className="w-5 h-5 text-cream-400" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 bg-copper-500 text-bg-950 rounded-full text-[10px] font-bold flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-bg-850 rounded-lg shadow-xl border border-bg-700 z-50 animate-fade-in">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-bg-700">
                    <h4 className="font-semibold text-sm text-cream-100 flex items-center gap-2">
                      <Bell className="w-4 h-4 text-deepteal-400" />
                      Notifications
                    </h4>
                    <span className="text-xs text-cream-500">{unreadCount} unread</span>
                  </div>
                  <div className="divide-y divide-bg-700 max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <EmptyState variant="notifications" className="py-8" />
                    ) : (
                      notifications.map((notif) => (
                        <button
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`w-full px-4 py-3 text-left transition-colors ${
                            notif.read ? 'bg-bg-850' : 'bg-bg-700/50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-xs font-semibold ${notif.read ? 'text-cream-300' : 'text-cream-100'}`}>
                              {notif.title}
                            </p>
                            <span className="text-[10px] text-cream-500 whitespace-nowrap flex-shrink-0">
                              {notif.timestamp}
                            </span>
                          </div>
                          <p className="text-xs text-cream-400 mt-1 line-clamp-2">{notif.message}</p>
                        </button>
                      ))
                    )}
                  </div>
                  <Button variant="ghost" size="sm" className="w-full px-4 py-2 border-t border-bg-700" onClick={() => setShowNotifications(false)}>
                    Close
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile Menu Trigger */}
            <div className="lg:hidden" ref={mobileMenuRef}>
              <Button variant="ghost" size="sm" onClick={() => setShowMobileMenu(!showMobileMenu)} className="p-2" aria-label="Open menu" aria-expanded={showMobileMenu}>
                <Menu className="w-5 h-5 text-cream-400" />
              </Button>

              {showMobileMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-bg-850 rounded-lg shadow-xl border border-bg-700 py-2 z-50 animate-fade-in">
                  {/* Role Switcher in Mobile Menu */}
                  <div className="px-4 py-2 border-b border-bg-700">
                    <p className="text-xs font-semibold text-cream-500 uppercase tracking-wider mb-2">Switch Role</p>
                    <div className="space-y-1">
                      {(Object.keys(ROLE_CONFIG) as Role[]).map((role) => (
                        <button
                          key={role}
                          onClick={() => handleRoleChange(role)}
                          className={`w-full px-3 py-2 rounded-md text-left text-sm font-medium transition-colors flex items-center gap-2 ${
                            currentRole === role ? ROLE_ACTIVE[role] : ROLE_CLASSES[role]
                          }`}
                        >
                          {ROLE_CONFIG[role].icon}
                          <span>{t.roles[role]}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Language Switcher in Mobile Menu */}
                  <div className="px-4 py-2 border-b border-bg-700">
                    <p className="text-xs font-semibold text-cream-500 uppercase tracking-wider mb-2">Language</p>
                    <div className="space-y-1">
                      {LANGUAGES.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => handleLanguageChange(lang.code)}
                          className={`w-full px-3 py-2 rounded-md text-left text-sm font-medium transition-colors flex items-center gap-2 ${
                            currentLanguage === lang.code
                              ? 'bg-bg-700 text-forest-300'
                              : 'text-cream-300 hover:bg-bg-800'
                          }`}
                        >
                          <span>{lang.nativeLabel}</span>
                          <span className="text-xs text-cream-500 ml-auto">({lang.label})</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Demo Guide in Mobile Menu */}
                  <Button variant="outline" size="sm" onClick={onOpenDemoGuide} className="w-full mx-4 justify-start">
                    <Sparkles className="w-4 h-4" />
                    <span>Demo Guide</span>
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile Role Switcher (Dropdown) */}
            <div className="lg:hidden" ref={roleRef}>
              <Button variant="ghost" size="sm" onClick={() => setShowRoleMenu(!showRoleMenu)} className="w-full justify-between">
                <span className="flex items-center gap-2">
                  {currentRoleConfig.icon}
                  <span className="font-medium text-cream-300">{t.roles[currentRole]}</span>
                </span>
                <ChevronDown className="w-4 h-4 text-cream-500" />
              </Button>

              {showRoleMenu && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-bg-850 rounded-lg shadow-xl border border-bg-700 py-1 z-50 animate-fade-in">
                  {(Object.keys(ROLE_CONFIG) as Role[]).map((role) => (
                    <button
                      key={role}
                      onClick={() => handleRoleChange(role)}
                      className={`w-full px-4 py-3 text-left font-semibold transition-colors ${
                        currentRole === role ? ROLE_ACTIVE[role] : ROLE_CLASSES[role]
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {ROLE_CONFIG[role].icon}
                        <span>{t.roles[role]}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Role Strip */}
        <div className="lg:hidden flex overflow-x-auto py-2 border-t border-bg-700 gap-2 scrollbar-hidden pb-2 -mx-4 px-4">
          {(Object.keys(ROLE_CONFIG) as Role[]).map((role) => {
            const isActive = currentRole === role;
            return (
              <button
                key={role}
                onClick={() => handleRoleChange(role)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                  isActive ? ROLE_ACTIVE[role] : ROLE_CLASSES[role]
                }`}
              >
                {ROLE_CONFIG[role].icon}
                <span>{t.roles[role]}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};