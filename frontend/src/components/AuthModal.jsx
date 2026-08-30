import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { authApi } from '../services/api';
import { Phone, ShieldCheck, X, ArrowRight, UserCheck, KeyRound, Clock } from 'lucide-react';

export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, login, modalDefaultRole } = useAuth();
  const { t, language } = useLanguage();

  const [step, setStep] = useState('PHONE'); // PHONE | OTP
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState(modalDefaultRole || 'ROLE_FARMER');
  const [otpCode, setOtpCode] = useState('');
  const [debugOtp, setDebugOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  if (!isAuthModalOpen) return null;

  const handleRequestOtp = async (e) => {
    e?.preventDefault();
    setError('');
    const cleaned = phoneNumber.replace(/[^0-9]/g, '');
    if (cleaned.length < 10) {
      setError(language === 'en' ? 'Please enter a valid 10-digit mobile number' : 'దయచేసి సరైన 10 అంకెల మొబైల్ నంబర్‌ను నమోదు చేయండి');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.requestOtp({
        phoneNumber: cleaned,
        fullName: fullName.trim() || undefined,
        role: role,
      });
      setDebugOtp(res.data.debugOtpCode || '');
      setStep('OTP');
      setCooldown(res.data.resendCooldownSeconds || 30);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to request OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    setError('');
    if (!otpCode || otpCode.trim().length < 6) {
      setError(language === 'en' ? 'Please enter the 6-digit OTP' : 'దయచేసి 6 అంకెల OTP ని నమోదు చేయండి');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.verifyOtp({
        phoneNumber: phoneNumber.replace(/[^0-9]/g, ''),
        otpCode: otpCode.trim(),
      });
      login(res.data);
      resetState();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (selectedRole) => {
    setLoading(true);
    setError('');
    const demoPhone = selectedRole === 'ROLE_BUYER' ? '9876543210' : '9123456780';
    const demoName = selectedRole === 'ROLE_BUYER' ? 'Coastal Agro Procurement' : 'Venkat Farmer';
    try {
      const reqRes = await authApi.requestOtp({
        phoneNumber: demoPhone,
        fullName: demoName,
        role: selectedRole,
      });
      const code = reqRes.data.debugOtpCode || '123456';
      const verifyRes = await authApi.verifyOtp({
        phoneNumber: demoPhone,
        otpCode: code,
      });
      login(verifyRes.data);
      resetState();
    } catch (err) {
      console.warn('Backend authentication unavailable, logging in with demo guest profile:', err);
      login({
        token: 'demo-jwt-token-guest',
        userId: selectedRole === 'ROLE_BUYER' ? 2 : 1,
        roleEntityId: selectedRole === 'ROLE_BUYER' ? 2 : 1,
        phoneNumber: demoPhone,
        fullName: demoName,
        role: selectedRole,
        district: 'Guntur',
        state: 'Andhra Pradesh',
      });
      resetState();
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setStep('PHONE');
    setPhoneNumber('');
    setFullName('');
    setOtpCode('');
    setDebugOtp('');
    setError('');
    closeAuthModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-earth-200 relative overflow-hidden">
        {/* Close Button */}
        <button
          onClick={resetState}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold mb-4">
          <ShieldCheck className="w-4 h-4" />
          <span>{language === 'en' ? 'Permanent Identity • Zero Fixed OTP' : 'శాశ్వత ఐడీ • సురక్షిత OTP'}</span>
        </div>

        <h2 className="text-xl font-black text-slate-900">
          {step === 'PHONE' 
            ? (language === 'en' ? 'MASSGS Mobile Login' : 'మొబైల్ నంబర్‌తో లాగిన్')
            : (language === 'en' ? 'Verify 6-Digit OTP' : '6-అంకెల OTP ని ధృవీకరించండి')}
        </h2>
        <p className="text-xs text-slate-500 mt-1 mb-6">
          {step === 'PHONE'
            ? (language === 'en' ? 'Receive an authentic temporary OTP linked to your permanent MASSGS ID.' : 'మీ శాశ్వత MASSGS ఐడీకి అనుసంధానించబడిన తాత్కాలిక OTP ని పొందండి.')
            : (language === 'en' ? `Enter the code sent to ${phoneNumber}` : `${phoneNumber} కు పంపిన కోడ్‌ను నమోదు చేయండి`)}
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        {step === 'PHONE' ? (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {language === 'en' ? 'I am joining as' : 'నేను నమోదు చేసుకుంటున్నాను'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('ROLE_FARMER')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    role === 'ROLE_FARMER'
                      ? 'bg-agri-800 text-white border-agri-800 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  🌾 {language === 'en' ? 'Farmer / Seller' : 'రైతు / విక్రేత'}
                </button>
                <button
                  type="button"
                  onClick={() => setRole('ROLE_BUYER')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    role === 'ROLE_BUYER'
                      ? 'bg-agri-800 text-white border-agri-800 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  🏢 {language === 'en' ? 'Buyer / Trader' : 'కొనుగోలుదారు'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {language === 'en' ? 'Full Name' : 'పూర్తి పేరు'}
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={role === 'ROLE_BUYER' ? 'e.g. Krishna Agro Trading' : 'e.g. Venkat Reddy'}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-agri-500 focus:border-transparent outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {language === 'en' ? 'Mobile Number (10 Digits)' : 'మొబైల్ నంబర్ (10 అంకెలు)'}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-xs font-bold text-slate-400">
                  +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="9876543210"
                  required
                  className="w-full pl-12 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold tracking-wider focus:ring-2 focus:ring-agri-500 focus:border-transparent outline-none transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-agri-800 hover:bg-agri-700 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{language === 'en' ? 'Send 6-Digit OTP' : 'OTP పంపండి'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Quick One-Click Demo Logins */}
            <div className="pt-4 border-t border-slate-100 text-center">
              <p className="text-[11px] text-slate-400 font-semibold mb-2.5">
                {language === 'en' ? 'Or fast test with one-click role profile:' : 'లేదా ఒక క్లిక్‌తో త్వరిత లాగిన్ చేయండి:'}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('ROLE_FARMER')}
                  className="py-2 px-2.5 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  ⚡ {language === 'en' ? 'Test Farmer' : 'టెస్ట్ రైతు'}
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('ROLE_BUYER')}
                  className="py-2 px-2.5 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  ⚡ {language === 'en' ? 'Test Buyer' : 'టెస్ట్ కొనుగోలుదారు'}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            {debugOtp && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-bold flex items-center justify-between">
                <span>{language === 'en' ? 'Demo OTP Code:' : 'డెమో OTP కోడ్:'}</span>
                <span className="text-sm tracking-widest font-black font-mono bg-white px-2 py-0.5 rounded border border-emerald-300">
                  {debugOtp}
                </span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {language === 'en' ? 'Enter 6-Digit OTP' : '6 అంకెల OTP ని నమోదు చేయండి'}
              </label>
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="123456"
                autoFocus
                className="w-full text-center tracking-[0.5em] text-lg font-black py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-agri-500 focus:border-transparent outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-agri-800 hover:bg-agri-700 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>{language === 'en' ? 'Verify & Access Dashboard' : 'ధృవీకరించి డాష్‌బోర్డ్‌లోకి వెళ్లండి'}</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-xs pt-2">
              <button
                type="button"
                onClick={() => setStep('PHONE')}
                className="text-slate-500 hover:text-slate-900 font-semibold"
              >
                ← {language === 'en' ? 'Change Phone' : 'నంబర్ మార్చండి'}
              </button>

              <button
                type="button"
                onClick={handleRequestOtp}
                disabled={cooldown > 0 || loading}
                className="text-agri-700 hover:text-agri-900 font-bold disabled:text-slate-400"
              >
                {cooldown > 0 
                  ? `${language === 'en' ? 'Resend in' : 'మళ్లీ పంపడానికి'} ${cooldown}s` 
                  : (language === 'en' ? 'Resend OTP' : 'OTP మళ్లీ పంపండి')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
