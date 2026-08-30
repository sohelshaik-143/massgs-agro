import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { searchApi } from '../services/api';
import { Search, X, MapPin, Sprout, ShoppingBag, ArrowUpRight, HelpCircle, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function UnifiedSearchModal({ isOpen, onClose }) {
  const { t, language } = useLanguage();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return;
    }

    const timer = setTimeout(() => {
      setLoading(true);
      searchApi.unified(query.trim())
        .then((res) => {
          setResults(res.data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const handleApplySuggestion = (cropName) => {
    setQuery(cropName);
  };

  const hasAnyResults = results && (
    results.crops?.length > 0 ||
    results.locations?.length > 0 ||
    results.listings?.length > 0 ||
    results.demands?.length > 0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-24 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-earth-200 overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="p-4 sm:p-5 border-b border-earth-100 flex items-center gap-3 bg-slate-50">
          <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('unifiedSearchPlaceholder')}
            autoFocus
            className="w-full bg-transparent text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-200 transition"
          >
            Esc
          </button>
        </div>

        {/* Results Container */}
        <div className="overflow-y-auto p-5 space-y-6 flex-grow">
          {loading && (
            <div className="py-12 text-center">
              <div className="inline-block w-6 h-6 border-3 border-agri-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-500 font-semibold mt-2">Searching authentic datasets...</p>
            </div>
          )}

          {!loading && results?.suggestionPrompt && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-amber-900 text-xs font-bold">
                <HelpCircle className="w-4 h-4 text-amber-700" />
                <span>{results.suggestionPrompt}</span>
              </div>
              {results.crops?.[0] && (
                <button
                  onClick={() => handleApplySuggestion(results.crops[0].name)}
                  className="px-3 py-1 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold transition shadow-sm"
                >
                  {language === 'en' ? 'Yes, Select' : 'అవును, ఎంచుకోండి'}
                </button>
              )}
            </div>
          )}

          {!loading && query.trim() && !hasAnyResults && (
            <div className="py-12 text-center space-y-2">
              <p className="text-sm font-black text-slate-800">{t('noDataAvailable')}</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {language === 'en'
                  ? 'We strictly display verified database records and do not fabricate fake results.'
                  : 'మేము ధృవీకరించబడిన సమాచారాన్ని మాత్రమే ప్రదర్శిస్తాము, నకిలీ సమాచారాన్ని సృష్టించము.'}
              </p>
            </div>
          )}

          {/* Crops */}
          {!loading && results?.crops?.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sprout className="w-3.5 h-3.5 text-agri-600" />
                <span>{language === 'en' ? 'Verified Crops' : 'ధృవీకరించబడిన పంటలు'}</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {results.crops.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setQuery(c.name);
                    }}
                    className="p-2.5 rounded-xl border border-earth-200 bg-earth-50/50 hover:bg-earth-100 cursor-pointer transition flex items-center justify-between"
                  >
                    <div>
                      <strong className="text-xs font-black text-slate-900">{c.name}</strong>
                      {c.teluguName && (
                        <span className="block text-[10px] text-agri-800 font-bold">{c.teluguName}</span>
                      )}
                    </div>
                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-white text-slate-600 border">
                      {c.category}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Locations */}
          {!loading && results?.locations?.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-600" />
                <span>{language === 'en' ? 'Authoritative Locations (AP & Telangana)' : 'ప్రాంతాలు'}</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {results.locations.map((loc) => (
                  <div
                    key={loc.id}
                    className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 flex items-center justify-between"
                  >
                    <span>
                      <strong>{loc.village}</strong>, {loc.mandal} • {loc.district}
                    </span>
                    {loc.isApmcHub && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                        APMC
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Farmer Listings */}
          {!loading && results?.listings?.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
                <span>{language === 'en' ? 'Real Farmer Listings' : 'రైతుల పంట అమ్మకాలు'}</span>
              </h4>
              <div className="space-y-2">
                {results.listings.map((l) => (
                  <Link
                    key={l.id}
                    to={`/recommendation/${l.id}`}
                    onClick={onClose}
                    className="p-3 rounded-2xl border border-earth-200 bg-white hover:border-agri-400 hover:shadow-sm transition flex items-center justify-between gap-4 block"
                  >
                    <div className="flex items-center gap-3">
                      {l.photoUrl ? (
                        <img
                          src={l.photoUrl}
                          alt={l.cropName}
                          className="w-12 h-12 rounded-xl object-cover border"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-agri-50 text-agri-700 flex items-center justify-center font-bold text-xs">
                          {l.cropName.substring(0, 2)}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-xs font-black text-slate-900">{l.cropName}</strong>
                          <span className="text-[10px] text-slate-500 font-bold">({l.quantityKg} kg)</span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {l.farmerName} • {l.locationDistrict}, {l.locationState}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      {l.expectedPricePerUnit && (
                        <span className="text-xs font-black text-agri-800">
                          ₹{l.expectedPricePerUnit}/{l.priceUnit || 'kg'}
                        </span>
                      )}
                      <span className="block text-[10px] font-bold text-emerald-700 flex items-center justify-end gap-0.5">
                        View <ArrowUpRight className="w-3 h-3" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Buyer Demands */}
          {!loading && results?.demands?.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>{language === 'en' ? 'Active Buyer Demands' : 'కొనుగోలుదారుల అవసరాలు'}</span>
              </h4>
              <div className="space-y-2">
                {results.demands.map((d) => (
                  <div
                    key={d.id}
                    className="p-3 rounded-2xl border border-blue-100 bg-blue-50/30 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-900 font-black">{d.cropName} Demand</strong>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                          {d.minQuantityKg} - {d.maxQuantityKg} kg
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {d.organizationName} • Target: ₹{d.targetPricePerKg}/kg in {d.targetDistrict}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">
                      Valid till {d.validUntil}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
