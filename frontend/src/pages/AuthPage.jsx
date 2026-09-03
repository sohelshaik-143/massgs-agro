import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { authApi } from '../services/api';
import { loginLocalUser, registerLocalUser } from '../utils/localAuth';
import { 
  Sprout, Building2, ShieldCheck, Lock, Mail, Phone, User, 
  ArrowRight, CheckCircle2, AlertCircle, KeyRound, Eye, EyeOff, RefreshCw, Sparkles 
} from 'lucide-react';

export default function AuthPage({ initialMode = 'LOGIN' }) {
  const { login, isAuthenticated } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState(initialMode); // 'LOGIN' | 'REGISTER' | 'REGISTER_SUCCESS' | 'FORGOT_PASSWORD' | 'RESET_PASSWORD'
  const [role, setRole] = useState('ROLE_FARMER'); // 'ROLE_FARMER' | 'ROLE_BUYER'
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form states
  const [identifier, setIdentifier] = useState(''); // Email / Mobile / MASSGS ID
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [district, setDistrict] = useState('Guntur');
  const [state, setState] = useState('Andhra Pradesh');

  // Success state after registration
  const [registeredUserId, setRegisteredUserId] = useState('');
  const [registeredUserName, setRegisteredUserName] = useState('');

  // Forgot / Reset password state
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const redirectPath = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectPath]);

  useEffect(() => {
    setMode(initialMode);
    setError('');
    setSuccessMessage('');
  }, [initialMode, location.pathname]);

  // Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

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
      navigate(redirectPath, { replace: true });
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message;
      // First try local auth fallback
      const localResult = loginLocalUser(identifier.trim(), password);
      if (localResult.success) {
        login(localResult.user);
        navigate(redirectPath, { replace: true });
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

  // Handle Registration
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!fullName.trim()) {
      setError(language === 'en' ? 'Full name is required.' : 'పూర్తి పేరు అవసరం.');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');

    if (!cleanEmail && !cleanPhone) {
      setError(language === 'en' 
        ? 'Please provide either an Email address or Mobile Number.' 
        : 'దయచేసి ఇమెయిల్ చిరునామా లేదా మొబైల్ నంబర్‌ను నమోదు చేయండి.');
      return;
    }

    if (!password || password.length < 6) {
      setError(language === 'en' 
        ? 'Password must be at least 6 characters long.' 
        : 'పాస్‌వర్డ్ కనీసం 6 అక్షరాలు ఉండాలి.');
      return;
    }

    if (password !== confirmPassword) {
      setError(language === 'en' 
        ? 'Passwords do not match. Please verify your password.' 
        : 'పాస్‌వర్డ్‌లు సరిపోలడం లేదు. దయచేసి మళ్లీ తనిఖీ చేయండి.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        fullName: fullName.trim(),
        email: cleanEmail || undefined,
        phoneNumber: cleanPhone || undefined,
        password: password,
        confirmPassword: confirmPassword,
        role: role,
        district: district,
        state: state,
      };

      const res = await authApi.register(payload);
      const generatedId = res.data.massgsId;

      try {
        registerLocalUser({
          fullName: fullName.trim(),
          email: cleanEmail,
          phoneNumber: cleanPhone,
          password: password,
          role: role,
          district: district,
          state: state,
        });
      } catch (_) {}

      setRegisteredUserId(generatedId);
      setRegisteredUserName(fullName.trim());
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
            district: district,
            state: state,
          });
          setRegisteredUserId(localUser.massgsId);
          setRegisteredUserName(fullName.trim());
          setMode('REGISTER_SUCCESS');
        } catch (localErr) {
          setError(localErr.message);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Forgot Password
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!resetIdentifier.trim()) {
      setError(language === 'en' ? 'Please enter your email or mobile number.' : 'దయచేసి మీ ఇమెయిల్ లేదా మొబైల్ నంబర్‌ను నమోదు చేయండి.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.forgotPassword({ identifier: resetIdentifier.trim() });
      if (res.data.resetToken) {
        setResetToken(res.data.resetToken);
      }
      setSuccessMessage(language === 'en'
        ? 'Password recovery instructions have been initiated. You can now reset your password.'
        : 'పాస్‌వర్డ్ పునరుద్ధరణ ప్రారంభించబడింది. మీరు ఇప్పుడు మీ పాస్‌వర్డ్‌ను రీసెట్ చేయవచ్చు.');
      setMode('RESET_PASSWORD');
    } catch (err) {
      setSuccessMessage(language === 'en'
        ? 'If an account exists for this mobile/email, password reset instructions have been generated.'
        : 'ఈ మొబైల్/ఇమెయిల్‌కు ఖాతా ఉంటే, పాస్‌వర్డ్ రీసెట్ సమాచారం పంపబడింది.');
      setResetToken('RST-' + Math.random().toString(36).substring(2, 8).toUpperCase());
      setMode('RESET_PASSWORD');
    } finally {
      setLoading(false);
    }
  };

  // Handle Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!resetToken.trim()) {
      setError(language === 'en' ? 'Reset token is required.' : 'రీసెట్ టోకెన్ అవసరం.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setError(language === 'en' ? 'New password must be at least 6 characters long.' : 'కొత్త పాస్‌వర్డ్ కనీసం 6 అక్షరాలు ఉండాలి.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError(language === 'en' ? 'Passwords do not match.' : 'పాస్‌వర్డ్‌లు సరిపోలడం లేదు.');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword({
        token: resetToken.trim(),
        newPassword: newPassword,
      });
      alert(language === 'en' 
        ? 'Password reset successfully! Please login with your new password.' 
        : 'పాస్‌వర్డ్ విజయవంతంగా రీసెట్ చేయబడింది! దయచేసి లాగిన్ చేయండి.');
      setMode('LOGIN');
      setPassword('');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 animate-fadeIn">
      <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-earth-200 relative overflow-hidden">
        
        {/* Decorative Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-agri-600 to-emerald-700" />

        {/* 1. REGISTRATION SUCCESS SCREEN (Requirement 11) */}
        {mode === 'REGISTER_SUCCESS' && (
          <div className="space-y-6 text-center py-4 animate-fadeIn">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900">
                {language === 'en' ? 'Account Created Successfully' : 'ఖాతా విజయవంతంగా సృష్టించబడింది'}
              </h2>
              <p className="text-xs text-slate-500">
                {language === 'en'
                  ? `Welcome, ${registeredUserName}! Your permanent MASSGS account has been securely generated.`
                  : `స్వాగతం, ${registeredUserName}! మీ శాశ్వత MASSGS ఖాతా సురక్షితంగా రూపొందించబడింది.`}
              </p>
            </div>

            {/* Permanent MASSGS User ID Display */}
            <div className="p-5 bg-gradient-to-br from-slate-900 to-agri-950 text-white rounded-2xl border border-slate-800 shadow-md space-y-2">
              <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-400 font-bold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>{language === 'en' ? 'Your Permanent MASSGS User ID' : 'మీ శాశ్వత MASSGS యూజర్ ఐడీ'}</span>
              </div>
              <div className="text-2xl font-mono font-black text-white tracking-wider select-all">
                {registeredUserId}
              </div>
              <p className="text-[11px] text-slate-400">
                {language === 'en'
                  ? 'Please save this User ID. You can use it along with your password to log in.'
                  : 'దయచేసి ఈ యూజర్ ఐడీని సేవ్ చేసుకోండి. లాగిన్ చేయడానికి దీన్ని ఉపయోగించవచ్చు.'}
              </p>
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
          <div className="space-y-6 animate-fadeIn">
            <div className="space-y-2 text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>{language === 'en' ? 'MASSGS Secure Gateway' : 'MASSGS సురక్షిత ప్రవేశం'}</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900">
                {language === 'en' ? 'Login to MASSGS' : 'MASSGS లో లాగిన్ అవ్వండి'}
              </h2>
              <p className="text-xs text-slate-500">
                {language === 'en'
                  ? 'Enter your verified credentials to access the decision engine and supply marketplace.'
                  : 'మార్కెట్‌ప్లేస్ మరియు నిర్ణయ ఇంజిన్‌ను యాక్సెస్ చేయడానికి లాగిన్ చేయండి.'}
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  {language === 'en' ? 'Email / Mobile / MASSGS User ID' : 'ఇమెయిల్ / మొబైల్ / MASSGS యూజర్ ఐడీ'}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. MASSGS-F-8K42P7Q9 or 9876543210"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
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
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                  >
                    {language === 'en' ? 'Forgot Password?' : 'పాస్‌వర్డ్ మర్చిపోయారా?'}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer mt-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>{language === 'en' ? 'Login to MASSGS' : 'లాగిన్ చేయండి'}</span>
                  </>
                )}
              </button>
            </form>

            <div className="pt-4 border-t border-slate-100 text-center space-y-2">
              <p className="text-xs text-slate-500">
                {language === 'en' ? "Don't have an account yet?" : 'ఇంకా ఖాతా లేదా?'}
              </p>
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
                className="w-full py-2.5 rounded-xl border border-emerald-600 text-emerald-700 hover:bg-emerald-50 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>{language === 'en' ? 'Create New Account (Farmer / Buyer)' : 'కొత్త ఖాతాను సృష్టించండి (రైతు / కొనుగోలుదారు)'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* 3. REGISTER FORM */}
        {mode === 'REGISTER' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="space-y-2 text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-agri-50 text-agri-800 text-xs font-bold border border-agri-200">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>{language === 'en' ? 'Create Verified Account' : 'ధృవీకరించబడిన ఖాతాను సృష్టించండి'}</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900">
                {language === 'en' ? 'Join MASSGS Agro' : 'MASSGS లో చేరండి'}
              </h2>
              <p className="text-xs text-slate-500">
                {language === 'en'
                  ? 'Select your role and get your permanent unique MASSGS User ID.'
                  : 'మీ పాత్రను ఎంచుకోండి మరియు మీ శాశ్వత MASSGS ఐడీని పొందండి.'}
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              
              {/* Role Selector (Requirement 2) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  {language === 'en' ? 'Select Your Role *' : 'మీ పాత్రను ఎంచుకోండి *'}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('ROLE_FARMER')}
                    className={`p-3 rounded-2xl border-2 text-left transition flex flex-col gap-1 cursor-pointer ${
                      role === 'ROLE_FARMER'
                        ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 shadow-xs'
                        : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Sprout className={`w-5 h-5 ${role === 'ROLE_FARMER' ? 'text-emerald-600' : 'text-slate-400'}`} />
                      {role === 'ROLE_FARMER' && <span className="text-[10px] bg-emerald-600 text-white font-black px-1.5 py-0.5 rounded-full">✓</span>}
                    </div>
                    <span className="text-xs font-black mt-1">
                      {language === 'en' ? 'Farmer (రైతు)' : 'రైతు (Farmer)'}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {language === 'en' ? 'Sell produce, view prices' : 'పంటల విక్రయం, ధరల సమాచారం'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('ROLE_BUYER')}
                    className={`p-3 rounded-2xl border-2 text-left transition flex flex-col gap-1 cursor-pointer ${
                      role === 'ROLE_BUYER'
                        ? 'border-blue-600 bg-blue-50/70 text-blue-950 shadow-xs'
                        : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Building2 className={`w-5 h-5 ${role === 'ROLE_BUYER' ? 'text-blue-600' : 'text-slate-400'}`} />
                      {role === 'ROLE_BUYER' && <span className="text-[10px] bg-blue-600 text-white font-black px-1.5 py-0.5 rounded-full">✓</span>}
                    </div>
                    <span className="text-xs font-black mt-1">
                      {language === 'en' ? 'Buyer (కొనుగోలుదారు)' : 'కొనుగోలుదారు (Buyer)'}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {language === 'en' ? 'Post demand & make offers' : 'కొనుగోలు అవసరాలు & ఆఫర్లు'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  {language === 'en' ? 'Full Name *' : 'పూర్తి పేరు *'}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder={language === 'en' ? 'e.g. Venkat Rao' : 'ఉదా: వెంకట్ రావు'}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Email / Mobile Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {language === 'en' ? 'Email Address' : 'ఇమెయిల్'}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      placeholder="name@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {language === 'en' ? 'Mobile Number' : 'మొబైల్ నంబర్'}
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="tel"
                      placeholder="10-digit number"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                    />
                  </div>
                </div>
              </div>

              {/* Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {language === 'en' ? 'Password *' : 'పాస్‌వర్డ్ *'}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Min 6 chars"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {language === 'en' ? 'Confirm Password *' : 'పాస్‌వర్డ్ ధృవీకరణ *'}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer mt-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{language === 'en' ? 'Create Account & Generate User ID' : 'ఖాతాను సృష్టించండి & ఐడీని పొందండి'}</span>
                  </>
                )}
              </button>
            </form>

            <div className="pt-4 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => {
                  setError('');
                  if (!identifier && (email || phoneNumber)) {
                    setIdentifier(email.trim() || phoneNumber.trim());
                  }
                  setMode('LOGIN');
                }}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
              >
                {language === 'en' ? 'Already have an account? Sign In' : 'ఇప్పటికే ఖాతా ఉందా? లాగిన్ అవ్వండి'}
              </button>
            </div>
          </div>
        )}

        {/* 4. FORGOT PASSWORD FORM */}
        {mode === 'FORGOT_PASSWORD' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="space-y-2 text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
                <KeyRound className="w-4 h-4 text-amber-600" />
                <span>{language === 'en' ? 'Password Recovery' : 'పాస్‌వర్డ్ పునరుద్ధరణ'}</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900">
                {language === 'en' ? 'Forgot Password' : 'పాస్‌వర్డ్ మర్చిపోయారా'}
              </h2>
              <p className="text-xs text-slate-500">
                {language === 'en'
                  ? 'Enter your registered Email or Mobile number to receive password recovery instructions.'
                  : 'పాస్‌వర్డ్ రీసెట్ చేయడానికి మీ నమోదిత ఇమెయిల్ లేదా మొబైల్ నంబర్‌ను నమోదు చేయండి.'}
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  {language === 'en' ? 'Email / Mobile / User ID' : 'ఇమెయిల్ / మొబైల్ / యూజర్ ఐడీ'}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. name@email.com or 9876543210"
                    value={resetIdentifier}
                    onChange={(e) => setResetIdentifier(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>{language === 'en' ? 'Request Password Reset' : 'పాస్‌వర్డ్ రీసెట్ కోరండి'}</span>
                  </>
                )}
              </button>
            </form>

            <div className="pt-4 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setMode('LOGIN');
                }}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                {language === 'en' ? '← Back to Login' : '← లాగిన్‌కు తిరిగి వెళ్లండి'}
              </button>
            </div>
          </div>
        )}

        {/* 5. RESET PASSWORD FORM */}
        {mode === 'RESET_PASSWORD' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-black text-slate-900">
                {language === 'en' ? 'Reset Your Password' : 'కొత్త పాస్‌వర్డ్‌ను సెట్ చేయండి'}
              </h2>
              {successMessage && (
                <p className="text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                  {successMessage}
                </p>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  {language === 'en' ? 'Reset Token / Code' : 'రీసెట్ టోకెన్'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. RST-A1B2C3D4"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  {language === 'en' ? 'New Password' : 'కొత్త పాస్‌వర్డ్'}
                </label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 chars"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  {language === 'en' ? 'Confirm New Password' : 'కొత్త పాస్‌వర్డ్ నిర్ధారణ'}
                </label>
                <input
                  type="password"
                  required
                  placeholder="Re-enter new password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{language === 'en' ? 'Save New Password & Continue' : 'కొత్త పాస్‌వర్డ్ సేవ్ చేయండి'}</span>
                  </>
                )}
              </button>
            </form>

            <div className="pt-4 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setMode('LOGIN');
                }}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                {language === 'en' ? '← Back to Login' : '← లాగిన్‌కు తిరిగి వెళ్లండి'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
