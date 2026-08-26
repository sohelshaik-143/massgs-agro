import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sprout, ShieldCheck, ArrowRight, TrendingUp, CheckCircle2, AlertTriangle, Database, Scale, MapPin } from 'lucide-react';
import { marketApi } from '../services/api';

export default function LandingPage() {
  const [livePrices, setLivePrices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    marketApi.getPrices()
      .then((res) => {
        setLivePrices(res.data.slice(0, 4));
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching live prices:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-agri-900 to-agri-800 text-white pt-20 pb-28 px-4 sm:px-6 lg:px-8 rounded-b-3xl shadow-xl">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold tracking-wide border border-emerald-500/30">
            <ShieldCheck className="w-4 h-4" />
            <span>Zero Fake Data • AGMARKNET Verified Engine</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
            Know Where. <br className="hidden sm:block" />
            Know When. <br className="hidden sm:block" />
            <span className="text-emerald-400">Know Why.</span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-emerald-100/90 leading-relaxed">
            Turn verified market information and your crop details into a clearer selling decision.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link
              to="/produce/new"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-xl text-base font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-lg shadow-emerald-900/30 transition transform hover:-translate-y-0.5"
            >
              <Sprout className="w-5 h-5 mr-2" />
              Check My Selling Options
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>

            <Link
              to="/markets"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-4 rounded-xl text-base font-semibold bg-white/10 text-white hover:bg-white/20 border border-white/20 transition"
            >
              Explore Verified Mandis
            </Link>
          </div>

          <div className="pt-6 flex justify-center items-center space-x-6 text-xs text-emerald-200/80">
            <span className="flex items-center"><CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Deterministic Net Realization</span>
            <span className="flex items-center"><CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Transparent Provenance</span>
            <span className="flex items-center"><CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Honest Missing Data Handling</span>
          </div>
        </div>
      </section>

      {/* Honest Data Principle Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-amber-50 rounded-2xl p-6 border border-amber-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-amber-900">Our Absolute Data Rule</h3>
              <p className="text-sm text-amber-800 mt-0.5">
                We do not invent market prices, fabricate buyers, or produce random AI predictions. If verified data is unavailable for your crop or route, we state it honestly instead of presenting guess-work.
              </p>
            </div>
          </div>
          <Link
            to="/data-sources"
            className="shrink-0 px-4 py-2 rounded-lg bg-amber-800 text-white text-xs font-semibold hover:bg-amber-900 transition"
          >
            View Data Sources
          </Link>
        </div>
      </section>

      {/* Verified Market Ticker */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Live Verified Market Prices</h2>
            <p className="text-sm text-slate-600">Daily modal prices ingested directly from AGMARKNET Government of India</p>
          </div>
          <Link to="/markets" className="text-sm font-semibold text-agri-700 hover:text-agri-800 flex items-center">
            View All Mandis <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {livePrices.map((price) => (
            <div key={price.id} className="bg-white rounded-2xl p-5 border border-earth-200 shadow-sm hover:shadow-md transition">
              <div className="flex justify-between items-start mb-3">
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-agri-100 text-agri-800">
                  {price.cropName}
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {price.dataQualityStatus}
                </span>
              </div>

              <div className="space-y-1">
                <div className="text-2xl font-black text-slate-900">
                  ₹{price.modalPricePerKg} <span className="text-xs font-medium text-slate-500">/ kg</span>
                </div>
                <p className="text-xs text-slate-600 font-medium flex items-center">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  {price.mandiName} ({price.district}, {price.state})
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-earth-100 flex justify-between items-center text-[11px] text-slate-500">
                <span>Arrival: {price.arrivalDate}</span>
                <span className="font-semibold text-agri-700">{price.dataSourceName}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Decision Engine Architecture Feature */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-earth-200 shadow-sm">
          <div className="max-w-3xl mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Why Farmers Need Decision Intelligence, Not Just Another Marketplace
            </h2>
            <p className="mt-2 text-slate-600">
              Existing apps show raw prices or unverified listings. MASSGS evaluates the complete economics together:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-earth-50 border border-earth-200">
              <div className="w-10 h-10 rounded-xl bg-agri-800 text-white flex items-center justify-center mb-4">
                <Scale className="w-5 h-5 text-emerald-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Deterministic Net Realization</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                We calculate: Gross Revenue − Transport Cost − Storage − Handling Fees − APMC Cess − Perishability Risk. If transport quote is missing, we alert you instead of assuming ₹0.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-earth-50 border border-earth-200">
              <div className="w-10 h-10 rounded-xl bg-agri-800 text-white flex items-center justify-center mb-4">
                <Database className="w-5 h-5 text-emerald-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Auditable Data Provenance</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Every market price, buyer quote, and recommendation factor links directly to verified source IDs and timestamps. Zero hallucinated recommendations.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-earth-50 border border-earth-200">
              <div className="w-10 h-10 rounded-xl bg-agri-800 text-white flex items-center justify-center mb-4">
                <TrendingUp className="w-5 h-5 text-emerald-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">What-If Scenario Simulator</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Simulate custom transport pricing, storage holding days, or harvest ready dates in real time with transparent mathematical models.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
