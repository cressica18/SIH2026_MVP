import React, { useState, useEffect } from 'react';
import { Mic, ShieldCheck, X, Loader2, Sparkles, Sprout, ShoppingCart, Truck, Phone, Globe, Key } from 'lucide-react';
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

  if (isAuthenticated) {
    return null;
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
    <div className="min-h-screen bg-atmosphere-login flex items-center justify-center p-4 sm:p-6 selection:bg-olive-500 selection:text-bg-950">
      {/* Subtle atmospheric texture */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 400%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22 opacity=%220.03%22/%3E%3C/svg%3E')]" />
      {/* Subtle animated gradient orb */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-r from-forest-500/10 to-deepteal-500/5 opacity-50 animate-[ambientFloat_8s_ease-in-out_infinite]" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-r from-olive-500/10 to-deepteal-500/5 opacity-50 animate-[ambientFloat_10s_ease-in-out_infinite_reverse]" />
      </div>

      <div className="relative w-full max-w-md bg-bg-850 rounded-2xl shadow-2xl border border-bg-700 overflow-hidden flex flex-col animate-scale-in">
        
        {/* Header - Atmospheric gradient */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-forest-900/60 to-deepteal-900/40 text-cream-100 border-b border-bg-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-forest-500/30 flex items-center justify-center shrink-0 border border-forest-800/50 brand-mark-sm" />
            <div>
              <h1 className="font-display font-semibold text-base tracking-tight text-cream-100">Vasundhara / वसुंधरा</h1>
              <p className="text-xs text-botanical-300 font-medium">{t.appName} — {t.tagline}</p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Quick Demo Login Bar for Judges - Subtle */}
          <div className="p-3 bg-olive-900/30 border border-olive-800/50 rounded-xl space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-olive-100">
              <Sparkles className="w-3.5 h-3.5 text-olive-400 shrink-0" />
              <span>SIH Demo Mode — Instant Role Switcher</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <button type="button" onClick={() => handleQuickDemoLogin('farmer')} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-bg-800 border border-bg-700 hover:border-botanical-700 hover:bg-botanical-900/40 text-cream-100 rounded-lg font-medium transition-all cursor-pointer shadow-xs">
                <Sprout className="w-3.5 h-3.5 text-botanical-400" />
                <span>Farmer</span>
              </button>
              <button type="button" onClick={() => handleQuickDemoLogin('buyer')} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-bg-800 border border-bg-700 hover:border-deepteal-700 hover:bg-deepteal-900/40 text-cream-100 rounded-lg font-medium transition-all cursor-pointer shadow-xs">
                <ShoppingCart className="w-3.5 h-3.5 text-deepteal-400" />
                <span>Buyer</span>
              </button>
              <button type="button" onClick={() => handleQuickDemoLogin('logistics')} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-bg-800 border border-bg-700 hover:border-olive-700 hover:bg-olive-900/40 text-cream-100 rounded-lg font-medium transition-all cursor-pointer shadow-xs">
                <Truck className="w-3.5 h-3.5 text-olive-400" />
                <span>Logistics</span>
              </button>
              <button type="button" onClick={() => handleQuickDemoLogin('admin')} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-bg-800 border border-bg-700 hover:border-sage-700 hover:bg-sage-900/40 text-cream-100 rounded-lg font-medium transition-all cursor-pointer shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-sage-400" />
                <span>Admin</span>
              </button>
            </div>
          </div>

          {/* Language Selector - Integrated */}
          <div className="flex items-center gap-2 p-3 bg-bg-800 border border-bg-700 rounded-xl text-xs font-medium text-cream-400">
            <Globe className="w-3.5 h-3.5 text-cream-500 shrink-0" />
            <label htmlFor="lang-select" className="text-cream-400">Interface Language</label>
            <select
              id="lang-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value as typeof language)}
              className="ml-auto bg-bg-700 border border-bg-600 rounded-md px-2 py-1.5 text-xs font-medium text-cream-100 focus:outline-none focus:ring-2 focus:ring-forest-500 cursor-pointer"
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
                <label htmlFor="phone-input" className="block text-xs font-medium text-cream-500 uppercase tracking-wide mb-1.5">
                  Phone Number / मोबाईल नंबर
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-cream-500 absolute left-3 top-3.5" />
                  <input
                    type="tel"
                    id="phone-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, handleSendOtp)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-4 py-2.5 text-sm font-medium bg-bg-800 border border-bg-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-forest-500 transition-colors text-cream-100 placeholder:text-cream-600"
                    maxLength={15}
                    inputMode="tel"
                  />
                </div>
              </div>

              <Button id="send-otp-btn" onClick={handleSendOtp} disabled={isSending || phone.length < 10} loading={isSending} fullWidth variant="botanical">
                Send OTP →
              </Button>
            </div>
          )}

          {/* OTP Input */}
          {showOtpInput && (
            <div className="space-y-3">
              <div className="p-3 bg-botanical-900/30 border border-botanical-800/50 rounded-xl text-xs text-botanical-100 flex flex-col gap-1 font-medium">
                <span>OTP sent to <strong className="font-semibold text-cream-100">{pendingPhone || phone}</strong></span>
                {devOtpHint && <span className="text-cream-500 font-medium">{devOtpHint}</span>}
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label htmlFor="otp-input" className="block text-xs font-medium text-cream-500 uppercase tracking-wide">Enter 6-digit OTP</label>
                  <button type="button" onClick={() => setOtp('123456')} className="text-xs font-medium text-botanical-400 hover:text-botanical-300 cursor-pointer">
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
                  className="w-full px-4 py-3 text-xl font-bold tracking-[0.4em] text-cream-100 border border-bg-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-botanical-500 text-center transition-colors bg-bg-800"
                />
              </div>

              <Button id="verify-otp-btn" onClick={handleVerifyOtp} disabled={isVerifying || otp.length !== 6} loading={isVerifying} fullWidth variant="botanical">
                Verify OTP & Continue →
              </Button>

              <button onClick={() => { setShowOtpInput(false); setOtp(''); setError(''); }} className="w-full py-2 text-xs font-medium text-cream-500 hover:text-cream-300 transition-colors cursor-pointer">
                ← Use a different phone number
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-copper-900/30 border border-copper-800/50 rounded-xl text-xs text-copper-100 font-medium">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-bg-800/50 border-t border-bg-700 text-[11px] text-cream-500 text-center font-medium">
          Secure OTP login — your identity stays anonymous until trade confirmation.
        </div>
      </div>
    </div>
  );
};