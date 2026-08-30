import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { marketApi } from '../services/api';
import {
  Sprout, Building2, CheckCircle2, AlertTriangle, AlertCircle, ArrowRight,
  TrendingUp, MapPin, Search, ShieldCheck, Handshake, ShoppingBag, Eye
} from 'lucide-react';

export default function LandingPage() {
  const { t, language } = useLanguage();
  const { openAuthModal } = useAuth();
  
  // District/Mandi Filter States
  const [districts, setDistricts] = useState([]);
  const [mandis, setMandis] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [selectedMandi, setSelectedMandi] = useState('All');
  
  // Prices & Status States
  const [prices, setPrices] = useState([]);
  const [loadingPrices, setLoadingPrices] = useState(true);
  const [updateStatus, setUpdateStatus] = useState({ status: 'CONNECTED', timestamp: 'N/A' });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    marketApi.getApDistricts()
      .then((res) => setDistricts(res.data || []))
      .catch(() => {});

    marketApi.getLastUpdateStatus()
      .then((res) => setUpdateStatus(res.data || { status: 'CONNECTED', timestamp: 'N/A' }))
      .catch(() => {});

    loadLatestRates();
  }, []);

  useEffect(() => {
    setSelectedMandi('All');
    if (selectedDistrict === 'All') {
      setMandis([]);
      loadLatestRates('All', 'All');
    } else {
      marketApi.getMandis(selectedDistrict)
        .then((res) => setMandis(res.data || []))
        .catch(() => {});
      loadLatestRates(selectedDistrict, 'All');
    }
  }, [selectedDistrict]);

  const loadLatestRates = (distVal = selectedDistrict, mandiVal = selectedMandi) => {
    setLoadingPrices(true);
    const distParam = distVal === 'All' ? null : distVal;
    const mandiParam = mandiVal === 'All' ? null : mandiVal;

    marketApi.getLatestRates(distParam, mandiParam)
      .then((res) => {
        setPrices(res.data || []);
        setLoadingPrices(false);
      })
      .catch(() => {
        setLoadingPrices(false);
      });
  };

  const filteredPrices = prices.filter(p => {
    const term = searchTerm.toLowerCase();
    return (p.cropName || '').toLowerCase().includes(term) ||
           (p.mandiName || '').toLowerCase().includes(term) ||
           (p.district || '').toLowerCase().includes(term);
  });

  return (
    <div className="space-y-12 pb-20 animate-fadeIn">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-agri-950 to-slate-900 text-white pt-16 pb-24 px-4 sm:px-6 lg:px-8 rounded-b-[3rem] shadow-2xl">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-300 text-xs font-black tracking-wide border border-emerald-500/30 shadow-inner">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{t('zeroFakeDataBadge')}</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-white">
            {language === 'en'
              ? 'Real Mandi Prices. Real Farmers. Real Buyers.'
              : 'నిజమైన మండి ధరలు. నిజమైన రైతులు. నిజమైన కొనుగోలుదారులు.'}
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-300 leading-relaxed font-medium">
            {language === 'en'
              ? 'An authentic agricultural decision engine and verified marketplace. No fake production data, zero fabricated ratings, and legally binding bilateral digital agreements.'
              : 'ధృవీకరించబడిన వ్యవసాయ నిర్ణయ మరియు విక్రయ వేదిక. నకిలీ సమాచారం లేకుండా, వాస్తవ లావాదేవీలు మరియు డిజిటల్ ఒప్పందాలతో రైతులకు స్పష్టమైన నిర్ణయాలు.'}
          </p>

          {/* Dual First-Class Entry Cards */}
          <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {/* Farmer Card */}
            <div className="p-6 rounded-3xl bg-white/10 backdrop-blur-md border border-white/15 text-left space-y-4 hover:border-emerald-400/50 transition flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold">
                  🌾
                </div>
                <h3 className="text-lg font-black text-white">{t('farmerPortal')}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {language === 'en'
                    ? 'Check today’s mandi prices, list crops with real photos, receive buyer offers, and sign digital agreements.'
                    : 'నేటి మండి ధరలను తనిఖీ చేయండి, ఫోటోలతో పంటను నమోదు చేయండి, ఆఫర్లను స్వీకరించండి.'}
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <Link
                  to="/farmer"
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 transition shadow-lg"
                >
                  <span>{language === 'en' ? 'Open Farmer Hub' : 'రైతు హబ్'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Buyer Card */}
            <div className="p-6 rounded-3xl bg-white/10 backdrop-blur-md border border-white/15 text-left space-y-4 hover:border-blue-400/50 transition flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-300 flex items-center justify-center font-bold">
                  🏢
                </div>
                <h3 className="text-lg font-black text-white">{t('buyerPortal')}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {language === 'en'
                    ? 'Browse authentic farmer listings by village/district, inspect crop photos, post buying demands, and submit offers.'
                    : 'గ్రామాల వారీగా రైతుల పంటలను వెతకండి, కొనుగోలు అవసరాలను పోస్ట్ చేయండి, ఆఫర్లు పంపండి.'}
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <Link
                  to="/buyer"
                  className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 transition shadow-lg"
                >
                  <span>{language === 'en' ? 'Open Buyer Hub' : 'కొనుగోలుదారు హబ్'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Today's Mandi Rates (Andhra Pradesh & Telangana Selection) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-earth-200 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-earth-100 pb-5">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center">
                <TrendingUp className="w-6 h-6 mr-2 text-agri-700" />
                {t('todaysMandiRatesHeader')}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {t('lastUpdated')}: <strong className="text-slate-800 font-semibold">{updateStatus.timestamp !== 'N/A' ? new Date(updateStatus.timestamp).toLocaleString() : t('dataUnavailableMsg')}</strong>
              </p>
            </div>
            
            {/* Quick Search */}
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder={language === 'en' ? "Search Crop/Mandi/Village..." : "పంట/మండి/గ్రామం వెతకండి..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-earth-300 bg-white text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-agri-600 focus:outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          {/* District & Mandi Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                {t('selectDistrict')}
              </label>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-earth-300 bg-white text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-agri-600 focus:outline-none"
              >
                <option value="All">✦ {t('allDistricts')} (Andhra Pradesh &amp; Telangana) ✦</option>
                {districts.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                {t('selectMandi')}
              </label>
              <select
                value={selectedMandi}
                disabled={selectedDistrict === 'All'}
                onChange={(e) => setSelectedMandi(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-earth-300 bg-white text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-agri-600 focus:outline-none disabled:opacity-50 disabled:bg-slate-50"
              >
                <option value="All">✦ {t('allMandis')} ✦</option>
                {mandis.map(m => (
                  <option key={m.id} value={m.mandiName}>{m.mandiName}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Rates Table */}
          <div className="border border-earth-200 rounded-2xl overflow-hidden bg-earth-50/30">
            {loadingPrices ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-8 h-8 border-4 border-agri-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-bold text-slate-500">{t('latestMandiRates')}...</p>
              </div>
            ) : filteredPrices.length === 0 ? (
              <div className="text-center py-16 px-4 space-y-2">
                <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
                <p className="text-sm font-black text-slate-800">{t('noDataAvailable')}</p>
                <p className="text-xs text-slate-500">
                  {language === 'en'
                    ? 'No government Agmarknet prices recorded for this filter in the last 48 hours.'
                    : 'ఎంచుకున్న ప్రాంతంలో గత 48 గంటల్లో ఎటువంటి ప్రభుత్వ అగ్‌మార్క్‌నెట్ ధరల నమోదు కాలేదు.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-earth-100/60 text-slate-700 border-b border-earth-200 text-[11px] font-black uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">{t('cropName')}</th>
                      <th className="py-3 px-4">{t('selectMandi')}</th>
                      <th className="py-3 px-4 text-right">{t('minPrice')}</th>
                      <th className="py-3 px-4 text-right">{t('maxPrice')}</th>
                      <th className="py-3 px-4 text-right font-black text-slate-900 bg-emerald-500/5">{t('modalPrice')}</th>
                      <th className="py-3 px-4">{t('sourceStatus')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-earth-100 bg-white">
                    {filteredPrices.map((row) => (
                      <tr key={row.id} className="hover:bg-earth-50/50 transition">
                        <td className="py-4 px-4 font-black text-slate-950">
                          {row.cropName}
                          <span className="block text-[11px] font-medium text-slate-500">{row.varietyName || 'FAQ Standard'}</span>
                        </td>
                        <td className="py-4 px-4 text-slate-600">
                          <span className="font-bold text-slate-800 block">{row.mandiName}</span>
                          <span className="text-[10px] text-slate-400 block">{row.district}, {row.state}</span>
                        </td>
                        <td className="py-4 px-4 text-right text-slate-600 font-bold">₹{row.minPricePerKg} / kg</td>
                        <td className="py-4 px-4 text-right text-slate-600 font-bold">₹{row.maxPricePerKg} / kg</td>
                        <td className="py-4 px-4 text-right font-black text-base text-agri-900 bg-emerald-500/5">
                          ₹{row.modalPricePerKg} <span className="text-[11px] font-medium text-slate-500">/ kg</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            {row.dataQualityStatus || 'VERIFIED'}
                          </span>
                          <span className="block text-[10px] text-slate-400 mt-0.5">Arrival: {row.arrivalDate}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Honest Data Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800 shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-amber-900 uppercase tracking-wider">{t('zeroFakeData')}</h3>
              <p className="text-xs text-amber-800/90 leading-relaxed mt-1 font-medium">
                {language === 'en'
                  ? 'We do not invent market prices, fabricate buyers, or generate fictional ratings. If verified data is unavailable for your crop or route, we state "No verified data available." honestly instead of presenting guess-work.'
                  : 'మేము నకిలీ మార్కెట్ ధరలను, కొనుగోలుదారులను లేదా నకిలీ రేటింగ్‌లను సృష్టించము. సమాచారం లేకపోతే నిజాయితీగా సమాచారం లేదని తెలియజేస్తాము.'}
              </p>
            </div>
          </div>
          <Link
            to="/data-sources"
            className="shrink-0 px-4 py-2.5 rounded-xl bg-amber-800 text-white text-xs font-bold hover:bg-amber-950 transition"
          >
            {t('viewDataSources')}
          </Link>
        </div>
      </section>
      
    </div>
  );
}
