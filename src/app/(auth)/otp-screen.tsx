import React, { useState, useEffect } from 'react';
import { Mic, ShieldCheck, X, Loader2, Sparkles, Sprout, ShoppingCart, Truck, Phone, Key, Globe } from 'lucide-react';
import { I18N_STRINGS } from '../../data/i18n';
import { useAuth, UserRole, DEMO_PHONES } from '../../lib/auth-context';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

interface OtpScreenProps {
  initialLanguage?: 'en' | 'hi' | 'mr' | 'te' | 'pa';
  onSuccess?: (role: UserRole) => void;
}

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

  // If pendingPhone is set (e.g. via switchRole or loginWithOtp), sync phone and show OTP input view immediately
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

  // Role → dashboard path
  const rolePath = (role: UserRole) => {
    switch (role) {
      case 'buyer': return '/buyer';
      case 'logistics': return '/logistics';
      case 'admin': return '/admin';
      default: return '/farmer';
    }
  };

  if (isAuthenticated) {
    return null; // App.tsx already showing the correct role dashboard
  }

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-stone-900 to-slate-900 flex items-center justify-center p-4 sm:p-6 selection:bg-emerald-500 selection:text-white">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-emerald-800 to-teal-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <Sprout className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight">Vasundhara / वसुंधरा</h1>
              <p className="text-xs text-emerald-200 font-medium">
                {t.appName} — {t.tagline}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Quick Demo Login Bar for Judges */}
          <div className="p-3.5 bg-amber-50/80 border border-amber-200/90 rounded-2xl space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>SIH Demo Mode — Instant Role Switcher</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('farmer')}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-amber-200 hover:border-amber-400 hover:bg-amber-100/50 text-stone-800 rounded-xl font-bold transition-all cursor-pointer shadow-2xs"
              >
                <Sprout className="w-4 h-4 text-emerald-600" />
                <span>Farmer</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('buyer')}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-amber-200 hover:border-amber-400 hover:bg-amber-100/50 text-stone-800 rounded-xl font-bold transition-all cursor-pointer shadow-2xs"
              >
                <ShoppingCart className="w-4 h-4 text-blue-600" />
                <span>Buyer</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('logistics')}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-amber-200 hover:border-amber-400 hover:bg-amber-100/50 text-stone-800 rounded-xl font-bold transition-all cursor-pointer shadow-2xs"
              >
                <Truck className="w-4 h-4 text-amber-600" />
                <span>Logistics</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('admin')}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-amber-200 hover:border-amber-400 hover:bg-amber-100/50 text-stone-800 rounded-xl font-bold transition-all cursor-pointer shadow-2xs"
              >
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span>Admin</span>
              </button>
            </div>
          </div>

          {/* Language Selector */}
          <div className="flex items-center gap-2 p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-700">
            <Globe className="w-4 h-4 text-emerald-600" />
            <label htmlFor="lang-select">Interface Language</label>
            <select
              id="lang-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value as typeof language)}
              className="ml-auto bg-transparent text-xs font-bold text-stone-900 focus:outline-none cursor-pointer"
            >
              <option value="en">English (EN)</option>
              <option value="hi">हिंदी (HI)</option>
              <option value="mr">मराठी (MR)</option>
              <option value="te">తెలుగు (TE)</option>
              <option value="pa">ਪੰਜਾਬੀ (PA)</option>
            </select>
          </div>

          {/* Phone Input */}
          {!showOtpInput && (
            <div className="space-y-3">
              <div>
                <label htmlFor="phone-input" className="block text-xs font-bold text-stone-700 mb-1.5">
                  Phone Number / मोबाईल नंबर
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-3.5" />
                  <input
                    type="tel"
                    id="phone-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, handleSendOtp)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-4 py-2.5 text-sm font-bold bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-stone-900"
                    maxLength={15}
                    inputMode="tel"
                  />
                </div>
              </div>

              <Button
                id="send-otp-btn"
                onClick={handleSendOtp}
                disabled={isSending || phone.length < 10}
                loading={isSending}
                fullWidth
              >
                Send OTP →
              </Button>
            </div>
          )}

          {/* OTP Input */}
          {showOtpInput && (
            <div className="space-y-3">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex flex-col gap-1 font-medium">
                <span>OTP sent to <strong className="font-bold text-stone-900">{pendingPhone || phone}</strong></span>
                {devOtpHint && (
                  <span className="text-stone-500 font-semibold">{devOtpHint}</span>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label htmlFor="otp-input" className="block text-xs font-bold text-stone-700">
                    Enter 6-digit OTP
                  </label>
                  <button
                    type="button"
                    onClick={() => setOtp('123456')}
                    className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
                  >
                    Auto-fill Test OTP (123456)
                  </button>
                </div>
                <input
                  type="text"
                  id="otp-input"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onKeyDown={(e) => handleKeyDown(e, handleVerifyOtp)}
                  placeholder="123456"
                  maxLength={6}
                  inputMode="numeric"
                  className="w-full px-4 py-3 text-2xl font-black tracking-[0.5em] text-stone-900 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center transition-all bg-stone-50"
                />
              </div>

              <Button
                id="verify-otp-btn"
                onClick={handleVerifyOtp}
                disabled={isVerifying || otp.length !== 6}
                loading={isVerifying}
                fullWidth
              >
                Verify OTP & Continue →
              </Button>

              <button
                onClick={() => { setShowOtpInput(false); setOtp(''); setError(''); }}
                className="w-full py-2 text-xs font-semibold text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
              >
                ← Use a different phone number
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-bold">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-stone-50 border-t border-stone-100 text-[11px] text-stone-500 text-center font-medium">
          Secure OTP login — your identity stays anonymous until trade confirmation.
        </div>
      </div>
    </div>
  );
};
