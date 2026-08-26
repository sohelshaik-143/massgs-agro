import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { recommendationApi } from '../services/api';
import {
  Sparkles, CheckCircle2, AlertTriangle, AlertCircle, ArrowRight,
  TrendingUp, ShieldCheck, MapPin, Database, Sliders, ExternalLink, RefreshCw
} from 'lucide-react';

export default function RecommendationResultsPage() {
  const { listingId } = useParams();
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        setError('Failed to load recommendation. Please verify the listing ID.');
        setLoading(false);
      });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="inline-block w-10 h-10 border-4 border-agri-600 border-t-transparent rounded-full animate-spin"></div>
        <h2 className="text-xl font-bold text-slate-900">Evaluating Available Verified Options...</h2>
        <p className="text-sm text-slate-500">Querying AGMARKNET prices, calculating transport costs, handling fees, and perishability factors.</p>
      </div>
    );
  }

  if (error || !recommendation) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4 bg-white rounded-3xl border border-earth-200 mt-8">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Unable to Load Recommendation</h2>
        <p className="text-sm text-slate-600">{error || 'No recommendation found.'}</p>
        <Link to="/dashboard" className="inline-block px-5 py-2.5 rounded-xl bg-agri-800 text-white text-sm font-semibold">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const isRecommended = recommendation.recommendationState === 'RECOMMENDED';
  const isLimited = recommendation.recommendationState === 'LIMITED_CONFIDENCE';
  const isNoData = recommendation.recommendationState === 'NO_RELIABLE_RECOMMENDATION';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Banner State */}
      <div
        className={`p-6 rounded-3xl border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
          isRecommended
            ? 'bg-emerald-50/80 border-emerald-300'
            : isLimited
            ? 'bg-amber-50/80 border-amber-300'
            : 'bg-slate-100 border-slate-300'
        }`}
      >
        <div className="flex items-start space-x-3">
          <div
            className={`p-2.5 rounded-2xl shrink-0 mt-0.5 ${
              isRecommended ? 'bg-emerald-200 text-emerald-900' : isLimited ? 'bg-amber-200 text-amber-900' : 'bg-slate-300 text-slate-800'
            }`}
          >
            {isRecommended ? <CheckCircle2 className="w-6 h-6" /> : isLimited ? <AlertTriangle className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/80 text-slate-800 border">
                State: {recommendation.recommendationState}
              </span>
              <span className="text-xs font-semibold text-slate-600">
                Confidence: {recommendation.confidenceScore}%
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 mt-1">
              {isRecommended
                ? 'Strongest Verified Selling Option Found'
                : isLimited
                ? 'Recommendation Available (Limited Confidence)'
                : 'Reliable Data Currently Unavailable'}
            </h1>
            <p className="text-sm text-slate-700 mt-1">{recommendation.explanationSummary}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <Link
            to={`/simulator?listingId=${listingId}`}
            className="inline-flex items-center px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-800 text-xs font-bold hover:bg-slate-50 transition shadow-sm"
          >
            <Sliders className="w-3.5 h-3.5 mr-1.5 text-agri-700" />
            What-If Simulator
          </Link>
        </div>
      </div>

      {/* Main Net Realization vs Gross Revenue Card */}
      {!isNoData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Option Detail */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-earth-200 shadow-sm space-y-6">
            <div className="flex justify-between items-start pb-4 border-b border-earth-100">
              <div>
                <span className="text-xs font-bold uppercase text-agri-700">Recommended Channel</span>
                <h2 className="text-2xl font-extrabold text-slate-900 mt-0.5">
                  {recommendation.recommendedOptionType === 'MANDI_SALE'
                    ? `${recommendation.recommendedMarketName} APMC Mandi`
                    : recommendation.recommendedBuyerName}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  {recommendation.recommendedMarketDistrict || 'Direct Platform Partner'}
                </p>
              </div>

              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-agri-100 text-agri-800">
                {recommendation.cropName} ({recommendation.quantityKg} kg)
              </span>
            </div>

            {/* Financial Numbers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-earth-50 border border-earth-200">
                <span className="text-xs font-semibold text-slate-500">Gross Selling Revenue</span>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  ₹{recommendation.grossRevenue ? Number(recommendation.grossRevenue).toLocaleString('en-IN') : '0.00'}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">Before transport, storage & market deductions</p>
              </div>

              <div
                className={`p-4 rounded-2xl border ${
                  recommendation.expectedNetRealization
                    ? 'bg-emerald-50/80 border-emerald-300'
                    : 'bg-amber-50/80 border-amber-300'
                }`}
              >
                <span className="text-xs font-bold text-slate-700">Expected Net Realization</span>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  {recommendation.expectedNetRealization ? (
                    `₹${Number(recommendation.expectedNetRealization).toLocaleString('en-IN')}`
                  ) : (
                    <span className="text-amber-800 text-lg">Unavailable</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  {recommendation.expectedNetRealization
                    ? 'Estimated final earnings in farmer account'
                    : 'Requires verified transport quote to calculate reliably'}
                </p>
              </div>
            </div>

            {/* Cost Breakdown Table */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-800">Deterministic Cost Breakdown</h3>
              <div className="bg-earth-50 rounded-2xl p-4 border border-earth-200 divide-y divide-earth-200 text-xs">
                <div className="flex justify-between py-2">
                  <span className="text-slate-600">Handling Fee (₹0.30/kg):</span>
                  <span className="font-semibold text-slate-900">− ₹{recommendation.estimatedHandlingCost || '0.00'}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-600">APMC Mandi Cess (1%):</span>
                  <span className="font-semibold text-slate-900">
                    − ₹{recommendation.grossRevenue ? (recommendation.grossRevenue * 0.01).toFixed(2) : '0.00'}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-600">Verified Transportation Cost:</span>
                  <span className={`font-semibold ${recommendation.transportCostAvailable ? 'text-slate-900' : 'text-amber-800'}`}>
                    {recommendation.transportCostAvailable
                      ? `− ₹${recommendation.estimatedTransportCost}`
                      : 'Quote Unavailable (Not assumed ₹0)'}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-600">Storage & Perishability Loss:</span>
                  <span className="font-semibold text-slate-900">− ₹{recommendation.estimatedPerishabilityLoss || '0.00'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Explainability "WHY?" Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-earth-200 shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-agri-800">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-bold text-slate-900">Why this recommendation?</h3>
              </div>

              <div className="space-y-3">
                {recommendation.detailedReasons?.map((reason, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-earth-50 border border-earth-200 text-xs text-slate-700 leading-relaxed">
                    {reason}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-earth-100 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Provenance & Trust</span>
              <p className="text-xs text-slate-500">
                Data extracted directly from Government AGMARKNET daily feeds. Algorithm version {recommendation.algorithmVersion || 'v1.0.0'}.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Data Source Provenance Details */}
      {recommendation.sources?.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-earth-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center">
              <Database className="w-4 h-4 mr-2 text-agri-700" />
              Verified Data Provenance
            </h3>
            <span className="text-xs text-slate-500">Traceable Data Records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-earth-50 text-slate-600 border-b border-earth-200">
                <tr>
                  <th className="py-2.5 px-3 font-bold">Data Source</th>
                  <th className="py-2.5 px-3 font-bold">Mandi / Market</th>
                  <th className="py-2.5 px-3 font-bold">Quality Status</th>
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
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
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
                        <span className="text-slate-400">Official AGMARKNET Feed</span>
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
  );
}
