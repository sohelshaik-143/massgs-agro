import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { recommendationApi } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import {
  Sparkles, CheckCircle2, AlertTriangle, AlertCircle, ArrowRight,
  TrendingUp, ShieldCheck, MapPin, Database, Sliders, ExternalLink, ChevronDown, ChevronUp
} from 'lucide-react';

export default function RecommendationResultsPage() {
  const { listingId } = useParams();
  const { t, language } = useLanguage();
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadRecommendation();
  }, [listingId]);

  const loadRecommendation = () => {
    setLoading(true);
    recommendationApi.getByListingId(listingId)
      .then((res) => {
        setRecommendation(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching recommendation:', err);
        setError(language === 'en' ? 'Failed to load recommendation. Please verify the listing.' : 'నివేదిక లోడ్ చేయడం విఫలమైంది. దయచేసి వివరాలను తనిఖీ చేయండి.');
        setLoading(false);
      });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="inline-block w-10 h-10 border-4 border-agri-600 border-t-transparent rounded-full animate-spin"></div>
        <h2 className="text-xl font-bold text-slate-900">{language === 'en' ? 'Calculating your best option...' : 'మీకు అత్యంత లాభదాయకమైన ఎంపికను లెక్కిస్తోంది...'}</h2>
        <p className="text-sm text-slate-500">{language === 'en' ? 'Comparing nearby APMC mandis, transport costs, and storage factors.' : 'సమీప మార్కెట్లు, రవాణా ఖర్చులు, నిల్వ సౌకర్యాలను విశ్లేషిస్తోంది.'}</p>
      </div>
    );
  }

  if (error || !recommendation) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4 bg-white rounded-3xl border border-earth-200 mt-8">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">{language === 'en' ? 'Unable to Load Recommendation' : 'నివేదిక అందుబాటులో లేదు'}</h2>
        <p className="text-sm text-slate-600">{error || (language === 'en' ? 'No recommendation found.' : 'నివేదిక వివరాలు లభించలేదు.')}</p>
        <Link to="/dashboard" className="inline-block px-5 py-2.5 rounded-xl bg-agri-800 text-white text-sm font-semibold">
          {t('backToHome')}
        </Link>
      </div>
    );
  }

  const isRecommended = recommendation.recommendationState === 'RECOMMENDED';
  const isLimited = recommendation.recommendationState === 'LIMITED_CONFIDENCE';
  const isNoData = recommendation.recommendationState === 'NO_RELIABLE_RECOMMENDATION';

  const getStatusBadge = () => {
    if (isRecommended) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
          {t('liveBadge')}
        </span>
      );
    } else if (isLimited) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
          {t('staleBadge')}
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-50 text-slate-800 border border-slate-200">
          {t('unavailableBadge')}
        </span>
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      
      {/* Top Main Result Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-earth-200 shadow-sm space-y-6">
        
        {/* Simple Summary Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-earth-100">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                {t('bestOptionLabel')}
              </span>
              {getStatusBadge()}
            </div>
            
            <h1 className="text-2xl font-black text-slate-900 mt-1">
              {isNoData ? (
                t('unavailableBadge')
              ) : (
                recommendation.recommendedOptionType === 'MANDI_SALE'
                  ? `${recommendation.recommendedMarketName} Mandi`
                  : recommendation.recommendedBuyerName
              )}
            </h1>

            {!isNoData && (
              <p className="text-xs text-slate-500 mt-1 flex items-center font-medium">
                <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 animate-bounce" />
                {recommendation.recommendedMarketDistrict || 'Direct Partner'}
              </p>
            )}
          </div>

          <div className="shrink-0 font-bold bg-earth-50 px-3.5 py-1.5 rounded-xl border border-earth-200 text-xs">
            {t('cropLabel')}: <span className="text-agri-950 font-black">{recommendation.cropName}</span> ({recommendation.quantityKg} kg)
          </div>
        </div>

        {/* Clear Final Income Estimate */}
        {!isNoData && (
          <div className="bg-emerald-500/5 rounded-2xl p-6 border border-emerald-500/20 text-center space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              {language === 'en' ? 'Estimated Earnings (Net In-Hand)' : 'మీ చేతికి వచ్చే నికర విలువ (అంచనా)'}
            </span>
            <div className="text-3xl sm:text-4xl font-black text-emerald-950">
              {recommendation.expectedNetRealization ? (
                `₹${Number(recommendation.expectedNetRealization).toLocaleString('en-IN')}`
              ) : (
                <span className="text-amber-800 text-lg">Unavailable</span>
              )}
            </div>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {language === 'en' 
                ? 'Calculated after removing transport, APMC mandi fees, and storage costs.' 
                : 'రవాణా, మండి ఫీజులు మరియు నిల్వ ఖర్చులు తీసివేసిన తర్వాత లెక్కించబడింది.'}
            </p>
          </div>
        )}

        {/* Overview cards of parameters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-earth-50 rounded-xl border border-earth-200">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">{t('cropLabel')}</span>
            <strong className="text-xs text-slate-800 block mt-0.5">{recommendation.cropName}</strong>
          </div>
          <div className="p-3 bg-earth-50 rounded-xl border border-earth-200">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">{t('quantityLabel')}</span>
            <strong className="text-xs text-slate-800 block mt-0.5">{recommendation.quantityKg} kg</strong>
          </div>
          <div className="p-3 bg-earth-50 rounded-xl border border-earth-200">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">{t('todaysPriceLabel')}</span>
            <strong className="text-xs text-slate-800 block mt-0.5">₹{recommendation.grossRevenue ? (recommendation.grossRevenue / recommendation.quantityKg).toFixed(2) : '0.00'}/kg</strong>
          </div>
          <div className="p-3 bg-earth-50 rounded-xl border border-earth-200">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">{t('sourceStatus')}</span>
            <strong className="text-xs text-slate-800 block mt-0.5 uppercase">{recommendation.recommendationState}</strong>
          </div>
        </div>

        {/* Simple Explanation ("WHY?") Section */}
        <div className="space-y-3">
          <h3 className="text-sm font-extrabold text-slate-800 flex items-center">
            <Sparkles className="w-4 h-4 mr-1 text-emerald-600" />
            {t('whyThisOption')}
          </h3>
          <div className="space-y-2">
            {recommendation.detailedReasons?.map((reason, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-earth-50/50 border border-earth-200/60 text-xs text-slate-700 leading-relaxed font-medium">
                • {reason}
              </div>
            ))}
          </div>
        </div>

        {/* Toggle Details Button */}
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="inline-flex items-center text-xs font-bold text-agri-700 hover:text-agri-800 focus:outline-none"
          >
            <span>{showDetails ? t('hideDetailsBtn') : t('detailsBtn')}</span>
            {showDetails ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
          </button>
        </div>

      </div>

      {/* Advanced Details Panel (Progressive Disclosure) */}
      {showDetails && !isNoData && (
        <div className="space-y-6 transition duration-300">
          
          {/* Cost Deductions details */}
          <div className="bg-white rounded-3xl p-6 border border-earth-200 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900">
              {language === 'en' ? 'Deduction Formula Math' : 'ధర తగ్గింపుల లెక్కలు'}
            </h3>
            <div className="bg-earth-50 rounded-2xl p-4 border border-earth-200 divide-y divide-earth-200 text-xs space-y-1">
              <div className="flex justify-between py-2.5">
                <span className="text-slate-600">{language === 'en' ? 'Gross Selling Revenue' : 'మొత్తం అమ్మకం రాబడి'}:</span>
                <span className="font-bold text-slate-950">₹{recommendation.grossRevenue ? Number(recommendation.grossRevenue).toLocaleString('en-IN') : '0.00'}</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-slate-600">{language === 'en' ? 'Handling Fee (₹0.30 / kg)' : 'నిర్వహణ రుసుము (కిలోకు ₹0.30)'}:</span>
                <span className="font-bold text-rose-800">− ₹{recommendation.estimatedHandlingCost || '0.00'}</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-slate-600">{language === 'en' ? 'APMC Mandi Cess (1%)' : 'మండి ఫీజు (1%)'}:</span>
                <span className="font-bold text-rose-800">
                  − ₹{recommendation.grossRevenue ? (recommendation.grossRevenue * 0.01).toFixed(2) : '0.00'}
                </span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-slate-600">{language === 'en' ? 'Transportation Cost' : 'రవాణా ఖర్చు'}:</span>
                <span className={`font-bold ${recommendation.transportCostAvailable ? 'text-rose-800' : 'text-amber-800'}`}>
                  {recommendation.transportCostAvailable
                    ? `− ₹${recommendation.estimatedTransportCost}`
                    : 'Quote Unavailable (Official route not found)'}
                </span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-slate-600">{language === 'en' ? 'Storage & Perishability Loss' : 'నిల్వ మరియు నాణ్యత నష్టం'}:</span>
                <span className="font-bold text-rose-800">− ₹{recommendation.estimatedPerishabilityLoss || '0.00'}</span>
              </div>
            </div>
          </div>

          {/* Verification Provenance Table */}
          {recommendation.sources?.length > 0 && (
            <div className="bg-white rounded-3xl p-6 border border-earth-200 shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center">
                <Database className="w-4 h-4 mr-2 text-agri-700" />
                {t('dataTransparency')}
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-earth-50 text-slate-600 border-b border-earth-200">
                    <tr>
                      <th className="py-2.5 px-3 font-bold">Data Source</th>
                      <th className="py-2.5 px-3 font-bold">APMC Mandi</th>
                      <th className="py-2.5 px-3 font-bold">Freshness</th>
                      <th className="py-2.5 px-3 font-bold">Timestamp</th>
                      <th className="py-2.5 px-3 font-bold">Official URL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-earth-100 text-slate-700">
                    {recommendation.sources.map((src, i) => (
                      <tr key={i}>
                        <td className="py-2.5 px-3 font-semibold text-agri-900">{src.dataSourceName}</td>
                        <td className="py-2.5 px-3">{src.mandiName}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold uppercase text-[10px]">
                            {src.dataQualityStatus}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">{new Date(src.fetchedAt).toLocaleString()}</td>
                        <td className="py-2.5 px-3">
                          {src.provenanceUrl ? (
                            <a
                              href={src.provenanceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-agri-700 hover:underline inline-flex items-center"
                            >
                              Source Link <ExternalLink className="w-3 h-3 ml-1" />
                            </a>
                          ) : (
                            <span className="text-slate-400">AGMARKNET Official feed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Return Button */}
      <div className="text-center pt-2">
        <Link to="/" className="inline-flex items-center px-6 py-3 rounded-2xl bg-agri-800 text-white text-xs font-bold hover:bg-agri-950 transition shadow-sm">
          {t('backToHome')}
        </Link>
      </div>

    </div>
  );
}
