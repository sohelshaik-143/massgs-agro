import React, { useEffect, useState } from 'react';
import { marketApi } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { BarChart3, Filter, MapPin, Calendar, Database, Shield, Search, ExternalLink, ShieldCheck } from 'lucide-react';

export default function MarketIntelligencePage() {
  const { t, language } = useLanguage();
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCrop, setSelectedCrop] = useState('All');
  const [selectedState, setSelectedState] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadPrices();
  }, [selectedCrop, selectedState]);

  const loadPrices = () => {
    setLoading(true);
    const cropParam = selectedCrop === 'All' ? null : selectedCrop;
    const stateParam = selectedState === 'All' ? null : selectedState;

    marketApi.getPrices(cropParam, stateParam)
      .then((res) => {
        setPrices(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading market prices:', err);
        setLoading(false);
      });
  };

  const filteredPrices = prices.filter((p) => {
    const matchSearch = p.mandiName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        p.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        p.cropName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-earth-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{t('liveDataBadge')}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">{t('priceComparison')}</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {language === 'en' 
                ? 'Official AGMARKNET verified price indexes across regional APMCs.' 
                : 'ప్రాంతీయ మార్కెట్ల వ్యాప్తంగా అధికారిక ధృవీకరించబడిన మార్కెట్ ధరల వివరాలు.'}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
              {language === 'en' ? 'Filter Crop' : 'పంట ఫిల్టర్'}
            </label>
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-earth-300 text-xs font-semibold bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-agri-600"
            >
              <option value="All">{language === 'en' ? 'All Crops' : 'అన్ని పంటలు'}</option>
              <option value="Tomato">Tomato / టమోటా</option>
              <option value="Onion">Onion / ఉల్లిపాయ</option>
              <option value="Chilli">Chilli / మిరపకాయ</option>
              <option value="Rice">Rice / బియ్యం</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
              {language === 'en' ? 'Filter State' : 'రాష్ట్ర ఫిల్టర్'}
            </label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-earth-300 text-xs font-semibold bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-agri-600"
            >
              <option value="All">{language === 'en' ? 'All States' : 'అన్ని రాష్ట్రాలు'}</option>
              <option value="Andhra Pradesh">Andhra Pradesh / ఆంధ్రప్రదేశ్</option>
              <option value="Telangana">Telangana / తెలంగాణ</option>
              <option value="Karnataka">Karnataka / కర్ణాటక</option>
              <option value="Delhi">Delhi / ఢిల్లీ</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
              {language === 'en' ? 'Search Mandi' : 'మండి పేరుతో వెతకండి'}
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder={language === 'en' ? "Search..." : "వెతకండి..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-earth-300 text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-agri-600"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Market Prices Table */}
      <div className="bg-white rounded-3xl border border-earth-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block w-8 h-8 border-4 border-agri-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-sm text-slate-500 font-semibold">Loading rates...</p>
          </div>
        ) : filteredPrices.length === 0 ? (
          <div className="text-center py-16 p-6 space-y-2">
            <p className="text-sm font-bold text-slate-800">{language === 'en' ? 'No prices found' : 'ధరలు లభించలేదు'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-earth-50 text-slate-700 border-b border-earth-200 text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">{t('cropName')}</th>
                  <th className="py-3.5 px-4">{t('selectMandi')}</th>
                  <th className="py-3.5 px-4">District</th>
                  <th className="py-3.5 px-4 text-right">{t('minPrice')}</th>
                  <th className="py-3.5 px-4 text-right">{t('maxPrice')}</th>
                  <th className="py-3.5 px-4 text-right font-black text-slate-900 bg-emerald-50/30">{t('modalPrice')}</th>
                  <th className="py-3.5 px-4">Arrival Date</th>
                  <th className="py-3.5 px-4">{t('sourceStatus')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-earth-100 text-slate-800 text-xs sm:text-sm">
                {filteredPrices.map((row) => (
                  <tr key={row.id} className="hover:bg-earth-50/50 transition">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-950 block">{row.cropName}</span>
                      <span className="text-xs text-slate-500">{row.varietyName || 'FAQ'}</span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-agri-900">{row.mandiName}</td>
                    <td className="py-3.5 px-4 text-slate-600">{row.district}, {row.state}</td>
                    <td className="py-3.5 px-4 text-right text-slate-600">₹{row.minPricePerKg} / kg</td>
                    <td className="py-3.5 px-4 text-right text-slate-600">₹{row.maxPricePerKg} / kg</td>
                    <td className="py-3.5 px-4 text-right font-black text-sm sm:text-base text-agri-900 bg-emerald-50/30">
                      ₹{row.modalPricePerKg} <span className="text-xs font-normal text-slate-500">/ kg</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{row.arrivalDate}</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {row.dataSourceName}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
