import React, { useState, useEffect } from 'react';
import { ShieldCheck, X, Loader2, Sparkles, ShoppingCart, Truck, Phone, Globe, Key, Mic, Leaf } from 'lucide-react';
import { I18N_STRINGS } from '../../data/i18n';
import { useAuth, UserRole, DEMO_PHONES } from '../../lib/auth-context';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

interface OtpScreenProps {
  initialLanguage?: 'en' | 'hi' | 'mr' | 'te' | 'pa';
  onSuccess?: (role: UserRole) => void;
}

// Atmospheric SVG for login background — professional topographic/field geometry
const AtmosphericBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
    {/* Layered radial gradients for depth */}
    <div className="absolute inset-0 bg-atmosphere-login" />

    {/* Noise texture overlay */}
    <div
      className="absolute inset-0 opacity-[0.028]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 256 256'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '256px 256px',
      }}
    />

    {/* Topographic / contour SVG visualization */}
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 1400 900"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
    >
      <defs>
        <radialGradient id="glowForest" cx="40%" cy="0%" r="60%">
          <stop offset="0%" stopColor="#137344" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#137344" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="glowTeal" cx="70%" cy="100%" r="50%">
          <stop offset="0%" stopColor="#128975" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#128975" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#137344" stopOpacity="0" />
          <stop offset="40%" stopColor="#137344" stopOpacity="0.4" />
          <stop offset="60%" stopColor="#128975" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#128975" stopOpacity="0" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Large atmospheric blobs */}
      <ellipse cx="280" cy="-60" rx="500" ry="380" fill="url(#glowForest)" />
      <ellipse cx="1100" cy="960" rx="460" ry="340" fill="url(#glowTeal)" />

      {/* Topographic contour lines — field elevation aesthetic */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <ellipse
          key={`contour-${i}`}
          cx={700 + i * 12}
          cy={450 + i * 8}
          rx={580 - i * 60}
          ry={320 - i * 28}
          stroke="#28b86e"
          strokeWidth="0.5"
          strokeOpacity={0.06 + i * 0.01}
          fill="none"
          strokeDasharray={i % 2 === 0 ? "none" : "8 12"}
          style={{
            animation: `contourPulse ${5 + i * 0.6}s ease-in-out ${i * 0.4}s infinite`,
          }}
        />
      ))}

      {/* Meridian field lines */}
      {[0, 1, 2, 3, 4].map((i) => (
        <line
          key={`field-${i}`}
          x1={200 + i * 280}
          y1={0}
          x2={100 + i * 260}
          y2={900}
          stroke="#137344"
          strokeWidth="0.4"
          strokeOpacity={0.05 + i * 0.005}
          strokeDasharray="4 20"
        />
      ))}

      {/* Horizon gradient line — single prominent subtle line */}
      <line
        x1="0" y1="420" x2="1400" y2="440"
        stroke="url(#lineGradient)"
        strokeWidth="0.8"
        strokeOpacity="0.6"
      />

      {/* Agricultural data points — minimal dot matrix */}
      {[
        [140, 200], [280, 350], [180, 520], [340, 140],
        [1100, 180], [1250, 320], [1060, 420], [1200, 560],
        [900, 680], [1300, 740],
      ].map(([cx, cy], i) => (
        <circle
          key={`dot-${i}`}
          cx={cx}
          cy={cy}
          r="1.5"
          fill="#28b86e"
          fillOpacity={0.2 + Math.random() * 0.15}
          style={{
            animation: `breathe ${3 + i * 0.7}s ease-in-out ${i * 0.5}s infinite`,
          }}
        />
      ))}

      {/* Corner geometric accent — subtle grid */}
      <g opacity="0.04" transform="translate(40 40)">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <line key={`g-h-${i}`} x1="0" y1={i * 20} x2="120" y2={i * 20} stroke="#137344" strokeWidth="0.5" />
        ))}
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <line key={`g-v-${i}`} x1={i * 20} y1="0" x2={i * 20} y2="100" stroke="#137344" strokeWidth="0.5" />
        ))}
      </g>

      {/* Floating scan line — very subtle, slow */}
      <rect
        x="0" y="0" width="100%" height="2"
        fill="url(#lineGradient)"
        opacity="0.15"
        style={{ animation: 'fieldScan 12s linear infinite' }}
      />
    </svg>

    {/* Corner ambient orbs */}
    <div
      className="absolute -top-32 -right-32 w-96 h-96 rounded-full"
      style={{
        background: 'radial-gradient(circle, rgba(19,115,68,0.12) 0%, transparent 70%)',
        animation: 'ambientFloat 9s ease-in-out infinite',
      }}
    />
    <div
      className="absolute -bottom-48 -left-48 w-[500px] h-[500px] rounded-full"
      style={{
        background: 'radial-gradient(circle, rgba(18,137,117,0.09) 0%, transparent 70%)',
        animation: 'ambientFloat 12s ease-in-out 2s infinite reverse',
      }}
    />
    <div
      className="absolute top-1/2 left-1/4 w-80 h-80 rounded-full"
      style={{
        background: 'radial-gradient(circle, rgba(204,118,14,0.04) 0%, transparent 70%)',
        animation: 'ambientFloat 15s ease-in-out 4s infinite',
      }}
    />
  </div>
);

// SVG Farmer icon (professional, not emoji)
const FarmerIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 10v5" /><circle cx="8" cy="7" r="2.5" />
    <path d="M3 10c0-2.8 2.2-5 5-5s5 2.2 5 5" />
    <path d="M1 15c.5-2 3-4 7-4s6.5 2 7 4" />
  </svg>
);

export const OtpScreen: React.FC<OtpScreenProps> = ({
  initialLanguage = 'en',
  onSuccess,
}) => {
  const [language, setLanguage] = useState<'en' | 'hi' | 'mr' | 'te' | 'pa'>(initialLanguage);
  const [phone, setPhone] = useState<string>('+91');
  const [otp, setOtp] = useState<string>('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string>('');
  const [devOtpHint, setDevOtpHint] = useState<string>('');

  const { loginWithOtp, verifyOtp, isAuthenticated, pendingPhone } = useAuth();
  const t = I18N_STRINGS[language];

  useEffect(() => {
    if (pendingPhone) {
      setPhone(pendingPhone);
      setShowOtpInput(true);
      setOtp('123456');
      setDevOtpHint('Auto-filled test OTP 123456');
    }
  }, [pendingPhone]);

  useEffect(() => {
    const phoneInput = document.getElementById('phone-input');
    if (phoneInput) (phoneInput as HTMLInputElement).focus();
  }, []);

  const rolePath = (role: UserRole) => {
    switch (role) {
      case 'buyer': return '/buyer';
      case 'logistics': return '/logistics';
      case 'admin': return '/admin';
      default: return '/farmer';
    }
  };

  if (isAuthenticated) return null;

  const handleSendOtp = async () => {
    const trimmedPhone = phone.trim();
    if (!trimmedPhone || !trimmedPhone.startsWith('+91') || trimmedPhone.length < 10) {
      setError('Enter a valid Indian phone number starting with +91');
      return;
    }
    setError('');
    setIsSending(true);
    try {
      await loginWithOtp(trimmedPhone);
      setShowOtpInput(true);
      setDevOtpHint('Use OTP 123456 or click Auto-fill below');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to send OTP. Check server.');
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickDemoLogin = async (targetRole: UserRole) => {
    setError('');
    setIsSending(true);
    try {
      const demoPhone = DEMO_PHONES[targetRole];
      setPhone(demoPhone);
      await loginWithOtp(demoPhone);
      setShowOtpInput(true);
      setOtp('123456');
      setDevOtpHint('Auto-filled test OTP 123456');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Quick login failed');
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      setError('Enter the 6-digit OTP');
      return;
    }
    const phoneToVerify = pendingPhone || phone.trim();
    setIsVerifying(true);
    setError('');
    try {
      const result = await verifyOtp(phoneToVerify, otp);
      if (result.success && result.role) {
        if (onSuccess) {
          onSuccess(result.role);
        } else {
          window.location.href = rolePath(result.role);
        }
      } else {
        setError('Invalid OTP. Please try again.');
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') action();
  };

  const DEMO_ROLES: { role: UserRole; label: string; color: string; hoverBg: string; iconColor: string }[] = [
    {
      role: 'farmer',
      label: 'Farmer Portal',
      color: 'text-botanical-300',
      hoverBg: 'hover:bg-botanical-900/40 hover:border-botanical-700',
      iconColor: 'text-botanical-400',
    },
    {
      role: 'buyer',
      label: 'Buyer / Processor',
      color: 'text-deepteal-300',
      hoverBg: 'hover:bg-deepteal-900/40 hover:border-deepteal-700',
      iconColor: 'text-deepteal-400',
    },
    {
      role: 'logistics',
      label: 'Logistics Network',
      color: 'text-ochre-300',
      hoverBg: 'hover:bg-ochre-900/40 hover:border-ochre-700',
      iconColor: 'text-ochre-400',
    },
    {
      role: 'admin',
      label: 'Admin & Safety',
      color: 'text-sage-300',
      hoverBg: 'hover:bg-sage-900/40 hover:border-sage-700',
      iconColor: 'text-sage-400',
    },
  ];

  const ROLE_ICONS: Record<UserRole, React.ReactNode> = {
    farmer: <Leaf className="w-3.5 h-3.5" />,
    buyer: <ShoppingCart className="w-3.5 h-3.5" />,
    logistics: <Truck className="w-3.5 h-3.5" />,
    admin: <ShieldCheck className="w-3.5 h-3.5" />,
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-6">
      {/* Atmospheric background */}
      <AtmosphericBackground />

      {/* Login Panel */}
      <div
        className="relative z-10 w-full max-w-[420px] animate-scale-in"
        style={{ willChange: 'transform, opacity' }}
      >
        {/* Main card */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(11 22 16 / 0.82)',
            backdropFilter: 'blur(32px) saturate(1.4)',
            border: '1px solid rgba(255 255 255 / 0.07)',
            boxShadow:
              '0 32px 80px -16px rgba(1 7 4 / 0.8), ' +
              '0 8px 20px -4px rgba(1 7 4 / 0.5), ' +
              'inset 0 1px 0 0 rgba(255 255 255 / 0.06), ' +
              '0 0 0 1px rgba(19 115 68 / 0.15)',
          }}
        >
          {/* Header — topographic gradient band */}
          <div
            className="px-6 py-5 border-b"
            style={{
              background:
                'linear-gradient(135deg, rgba(19 115 68 / 0.18) 0%, rgba(13 84 48 / 0.12) 50%, rgba(18 137 117 / 0.08) 100%)',
              borderColor: 'rgba(255 255 255 / 0.06)',
            }}
          >
            <div className="flex items-start gap-4">
              {/* Brand logomark — geometric SVG */}
              <div
                className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #0d5430 0%, #137344 50%, #1d7d3c 100%)',
                  boxShadow: '0 4px 14px -4px rgba(19 115 68 / 0.5), inset 0 1px 0 rgba(255 255 255 / 0.1)',
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.08] to-transparent" />
                <svg viewBox="0 0 24 24" className="w-6 h-6 text-cream-50 relative" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  {/* Seedling / leaf geometric icon */}
                  <path d="M12 22V12" />
                  <path d="M12 12C12 8 15 5 19 5c0 4-3 7-7 7z" />
                  <path d="M12 12C12 8 9 5 5 5c0 4 3 7 7 7z" />
                  <path d="M5 22c.5-3 3-6 7-6" />
                  <path d="M19 22c-.5-3-3-6-7-6" />
                </svg>
              </div>

              <div>
                <h1 className="font-display text-lg font-semibold text-cream-50 tracking-tight leading-tight">
                  Vasundhara / वसुंधरा
                </h1>
                <p className="text-xs text-forest-300 font-medium mt-0.5 tracking-wide">
                  {t.appName} — {t.tagline}
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider"
                    style={{
                      background: 'rgba(19 115 68 / 0.2)',
                      border: '1px solid rgba(19 115 68 / 0.3)',
                      color: '#6dc48f',
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-forest-400 animate-[pulseSoft_2s_ease-in-out_infinite]" />
                    SIH 2026 MVP
                  </span>
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{
                      background: 'rgba(18 137 117 / 0.15)',
                      border: '1px solid rgba(18 137 117 / 0.25)',
                      color: '#24d4b4',
                    }}
                  >
                    <ShieldCheck className="w-2.5 h-2.5" />
                    Secure OTP
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {/* Demo Mode Panel */}
            <div
              className="p-3.5 rounded-xl space-y-2.5"
              style={{
                background: 'linear-gradient(160deg, rgba(204 118 14 / 0.08), rgba(173 152 18 / 0.05) 60%, rgba(11 22 16 / 0.3))',
                border: '1px solid rgba(204 118 14 / 0.18)',
              }}
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-ochre-200">
                <Sparkles className="w-3.5 h-3.5 text-ochre-400 shrink-0" />
                <span className="tracking-wide">SIH Demo Mode — Instant Role Switcher</span>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {DEMO_ROLES.map(({ role, label, color, hoverBg, iconColor }) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleQuickDemoLogin(role)}
                    disabled={isSending}
                    className={`group flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${hoverBg} ${color}`}
                    style={{
                      background: 'rgba(11 22 16 / 0.5)',
                      border: '1px solid rgba(255 255 255 / 0.06)',
                    }}
                  >
                    <span className={`${iconColor} shrink-0 group-hover:scale-110 transition-transform`}>
                      {ROLE_ICONS[role]}
                    </span>
                    <span className="truncate">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Language Selector */}
            <div
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs"
              style={{
                background: 'rgba(11 22 16 / 0.4)',
                border: '1px solid rgba(255 255 255 / 0.06)',
              }}
            >
              <Globe className="w-3.5 h-3.5 text-cream-500 shrink-0" />
              <label htmlFor="lang-select" className="text-cream-400 font-medium">
                Interface Language
              </label>
              <select
                id="lang-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value as typeof language)}
                className="ml-auto rounded-lg px-2 py-1 text-xs font-semibold text-cream-100 focus:outline-none focus:ring-1 focus:ring-forest-500 cursor-pointer"
                style={{
                  background: 'rgba(11 22 16 / 0.7)',
                  border: '1px solid rgba(255 255 255 / 0.1)',
                }}
              >
                <option value="en">English (EN)</option>
                <option value="hi">हिंदी (HI)</option>
                <option value="mr">मराठी (MR)</option>
                <option value="te">తెలుగు (TE)</option>
                <option value="pa">ਪੰਜਾਬੀ (PA)</option>
              </select>
            </div>

            {/* Thin divider */}
            <div className="divider-soft" />

            {/* Phone Input */}
            {!showOtpInput && (
              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="phone-input"
                    className="block text-[11px] font-semibold text-cream-500 uppercase tracking-widest mb-2"
                  >
                    Phone Number / मोबाईल नंबर
                  </label>
                  <div className="relative">
                    <Phone
                      className="w-4 h-4 text-cream-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    />
                    <input
                      type="tel"
                      id="phone-input"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, handleSendOtp)}
                      placeholder="+91 98765 43210"
                      className="w-full pl-10 pr-4 py-3 text-sm font-medium rounded-xl transition-all text-cream-100 placeholder:text-cream-700"
                      style={{
                        background: 'rgba(11 22 16 / 0.6)',
                        border: '1px solid rgba(255 255 255 / 0.1)',
                        outline: 'none',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.border = '1px solid rgba(19 115 68 / 0.5)';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(19 115 68 / 0.15)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.border = '1px solid rgba(255 255 255 / 0.1)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                      maxLength={15}
                      inputMode="tel"
                    />
                  </div>
                </div>

                {/* Send OTP — gradient button, not flat */}
                <button
                  id="send-otp-btn"
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isSending || phone.length < 10}
                  className="w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed relative overflow-hidden"
                  style={{
                    background: isSending
                      ? 'rgba(19 115 68 / 0.4)'
                      : 'linear-gradient(135deg, #0d5430 0%, #137344 45%, #1d7d3c 100%)',
                    boxShadow: '0 4px 18px -4px rgba(19 115 68 / 0.45), inset 0 1px 0 rgba(255 255 255 / 0.08)',
                    color: '#f2ede6',
                    transform: 'translateY(0)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSending && phone.length >= 10) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #137344 0%, #1d7d3c 45%, #28a450 100%)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 8px 24px -4px rgba(19 115 68 / 0.55), inset 0 1px 0 rgba(255 255 255 / 0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #0d5430 0%, #137344 45%, #1d7d3c 100%)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 18px -4px rgba(19 115 68 / 0.45), inset 0 1px 0 rgba(255 255 255 / 0.08)';
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.transform = 'scale(0.99)';
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] to-transparent rounded-xl" />
                  <span className="relative flex items-center justify-center gap-2">
                    {isSending ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Sending OTP…
                      </>
                    ) : (
                      <>
                        Send OTP
                        <span className="opacity-70">→</span>
                      </>
                    )}
                  </span>
                </button>
              </div>
            )}

            {/* OTP Input */}
            {showOtpInput && (
              <div className="space-y-3 animate-slide-up">
                <div
                  className="px-4 py-3 rounded-xl text-xs font-medium space-y-1"
                  style={{
                    background: 'rgba(19 115 68 / 0.1)',
                    border: '1px solid rgba(19 115 68 / 0.25)',
                  }}
                >
                  <span className="text-botanical-200">
                    OTP sent to{' '}
                    <strong className="font-bold text-cream-100">{pendingPhone || phone}</strong>
                  </span>
                  {devOtpHint && (
                    <p className="text-cream-500 font-medium text-[11px]">{devOtpHint}</p>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label
                      htmlFor="otp-input"
                      className="block text-[11px] font-semibold text-cream-500 uppercase tracking-widest"
                    >
                      Enter 6-Digit OTP
                    </label>
                    <button
                      type="button"
                      onClick={() => setOtp('123456')}
                      className="text-[11px] font-semibold text-forest-400 hover:text-forest-300 cursor-pointer transition-colors"
                    >
                      Auto-fill (123456)
                    </button>
                  </div>
                  <input
                    type="text"
                    id="otp-input"
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                    }
                    onKeyDown={(e) => handleKeyDown(e, handleVerifyOtp)}
                    placeholder="• • • • • •"
                    maxLength={6}
                    inputMode="numeric"
                    className="w-full px-4 py-3.5 text-2xl font-bold tracking-[0.5em] text-cream-50 rounded-xl text-center transition-all placeholder:tracking-[0.3em] placeholder:text-cream-700 placeholder:text-lg"
                    style={{
                      background: 'rgba(11 22 16 / 0.6)',
                      border: '1px solid rgba(255 255 255 / 0.1)',
                      outline: 'none',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.border = '1px solid rgba(19 115 68 / 0.5)';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(19 115 68 / 0.15)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.border = '1px solid rgba(255 255 255 / 0.1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                  {/* OTP progress indicator */}
                  <div className="flex gap-1.5 mt-2.5 justify-center">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="h-0.5 flex-1 rounded-full transition-all duration-200"
                        style={{
                          background:
                            i < otp.length
                              ? 'linear-gradient(90deg, #137344, #1d7d3c)'
                              : 'rgba(255 255 255 / 0.1)',
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Verify OTP — gradient button */}
                <button
                  id="verify-otp-btn"
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={isVerifying || otp.length !== 6}
                  className="w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed relative overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, #0d5430 0%, #137344 45%, #1d7d3c 100%)',
                    boxShadow: '0 4px 18px -4px rgba(19 115 68 / 0.45), inset 0 1px 0 rgba(255 255 255 / 0.08)',
                    color: '#f2ede6',
                  }}
                  onMouseEnter={(e) => {
                    if (otp.length === 6 && !isVerifying) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #137344 0%, #1d7d3c 45%, #28a450 100%)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 8px 24px -4px rgba(19 115 68 / 0.55), inset 0 1px 0 rgba(255 255 255 / 0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #0d5430 0%, #137344 45%, #1d7d3c 100%)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 18px -4px rgba(19 115 68 / 0.45), inset 0 1px 0 rgba(255 255 255 / 0.08)';
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] to-transparent rounded-xl" />
                  <span className="relative flex items-center justify-center gap-2">
                    {isVerifying ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Verifying…
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        Verify OTP & Continue
                      </>
                    )}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowOtpInput(false);
                    setOtp('');
                    setError('');
                  }}
                  className="w-full py-2 text-xs font-medium text-cream-600 hover:text-cream-400 transition-colors cursor-pointer"
                >
                  ← Use a different phone number
                </button>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div
                className="px-4 py-3 rounded-xl text-xs font-medium flex items-start gap-2.5 animate-slide-up"
                style={{
                  background: 'rgba(190 79 18 / 0.12)',
                  border: '1px solid rgba(190 79 18 / 0.3)',
                  color: '#efba92',
                }}
              >
                <svg viewBox="0 0 16 16" className="w-4 h-4 shrink-0 mt-0.5 text-copper-400" fill="currentColor">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0-2A5 5 0 1 0 8 3a5 5 0 0 0 0 10zM7 8V5h2v3H7zm0 2h2v2H7v-2z" />
                </svg>
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            className="px-5 py-3 text-[11px] text-cream-600 text-center font-medium border-t"
            style={{ borderColor: 'rgba(255 255 255 / 0.05)', background: 'rgba(1 7 4 / 0.3)' }}
          >
            <ShieldCheck className="w-3 h-3 inline-block mr-1 text-forest-500" />
            Secure OTP login — identity stays anonymous until trade confirmation.
          </div>
        </div>

        {/* Subtle external glow */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none -z-10"
          style={{
            background: 'radial-gradient(ellipse 80% 50% at 50% 50%, rgba(19 115 68 / 0.12), transparent 70%)',
            filter: 'blur(20px)',
            transform: 'scale(1.15)',
          }}
        />
      </div>
    </div>
  );
};