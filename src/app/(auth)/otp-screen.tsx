import React, { useState, useEffect } from 'react';
import { Mic, ShieldCheck, X, Loader2 } from 'lucide-react';
import { I18N_STRINGS } from '../../data/i18n';
import { useAuth, UserRole } from '../../lib/auth-context';

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
      setDevOtpHint('Check server console for the OTP (dev mode)');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to send OTP. Check server.');
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4 sm:p-6">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/30 rounded-xl">
              <ShieldCheck className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight">Vasundhara / वसुंधरा</h1>
              <p className="text-xs text-emerald-200">
                {t.appName} — {t.tagline}
              </p>
            </div>
          </div>
          <button
            onClick={() => window.history.back()}
            className="p-1.5 text-emerald-200 hover:text-white rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Language Selector */}
          <div className="flex items-center gap-2 p-3 bg-stone-50 border border-stone-200 rounded-xl">
            <Mic className="w-4 h-4 text-stone-400" />
            <label className="text-xs font-semibold text-stone-700" htmlFor="lang-select">
              Language
            </label>
            <select
              id="lang-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value as typeof language)}
              className="ml-auto bg-transparent text-xs font-medium text-stone-800 focus:outline-none cursor-pointer"
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
                <input
                  type="tel"
                  id="phone-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, handleSendOtp)}
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-3 text-sm font-semibold bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  maxLength={15}
                  inputMode="tel"
                />
                <p className="text-xs text-stone-400 mt-1.5">
                  Use a seeded phone: +919876543210 (farmer), +919876543211 (buyer)
                </p>
              </div>

              <button
                id="send-otp-btn"
                onClick={handleSendOtp}
                disabled={isSending || phone.length < 10}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                {isSending && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSending ? 'Sending OTP...' : 'Send OTP →'}
              </button>
            </div>
          )}

          {/* OTP Input */}
          {showOtpInput && (
            <div className="space-y-3">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700">
                OTP sent to <strong>{pendingPhone || phone}</strong>
                {devOtpHint && (
                  <span className="block mt-0.5 text-stone-500">{devOtpHint}</span>
                )}
              </div>

              <div>
                <label htmlFor="otp-input" className="block text-xs font-bold text-stone-700 mb-1.5">
                  Enter 6-digit OTP
                </label>
                <input
                  type="text"
                  id="otp-input"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onKeyDown={(e) => handleKeyDown(e, handleVerifyOtp)}
                  placeholder="123456"
                  maxLength={6}
                  inputMode="numeric"
                  className="w-full px-4 py-3 text-2xl font-bold tracking-[0.5em] text-stone-900 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-center transition-all"
                />
              </div>

              <button
                id="verify-otp-btn"
                onClick={handleVerifyOtp}
                disabled={isVerifying || otp.length !== 6}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                {isVerifying && <Loader2 className="w-4 h-4 animate-spin" />}
                {isVerifying ? 'Verifying...' : 'Verify OTP & Continue →'}
              </button>

              <button
                onClick={() => { setShowOtpInput(false); setOtp(''); setError(''); }}
                className="w-full py-2 text-xs text-stone-500 hover:text-stone-700 transition-colors"
              >
                ← Use a different phone number
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-stone-50 border-t border-stone-100 text-xs text-stone-500 text-center">
          Secure OTP login — your identity stays anonymous until you confirm a trade.
        </div>
      </div>
    </div>
  );
};