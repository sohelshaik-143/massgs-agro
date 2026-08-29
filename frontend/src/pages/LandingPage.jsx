import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { marketApi } from '../services/api';
import {
  Sprout, Globe, CheckCircle2, AlertTriangle, AlertCircle, ArrowRight,
  TrendingUp, MapPin, Database, Loader, Search, RefreshCw, Shield
} from 'lucide-react';

export default function LandingPage() {
  const { t, language, setLanguage } = useLanguage();
  
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
    // Fetch AP districts on load
    marketApi.getApDistricts()
      .then((res) => setDistricts(res.data))
      .catch((err) => console.error('Error fetching AP districts:', err));

    // Fetch last update status
    marketApi.getLastUpdateStatus()
      .then((res) => setUpdateStatus(res.data))
      .catch((err) => console.error('Error fetching update status:', err));

    loadLatestRates();
  }, []);

  // Reload mandis when district changes
  useEffect(() => {
    setSelectedMandi('All');
    if (selectedDistrict === 'All') {
      setMandis([]);
      loadLatestRates('All', 'All');
    } else {
      marketApi.getMandis(selectedDistrict)
        .then((res) => setMandis(res.data))
        .catch((err) => console.error('Error fetching mandis:', err));
      loadLatestRates(selectedDistrict, 'All');
    }
  }, [selectedDistrict]);

  const loadLatestRates = (distVal = selectedDistrict, mandiVal = selectedMandi) => {
    setLoadingPrices(true);
    const distParam = distVal === 'All' ? null : distVal;
    const mandiParam = mandiVal === 'All' ? null : mandiVal;

    marketApi.getLatestRates(distParam, mandiParam)
      .then((res) => {
        setPrices(res.data);
        setLoadingPrices(false);
      })
      .catch((err) => {
        console.error('Error loading latest rates:', err);
        setLoadingPrices(false);
      });
  };

  const handleMandiChange = (mandiName) => {
    setSelectedMandi(mandiName);
    loadLatestRates(selectedDistrict, mandiName);
  };

  const getStatusBadge = (row) => {
    const isStale = row.dataQualityStatus === 'STALE';
    const freshness = row.freshnessDays;

    if (isStale) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
          <AlertTriangle className="w-3 h-3 mr-1" />
          {t('staleBadge')}
        </span>
      );
    } else if (freshness === 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 mr-1 animate-pulse" />
          {t('liveBadge')}
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200">
          <Shield className="w-3 h-3 mr-1" />
          {t('verifiedBadge')}
        </span>
      );
    }
  };

  const filteredPrices = prices.filter(p => {
    const term = searchTerm.toLowerCase();
    return p.cropName.toLowerCase().includes(term) ||
           p.mandiName.toLowerCase().includes(term) ||
           p.district.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-12 pb-20">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-agri-900 to-agri-800 text-white pt-16 pb-24 px-4 sm:px-6 lg:px-8 rounded-b-[2.5rem] shadow-xl">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 text-xs font-bold tracking-wide border border-emerald-500/25">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{t('zeroFakeData')}</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
            {t('heroTitle').split('.').map((part, i) => (
              <span key={i} className="block sm:inline">
                {part}{i < 2 ? '. ' : ''}
              </span>
            ))}
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-emerald-100/90 leading-relaxed font-medium">
            {t('heroSubtitle')}
          </p>

          <div className="pt-4 flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link
              to="/produce/new"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-2xl text-base font-extrabold bg-emerald-400 text-slate-950 hover:bg-emerald-300 shadow-lg shadow-emerald-950/20 transition transform hover:-translate-y-0.5"
            >
              <Sprout className="w-5 h-5 mr-2" />
              {t('sellMyCropBtn')}
            </Link>

            <Link
              to="/markets"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-4 rounded-2xl text-base font-semibold bg-white/10 text-white hover:bg-white/20 border border-white/15 transition"
            >
              {t('exploreMandisBtn')}
            </Link>
          </div>
        </div>
      </section>

      {/* Today's Mandi Rates (Andhra Pradesh Selection) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Interactive Rates Panel */}
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
                placeholder={language === 'en' ? "Search Crop/Mandi..." : "పంట/మండి వెతకండి..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-earth-300 bg-white text-xs text-slate-800 focus:ring-2 focus:ring-agri-600 focus:outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          {/* District & Mandi Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* District Selector */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                {t('selectDistrict')}
              </label>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-earth-300 bg-white text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-agri-600 focus:outline-none"
              >
                <option value="All">✦ {t('allDistricts')} ✦</option>
                {districts.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Mandi Selector */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                {t('selectMandi')}
              </label>
              <select
                value={selectedMandi}
                disabled={selectedDistrict === 'All'}
                onChange={(e) => handleMandiChange(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-earth-300 bg-white text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-agri-600 focus:outline-none disabled:opacity-50 disabled:bg-slate-50"
              >
                <option value="All">✦ {t('allMandis')} ✦</option>
                {mandis.map(m => (
                  <option key={m.id} value={m.mandiName}>{m.mandiName}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Rates Table / List Grid */}
          <div className="border border-earth-200 rounded-2xl overflow-hidden bg-earth-50/30">
            {loadingPrices ? (
              <div className="text-center py-16 space-y-3">
                <Loader className="w-8 h-8 text-agri-700 animate-spin mx-auto" />
                <p className="text-xs font-semibold text-slate-500">{t('latestMandiRates')}...</p>
              </div>
            ) : filteredPrices.length === 0 ? (
              <div className="text-center py-16 px-4 space-y-2">
                <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
                <p className="text-sm font-bold text-slate-800">{t('noMandiData')}</p>
                <p className="text-xs text-slate-500">{t('selectDistrictMandi')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-earth-100/50 text-slate-600 border-b border-earth-200 text-[11px] font-bold uppercase tracking-wider">
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
                        <td className="py-4 px-4 font-bold text-slate-950">
                          {row.cropName}
                          <span className="block text-[11px] font-medium text-slate-500">{row.varietyName || 'FAQ'}</span>
                        </td>
                        <td className="py-4 px-4 text-slate-600">
                          <span className="font-semibold text-slate-800 block">{row.mandiName}</span>
                          <span className="text-[10px] text-slate-400 block">{row.district}, {row.state}</span>
                        </td>
                        <td className="py-4 px-4 text-right text-slate-600">₹{row.minPricePerKg} / kg</td>
                        <td className="py-4 px-4 text-right text-slate-600">₹{row.maxPricePerKg} / kg</td>
                        <td className="py-4 px-4 text-right font-black text-base text-agri-900 bg-emerald-500/5">
                          ₹{row.modalPricePerKg} <span className="text-[11px] font-medium text-slate-500">/ kg</span>
                        </td>
                        <td className="py-4 px-4">
                          {getStatusBadge(row)}
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
              <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wider">{t('absoluteDataRule')}</h3>
              <p className="text-xs text-amber-800/90 leading-relaxed mt-1">
                {t('absoluteDataRuleDesc')}
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
