import React, { useState } from 'react';
import { Mic, MicOff, ShieldCheck, X, CheckCircle2 } from 'lucide-react';
import { I18N_STRINGS } from '../data/i18n';
import { useAuth } from '../lib/auth-context';
import { useTranslation } from 'react-i18next';

interface OtpScreenProps {
  initialLanguage?: 'en' | 'hi' | 'mr' | 'te' | 'pa';
}

export const OtpScreen: React.FC<OtpScreenProps> = ({
  initialLanguage = 'en',
}) => {
  const { t } = useTranslation();
  const [language, setLanguage] = useState<'en' | 'hi' | 'mr' | 'te' | 'pa'>(initialLanguage);
  const [phone, setPhone] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string>('');
  const { loginWithOtp, verifyOtp, isAuthenticated } = useAuth();

  const handleLanguageChange = (lang: 'en' | 'hi' | 'mr' | 'te' | 'pa') => {
    setLanguage(lang);
  };

  const handleSendOtp = async () => {
    if (!phone || !phone.startsWith('+91')) {
      setError('Valid Indian phone number (+91...) is required');
      return;
    }
    setError('');
    setIsVerifying(true);
    try {
      await loginWithOtp(phone);
      setShowOtpInput(true);
    } catch (e: any) {
      setError(e.message || 'Failed to send OTP');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    setIsVerifying(true);
    try {
      const verified = await verifyOtp(otp);
      if (verified) {
        // Redirect based on role - in a full app this would use the role from JWT
        // For now, redirect to farmer dashboard
        // In real implementation, we'd check the role from the JWT claims
        window.location.href = '/farmer';
      } else {
        setError('Invalid OTP. Please try again.');
      }
    } catch (e: any) {
      setError(e.message || 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  // Auto-focus phone input on mount
  useEffect(() => {
    const phoneInput = document.getElementById('phone-input');
    if (phoneInput) phoneInput.focus();
  }, []);

  if (isAuthenticated) {
    // Already logged in, redirect based on role
    // This shouldn't happen on the auth screen, but just in case
    setTimeout(() => {
      window.location.href = '/farmer';
    }, 100);
    return null;
  }

  return (
    <div className="min-h-screen bg-stone-100/70 flex items-center justify-center p-4 sm:p-6">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-900 text-white">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-300" />
            <div>
              <h3 className="text-base font-bold">
                {t.auth.title || 'Welcome to Vasundhara'}
              </h3>
              <p className="text-xs text-emerald-200">
                {t.auth.subtitle || 'Phone number OTP verification'}
              </p>
            </div>
          </div>
          <button
            onClick={() => window.history.back()}
            className="p-1 text-emerald-200 hover:text-white rounded-full transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Section */}
        <div className="p-6 overflow-y-auto space-y-5">

          {/* Language Selector */}
          <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-600 flex items-center gap-2">
            <span className="font-medium text-stone-800">Language</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="bg-transparent font-medium text-stone-800 focus:outline-none cursor-pointer"
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
            <div>
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl mb-4">
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {t.auth.phoneLabel || 'Phone Number'}
                </label>
                <input
                  type="tel"
                  id="phone-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98231 44521"
                  className="w-full px-3 py-2 text-xs font-semibold bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  maxLength="15"
                />
                <p className="text-xs text-stone-500 mt-1">
                  {t.auth.phoneHint || 'Enter your Indian mobile number'}
                </p>
              </div>

              <button
                onClick={handleSendOtp}
                disabled={isVerifying || !phone.startsWith('+91')}
                className={`w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer ${
                  (!phone.startsWith('+91') || isVerifying)
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer'
                }`}
              >
                {isVerifying ? 'Sending OTP...' : 'Send OTP'}
              </button>
              {error && (
                <p className="mt-2 text-sm text-rose-600">{error}</p>
              )}
            </div>
          )}

          {/* OTP Verification */}
          {showOtpInput && (
            <div>
              <p className="text-xs text-stone-500 mb-3">
                {t.auth.otpReceived || 'OTP sent to your phone'}
              </p>

              <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl mb-4">
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  maxLength="6"
                  className="w-full px-3 py-2 text-xl text-stone-900 font-bold border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center"
                />
                <p className="text-xs text-stone-500 mt-1">
                  {t.auth.otpHint || 'Enter the 6-digit OTP sent to your phone'}
                </p>
              </div>

              <button
                onClick={handleVerifyOtp}
                disabled={isVerifying || otp.length !== 6}
                className={`w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer ${
                  otp.length !== 6 || isVerifying
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer'
                }`}
              >
                {isVerifying ? 'Verifying OTP...' : 'Verify OTP'}
              </button>
              {error && (
                <p className="mt-2 text-sm text-rose-600">{error}</p>
              )}

              {isVerifying && (
                <p className="mt-3 text-xs text-stone-500">
                  {t.auth.verifying || 'Verifying...'}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer notice */}
        <div className="p-3 bg-stone-50 border-t border-stone-200 text-xs text-stone-600">
          {t.auth.noAccount || 'Do not have an account? Register below.'}
        </div>

      </div>
    </div>
  );
};