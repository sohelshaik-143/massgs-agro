import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { authApi } from '../services/api';
import { loginLocalUser, registerLocalUser } from '../utils/localAuth';
import { 
  Sprout, Building2, ShieldCheck, X, ArrowRight, CheckCircle2, 
  AlertCircle, Lock, User, Mail, Phone, KeyRound, Eye, EyeOff, Sparkles 
} from 'lucide-react';

export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, login, modalDefaultRole, modalDefaultMode } = useAuth();
  const { t, language } = useLanguage();

  const [mode, setMode] = useState(modalDefaultMode || 'LOGIN'); // 'LOGIN' | 'REGISTER' | 'REGISTER_SUCCESS' | 'FORGOT_PASSWORD'
  const [role, setRole] = useState(modalDefaultRole || 'ROLE_FARMER');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Registration success state
  const [registeredUserId, setRegisteredUserId] = useState('');

  // Forgot password state
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  useEffect(() => {
    if (isAuthModalOpen) {
      setMode(modalDefaultMode || 'LOGIN');
      setRole(modalDefaultRole || 'ROLE_FARMER');
      setError('');
    }
  }, [isAuthModalOpen, modalDefaultMode, modalDefaultRole]);

  if (!isAuthModalOpen) return null;

  const handleLogin = async (e) => {
    e?.preventDefault();
    setError('');

    if (!identifier.trim() || !password) {
      setError(language === 'en' 
        ? 'Please enter your email/mobile and password.' 
        : 'దయచేసి మీ ఇమెయిల్/మొబైల్ మరియు పాస్‌వర్డ్‌ను నమోదు చేయండి.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.login({
        identifier: identifier.trim(),
        password: password,
      });
      login(res.data);
      closeAuthModal();
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message;
      // First check local/offline authentication
      const localResult = loginLocalUser(identifier.trim(), password);
      if (localResult.success) {
        login(localResult.user);
        closeAuthModal();
        return;
      }

      if (err.response?.status === 400 || err.response?.status === 401 || errMsg?.includes('Invalid') || errMsg?.includes('credentials')) {
        setError(language === 'en'
          ? 'Invalid credentials. Please check your email/mobile and password.'
          : 'చెల్లని ఆధారాలు. దయచేసి మీ ఇమెయిల్/మొబైల్ మరియు పాస్‌వర్డ్‌ను తనిఖీ చేయండి.');
      } else {
        setError(localResult.message || (language === 'en'
          ? 'Invalid credentials. Please check your email/mobile and password.'
          : 'చెల్లని ఆధారాలు. దయచేసి మీ ఇమెయిల్/మొబైల్ మరియు పాస్‌వర్డ్‌ను తనిఖీ చేయండి.'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e?.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError(language === 'en' ? 'Full name is required.' : 'పూర్తి పేరు అవసరం.');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');

    if (!cleanEmail && !cleanPhone) {
      setError(language === 'en' ? 'Please provide an Email or Mobile number.' : 'దయచేసి ఇమెయిల్ లేదా మొబైల్ నంబర్‌ను నమోదు చేయండి.');
      return;
    }

    if (!password || password.length < 6) {
      setError(language === 'en' ? 'Password must be at least 6 characters long.' : 'పాస్‌వర్డ్ కనీసం 6 అక్షరాలు ఉండాలి.');
      return;
    }

    if (password !== confirmPassword) {
      setError(language === 'en' ? 'Passwords do not match.' : 'పాస్‌వర్డ్‌లు సరిపోలడం లేదు.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.register({
        fullName: fullName.trim(),
        email: cleanEmail || undefined,
        phoneNumber: cleanPhone || undefined,
        password: password,
        confirmPassword: confirmPassword,
        role: role,
      });
      // Also save locally so offline fallback has it
      try {
        registerLocalUser({
          fullName: fullName.trim(),
          email: cleanEmail,
          phoneNumber: cleanPhone,
          password: password,
          role: role,
        });
      } catch (_) {}
      setRegisteredUserId(res.data.massgsId);
      setMode('REGISTER_SUCCESS');
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message;
      if (err.response?.status === 400 || errMsg?.includes('already exists')) {
        setError(errMsg || (language === 'en'
          ? 'An account with this email address or mobile number already exists.'
          : 'ఈ ఇమెయిల్ లేదా మొబైల్ నంబర్‌తో ఖాతా ఇప్పటికే ఉంది.'));
      } else {
        try {
          const localUser = registerLocalUser({
            fullName: fullName.trim(),
            email: cleanEmail,
            phoneNumber: cleanPhone,
            password: password,
            role: role,
          });
          setRegisteredUserId(localUser.massgsId);
          setMode('REGISTER_SUCCESS');
        } catch (localErr) {
          setError(localErr.message);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e?.preventDefault();
    setError('');
    setForgotSuccess('');

    if (!forgotIdentifier.trim()) {
      setError(language === 'en' ? 'Please enter your email or mobile.' : 'దయచేసి ఇమెయిల్ లేదా మొబైల్ నమోదు చేయండి.');
      return;
    }

    setLoading(true);
    try {
      await authApi.forgotPassword({ identifier: forgotIdentifier.trim() });
    } catch (_) {}
    setForgotSuccess(language === 'en'
      ? 'If an account exists, password recovery instructions have been initiated.'
      : 'ఖాతా ఉంటే, పాస్‌వర్డ్ రికవరీ సమాచారం పంపబడింది.');
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-earth-200 relative overflow-hidden max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 1. REGISTRATION SUCCESS */}
        {mode === 'REGISTER_SUCCESS' && (
          <div className="space-y-6 text-center py-4 animate-fadeIn">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-black text-slate-900">
                {language === 'en' ? 'Account Created Successfully' : 'ఖాతా విజయవంతంగా సృష్టించబడింది'}
              </h2>
              <p className="text-xs text-slate-500">
                {language === 'en' ? 'Your permanent MASSGS account has been generated.' : 'మీ శాశ్వత MASSGS ఖాతా రూపొందించబడింది.'}
              </p>
            </div>

            <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-center gap-1 text-[11px] text-emerald-400 font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'Your MASSGS User ID' : 'మీ MASSGS యూజర్ ఐడీ'}</span>
              </div>
              <div className="text-xl font-mono font-black tracking-wider text-white select-all">
                {registeredUserId}
              </div>
            </div>

            <button
              onClick={() => {
                setIdentifier(registeredUserId || email || phoneNumber);
                setMode('LOGIN');
              }}
              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{language === 'en' ? 'Continue to Login' : 'లాగిన్‌కు వెళ్లండి'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 2. LOGIN FORM */}
        {mode === 'LOGIN' && (
          <div className="space-y-5 animate-fadeIn">
            <div className="space-y-1 text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>{language === 'en' ? 'Secure Authentication' : 'సురక్షిత ప్రవేశం'}</span>
              </div>
              <h2 className="text-xl font-black text-slate-900">
                {language === 'en' ? 'Login to MASSGS' : 'MASSGS లో లాగిన్ అవ్వండి'}
              </h2>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  {language === 'en' ? 'Email / Mobile / User ID' : 'ఇమెయిల్ / మొబైల్ / యూజర్ ఐడీ'}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. MASSGS-F-8K42P7Q9 or 9876543210"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    {language === 'en' ? 'Password' : 'పాస్‌వర్డ్'}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setMode('FORGOT_PASSWORD');
                    }}
                    className="text-[11px] font-bold text-emerald-700 hover:underline"
                  >
                    {language === 'en' ? 'Forgot?' : 'మర్చిపోయారా?'}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>{language === 'en' ? 'Login' : 'లాగిన్'}</span>
                  </>
                )}
              </button>
            </form>

            <div className="pt-3 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => {
                  setError('');
                  if (identifier.includes('@') && !email) {
                    setEmail(identifier.trim());
                  } else if (/^\d+$/.test(identifier.trim()) && !phoneNumber) {
                    setPhoneNumber(identifier.trim());
                  }
                  setMode('REGISTER');
                }}
                className="w-full py-2 rounded-xl border border-emerald-600 text-emerald-700 hover:bg-emerald-50 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>{language === 'en' ? 'Create New Account (Farmer / Buyer)' : 'కొత్త ఖాతాను సృష్టించండి'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* 3. REGISTER FORM */}
        {mode === 'REGISTER' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="space-y-1 text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-agri-50 text-agri-800 text-[11px] font-bold border border-agri-200">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>{language === 'en' ? 'Create Account' : 'ఖాతా సృష్టించండి'}</span>
              </div>
              <h2 className="text-xl font-black text-slate-900">
                {language === 'en' ? 'Register on MASSGS' : 'MASSGS లో నమోదు అవ్వండి'}
              </h2>
            </div>

            {error && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-3">
              
              {/* Role Selection */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('ROLE_FARMER')}
                  className={`p-2.5 rounded-xl border-2 text-left transition flex items-center gap-2 cursor-pointer ${
                    role === 'ROLE_FARMER'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <Sprout className={`w-4 h-4 ${role === 'ROLE_FARMER' ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <div>
                    <span className="block text-xs font-black">Farmer</span>
                    <span className="block text-[10px] text-slate-500">రైతు</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('ROLE_BUYER')}
                  className={`p-2.5 rounded-xl border-2 text-left transition flex items-center gap-2 cursor-pointer ${
                    role === 'ROLE_BUYER'
                      ? 'border-blue-600 bg-blue-50 text-blue-950'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <Building2 className={`w-4 h-4 ${role === 'ROLE_BUYER' ? 'text-blue-600' : 'text-slate-400'}`} />
                  <div>
                    <span className="block text-xs font-black">Buyer</span>
                    <span className="block text-[10px] text-slate-500">కొనుగోలుదారు</span>
                  </div>
                </button>
              </div>

              {/* Full Name */}
              <div className="space-y-0.5">
                <label className="text-[11px] font-bold text-slate-700">Full Name *</label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-0.5">
                  <label className="text-[11px] font-bold text-slate-700">Email</label>
                  <input
                    type="email"
                    placeholder="name@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[11px] font-bold text-slate-700">Mobile</label>
                  <input
                    type="tel"
                    placeholder="10 digits"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Password & Confirm */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-0.5">
                  <label className="text-[11px] font-bold text-slate-700">Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Min 6 chars"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[11px] font-bold text-slate-700">Confirm *</label>
                  <input
                    type="password"
                    required
                    placeholder="Re-enter"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer mt-1"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{language === 'en' ? 'Register & Generate ID' : 'నమోదు చేయండి'}</span>
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setError('');
                  if (!identifier && (email || phoneNumber)) {
                    setIdentifier(email.trim() || phoneNumber.trim());
                  }
                  setMode('LOGIN');
                }}
                className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
              >
                {language === 'en' ? 'Already have an account? Sign In' : 'ఇప్పటికే ఖాతా ఉందా? లాగిన్ అవ్వండి'}
              </button>
            </div>
          </div>
        )}

        {/* 4. FORGOT PASSWORD */}
        {mode === 'FORGOT_PASSWORD' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="space-y-1 text-center">
              <h2 className="text-xl font-black text-slate-900">
                {language === 'en' ? 'Password Recovery' : 'పాస్‌వర్డ్ పునరుద్ధరణ'}
              </h2>
            </div>

            {forgotSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-medium">
                {forgotSuccess}
              </div>
            )}

            {error && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleForgotPassword} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Email or Mobile</label>
                <input
                  type="text"
                  required
                  placeholder="name@email.com or 9876543210"
                  value={forgotIdentifier}
                  onChange={(e) => setForgotIdentifier(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition shadow-sm"
              >
                {loading ? 'Processing...' : 'Send Recovery Instructions'}
              </button>
            </form>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setMode('LOGIN')}
                className="text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                ← Back to Login
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
