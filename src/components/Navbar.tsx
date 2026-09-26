import React, { useState, useRef, useEffect } from 'react';
import { Role, Language, AppNotification } from '../types';
import { I18N_STRINGS } from '../data/i18n';
import { useAuth } from '../lib/auth-context';
import {
  Leaf,
  ShoppingCart,
  Truck,
  ShieldCheck,
  Globe,
  Bell,
  Sparkles,
  TrendingUp,
  X,
  ChevronDown,
  Menu,
  Check,
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
  { code: 'en', label: 'English',  nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi',    nativeLabel: 'हिंदी' },
  { code: 'mr', label: 'Marathi',  nativeLabel: 'मराठी' },
  { code: 'te', label: 'Telugu',   nativeLabel: 'తెలుగు' },
  { code: 'pa', label: 'Punjabi',  nativeLabel: 'ਪੰਜਾਬੀ' },
];

interface RoleConfig {
  label: string;
  icon: React.ReactNode;
  activeClass: string;
  hoverClass: string;
  textClass: string;
}

const ROLE_CONFIG: Record<Role, RoleConfig> = {
  farmer: {
    label: 'Farmer',
    icon: <Leaf className="w-3.5 h-3.5" />,
    activeClass: 'bg-gradient-to-br from-forest-700 to-botanical-600 text-cream-50 shadow-[0_2px_10px_-2px_rgb(19_115_68_/_0.55)] border-transparent',
    hoverClass: 'hover:bg-forest-900/30 hover:text-forest-300',
    textClass: 'text-cream-400',
  },
  buyer: {
    label: 'Buyer',
    icon: <ShoppingCart className="w-3.5 h-3.5" />,
    activeClass: 'bg-gradient-to-br from-deepteal-700 to-deepteal-500 text-cream-50 shadow-[0_2px_10px_-2px_rgb(18_137_117_/_0.55)] border-transparent',
    hoverClass: 'hover:bg-deepteal-900/30 hover:text-deepteal-300',
    textClass: 'text-cream-400',
  },
  logistics: {
    label: 'Logistics',
    icon: <Truck className="w-3.5 h-3.5" />,
    activeClass: 'bg-gradient-to-br from-olive-800 to-ochre-700 text-cream-50 shadow-[0_2px_10px_-2px_rgb(173_152_18_/_0.5)] border-transparent',
    hoverClass: 'hover:bg-olive-900/30 hover:text-olive-300',
    textClass: 'text-cream-400',
  },
  admin: {
    label: 'Admin',
    icon: <ShieldCheck className="w-3.5 h-3.5" />,
    activeClass: 'bg-gradient-to-br from-sage-700 to-sage-500 text-cream-50 shadow-[0_2px_10px_-2px_rgb(109_196_143_/_0.45)] border-transparent',
    hoverClass: 'hover:bg-sage-900/30 hover:text-sage-300',
    textClass: 'text-cream-400',
  },
};

/* Notification type → color mapping */
const notifColor: Record<string, string> = {
  success: 'bg-forest-500',
  warning: 'bg-ochre-500',
  error:   'bg-copper-500',
  info:    'bg-deepteal-500',
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
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const notificationsRef = useRef<HTMLDivElement>(null);
  const languageRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const t = I18N_STRINGS[currentLanguage];
  const unreadCount = notifications.filter((n) => !n.read).length;
  const currentLang = LANGUAGES.find((l) => l.code === currentLanguage);

  /* Close dropdowns on outside click */
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node))
        setShowNotifications(false);
      if (languageRef.current && !languageRef.current.contains(e.target as Node))
        setShowLanguageMenu(false);
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node))
        setShowMobileMenu(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleRoleChange = async (role: Role) => {
    await switchRole(role);
    setShowMobileMenu(false);
  };

  const handleLanguageChange = (lang: Language) => {
    onLanguageChange(lang);
    setShowLanguageMenu(false);
  };

  return (
    <header className="page-header">
      <div className="container-page">
        <div className="flex items-center justify-between h-16 sm:h-[72px] gap-4">

          {/* ── Brand ── */}
          <div className="flex items-center gap-3 min-w-0 shrink-0">
            {/* Logomark */}
            <div
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl shrink-0 flex items-center justify-center overflow-hidden relative"
              style={{
                background: 'linear-gradient(135deg, #0d5430 0%, #137344 50%, #1d7d3c 100%)',
                boxShadow: '0 2px 10px -2px rgba(19,115,68,0.5), inset 0 1px 0 rgba(255,255,255,0.09)',
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.07] to-transparent" />
              <svg
                viewBox="0 0 20 20"
                className="w-5 h-5 text-cream-50 relative"
                fill="none" stroke="currentColor"
                strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
              >
                <path d="M10 18v-8" />
                <path d="M10 10C10 7 13 4.5 16.5 4.5c0 3.5-2.5 5.5-6.5 5.5z" />
                <path d="M10 10C10 7 7 4.5 3.5 4.5c0 3.5 2.5 5.5 6.5 5.5z" />
                <path d="M4 18c.4-2.5 2.5-4.5 6-4.5" />
                <path d="M16 18c-.4-2.5-2.5-4.5-6-4.5" />
              </svg>
            </div>

            <div className="min-w-0 hidden sm:block">
              <div className="flex items-center gap-2">
                <span className="font-display font-semibold text-lg text-cream-100 tracking-tight truncate">
                  {t.appName}
                </span>
                <span
                  className="px-1.5 py-0.5 rounded text-[10px] font-bold text-cream-500 whitespace-nowrap tracking-wider"
                  style={{
                    background: 'var(--color-bg-800)',
                    border: '1px solid var(--color-bg-700)',
                  }}
                >
                  SIH 2026
                </span>
              </div>
              <p className="text-[11px] text-cream-500 truncate mt-0.5">{t.tagline}</p>
            </div>
          </div>

          {/* ── Desktop Role Switcher ── */}
          <nav
            className="hidden lg:flex items-center gap-0.5 p-1 rounded-[10px]"
            style={{
              background: 'var(--color-bg-850)',
              border: '1px solid var(--color-bg-700)',
            }}
            aria-label="Switch role"
          >
            {(Object.keys(ROLE_CONFIG) as Role[]).map((role) => {
              const cfg = ROLE_CONFIG[role];
              const isActive = currentRole === role;
              return (
                <button
                  key={role}
                  onClick={() => handleRoleChange(role)}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-[7px]
                    text-xs font-medium transition-all duration-100 cursor-pointer
                    border border-transparent
                    ${isActive ? cfg.activeClass : `${cfg.textClass} ${cfg.hoverClass}`}
                  `}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {cfg.icon}
                  <span>{t.roles?.[role] || cfg.label}</span>
                </button>
              );
            })}
          </nav>

          {/* ── Right Actions ── */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">

            {/* Demo Guide */}
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenDemoGuide}
              className="hidden sm:flex gap-1.5 text-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Demo Guide</span>
            </Button>

            {/* Insights */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenInsights}
              className="hidden md:flex gap-1.5 text-xs"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Insights</span>
            </Button>

            {/* Language Switcher */}
            <div className="relative" ref={languageRef}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                className="flex items-center gap-1.5 text-xs"
                aria-haspopup="listbox"
                aria-expanded={showLanguageMenu}
              >
                <Globe className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-cream-300 font-medium">
                  {currentLang?.nativeLabel || currentLang?.label}
                </span>
                <ChevronDown
                  className="w-3 h-3 text-cream-500 transition-transform duration-100"
                  style={{ transform: showLanguageMenu ? 'rotate(180deg)' : 'none' }}
                />
              </Button>

              {showLanguageMenu && (
                <div
                  className="absolute right-0 mt-2 w-44 rounded-xl py-1.5 z-50 animate-fade-in"
                  style={{
                    background: 'linear-gradient(to bottom, var(--color-bg-800), var(--color-bg-850))',
                    border: '1px solid var(--color-bg-650)',
                    boxShadow: '0 12px 36px -4px rgba(1,5,3,0.7)',
                  }}
                  role="listbox"
                >
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      role="option"
                      aria-selected={currentLanguage === lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`
                        w-full px-3 py-2 text-left text-sm transition-colors flex items-center justify-between gap-2
                        ${currentLanguage === lang.code
                          ? 'bg-forest-900/40 text-forest-300 font-semibold'
                          : 'text-cream-300 hover:bg-bg-750 hover:text-cream-100'
                        }
                      `}
                    >
                      <span>{lang.nativeLabel}</span>
                      <span className="text-[10px] text-cream-500 font-mono">({lang.label})</span>
                      {currentLanguage === lang.code && <Check className="w-3 h-3 shrink-0 text-forest-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="relative" ref={notificationsRef}>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative"
                aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
                aria-haspopup="true"
                aria-expanded={showNotifications}
              >
                <Bell className="w-4 h-4 text-cream-400" />
                {unreadCount > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-extrabold flex items-center justify-center text-cream-50"
                    style={{ background: 'linear-gradient(135deg, var(--color-copper-600), var(--color-copper-500))' }}
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>

              {showNotifications && (
                <div
                  className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl overflow-hidden z-50 animate-fade-in"
                  style={{
                    background: 'linear-gradient(to bottom, var(--color-bg-800), var(--color-bg-850))',
                    border: '1px solid var(--color-bg-650)',
                    boxShadow: '0 16px 48px -6px rgba(1,5,3,0.75)',
                  }}
                >
                  <div
                    className="flex items-center justify-between px-4 py-3 border-b"
                    style={{ borderColor: 'var(--color-bg-700)' }}
                  >
                    <h4 className="font-display text-sm font-semibold text-cream-100 flex items-center gap-2">
                      <Bell className="w-4 h-4 text-deepteal-400" />
                      Notifications
                    </h4>
                    <span className="text-[11px] text-cream-500">
                      {unreadCount} unread
                    </span>
                  </div>

                  <div
                    className="divide-y max-h-72 overflow-y-auto"
                    style={{ borderColor: 'var(--color-bg-750)' }}
                  >
                    {notifications.length === 0 ? (
                      <EmptyState variant="notifications" className="py-6" />
                    ) : (
                      notifications.map((notif) => (
                        <button
                          key={notif.id}
                          onClick={() => { onMarkNotificationRead(notif.id); setShowNotifications(false); }}
                          className={`
                            w-full px-4 py-3 text-left transition-colors
                            hover:bg-bg-750 active:bg-bg-700
                            ${!notif.read ? 'border-l-2 border-forest-500' : 'border-l-2 border-transparent'}
                          `}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-xs font-semibold ${notif.read ? 'text-cream-400' : 'text-cream-100'}`}>
                              {notif.title}
                            </p>
                            <span className="text-[10px] text-cream-600 whitespace-nowrap shrink-0">
                              {notif.timestamp}
                            </span>
                          </div>
                          <p className="text-xs text-cream-500 mt-0.5 line-clamp-2 leading-relaxed">
                            {notif.message}
                          </p>
                        </button>
                      ))
                    )}
                  </div>

                  <div style={{ borderTop: '1px solid var(--color-bg-700)' }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full rounded-none py-2.5 text-xs"
                      onClick={() => setShowNotifications(false)}
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu */}
            <div className="lg:hidden relative" ref={mobileMenuRef}>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                aria-label="Open menu"
                aria-expanded={showMobileMenu}
              >
                {showMobileMenu ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </Button>

              {showMobileMenu && (
                <div
                  className="absolute right-0 top-full mt-2 w-56 rounded-xl py-2 z-50 animate-fade-in"
                  style={{
                    background: 'linear-gradient(to bottom, var(--color-bg-800), var(--color-bg-850))',
                    border: '1px solid var(--color-bg-650)',
                    boxShadow: '0 12px 36px -4px rgba(1,5,3,0.7)',
                  }}
                >
                  {/* Role Switcher */}
                  <div
                    className="px-4 py-2 border-b"
                    style={{ borderColor: 'var(--color-bg-700)' }}
                  >
                    <p className="text-[10px] font-bold text-cream-600 uppercase tracking-widest mb-2">
                      Switch Role
                    </p>
                    <div className="space-y-0.5">
                      {(Object.keys(ROLE_CONFIG) as Role[]).map((role) => {
                        const cfg = ROLE_CONFIG[role];
                        const isActive = currentRole === role;
                        return (
                          <button
                            key={role}
                            onClick={() => handleRoleChange(role)}
                            className={`
                              w-full px-3 py-2 rounded-lg text-left text-sm font-medium
                              flex items-center gap-2 transition-all duration-100 cursor-pointer
                              border border-transparent
                              ${isActive ? cfg.activeClass : `${cfg.textClass} ${cfg.hoverClass}`}
                            `}
                          >
                            {cfg.icon}
                            <span>{t.roles?.[role] || cfg.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Mobile Demo Guide */}
                  <div className="px-3 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { onOpenDemoGuide(); setShowMobileMenu(false); }}
                      className="w-full justify-start gap-2"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Demo Guide</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Mobile Role Strip ── */}
        <div
          className="lg:hidden flex overflow-x-auto py-2 border-t gap-1.5 scrollbar-hidden -mx-4 px-4"
          style={{ borderColor: 'var(--color-bg-750)' }}
        >
          {(Object.keys(ROLE_CONFIG) as Role[]).map((role) => {
            const cfg = ROLE_CONFIG[role];
            const isActive = currentRole === role;
            return (
              <button
                key={role}
                onClick={() => handleRoleChange(role)}
                className={`
                  px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap
                  flex items-center gap-1.5 shrink-0 transition-all duration-100 cursor-pointer
                  border border-transparent
                  ${isActive ? cfg.activeClass : `${cfg.textClass} ${cfg.hoverClass} bg-bg-800 border-bg-700`}
                `}
              >
                {cfg.icon}
                <span>{t.roles?.[role] || cfg.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};