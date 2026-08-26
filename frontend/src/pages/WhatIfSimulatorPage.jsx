import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { farmerApi, scenarioApi } from '../services/api';
import { Sliders, Sparkles, Scale, AlertTriangle, ArrowRight, RefreshCw, ShieldCheck } from 'lucide-react';

export default function WhatIfSimulatorPage() {
  const [searchParams] = useSearchParams();
  const initialListingId = searchParams.get('listingId');

  const [listings, setListings] = useState([]);
  const [selectedListingId, setSelectedListingId] = useState(initialListingId || '');
  const [customTransportCost, setCustomTransportCost] = useState('2.50');
  const [customStorageDays, setCustomStorageDays] = useState('0');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    farmerApi.getListings().then((res) => {
      setListings(res.data);
      if (!selectedListingId && res.data.length > 0) {
        setSelectedListingId(res.data[0].id.toString());
      }
    });
  }, []);

  const handleSimulate = async (e) => {
    if (e) e.preventDefault();
    if (!selectedListingId) return;

    setLoading(true);
    try {
      const res = await scenarioApi.simulate({
        produceListingId: parseInt(selectedListingId),
        customTransportCostPerKg: parseFloat(customTransportCost),
        customStorageDays: parseInt(customStorageDays),
      });
      setResult(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Simulation error:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedListingId) {
      handleSimulate();
    }
  }, [selectedListingId, customTransportCost, customStorageDays]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header & Disclaimer */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-earth-200 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 text-agri-700">
          <Sliders className="w-6 h-6" />
          <span className="text-xs font-bold uppercase tracking-wider">Interactive What-If Simulator</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Scenario Analysis & Net Realization Testing</h1>
        <p className="text-sm text-slate-600">
          Tweak your custom quoted transport costs, storage days, or timing to understand the mathematical impact on your final earnings.
        </p>

        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 flex items-start space-x-3 text-xs text-amber-900">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <strong>Transparent Assumption Rule:</strong> This simulator calculates outcomes using verified current base prices and your entered transport/storage values. We do NOT invent fictional future price spikes.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Simulator Controls */}
        <div className="bg-white rounded-3xl p-6 border border-earth-200 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-slate-900 pb-3 border-b border-earth-100">Scenario Parameters</h2>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Select Produce Listing
            </label>
            <select
              value={selectedListingId}
              onChange={(e) => setSelectedListingId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-earth-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-agri-600"
            >
              {listings.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.cropName} ({l.quantityKg} kg) - {l.locationDistrict}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Quoted Transport Cost (₹/kg)
              </label>
              <span className="text-xs font-black text-agri-800">₹{customTransportCost}/kg</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="10.0"
              step="0.25"
              value={customTransportCost}
              onChange={(e) => setCustomTransportCost(e.target.value)}
              className="w-full h-2 bg-earth-200 rounded-lg appearance-none cursor-pointer accent-agri-700"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>₹0.50 (Local Mandi)</span>
              <span>₹5.00 (Inter-district)</span>
              <span>₹10.00 (Metro Mandi)</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Storage / Holding Duration (Days)
              </label>
              <span className="text-xs font-black text-agri-800">{customStorageDays} Days</span>
            </div>
            <input
              type="range"
              min="0"
              max="14"
              step="1"
              value={customStorageDays}
              onChange={(e) => setCustomStorageDays(e.target.value)}
              className="w-full h-2 bg-earth-200 rounded-lg appearance-none cursor-pointer accent-agri-700"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>0 Days (Immediate)</span>
              <span>7 Days (Cold Storage)</span>
              <span>14 Days (Perishability Risk)</span>
            </div>
          </div>
        </div>

        {/* Simulation Output Card */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-earth-200 shadow-sm flex flex-col justify-between space-y-6">
          {result ? (
            <div className="space-y-6">
              <div className="flex justify-between items-start pb-4 border-b border-earth-100">
                <div>
                  <span className="text-xs font-bold uppercase text-agri-700">Simulated Outcome</span>
                  <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
                    {result.cropName} ({result.quantityKg} kg)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">{result.disclaimer}</p>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-slate-500 block">Computed Net Realization</span>
                  <div className="text-3xl font-black text-emerald-700">
                    ₹{Number(result.computedNetRealization).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Deductions Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-earth-50 border border-earth-200 text-xs space-y-2">
                  <div className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Gross Revenue</div>
                  <div className="text-xl font-bold text-slate-900">₹{Number(result.grossRevenue).toLocaleString('en-IN')}</div>
                  <div className="text-slate-500">Based on verified base market price</div>
                </div>

                <div className="p-4 rounded-2xl bg-earth-50 border border-earth-200 text-xs space-y-2">
                  <div className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Applied Transport Deductions</div>
                  <div className="text-xl font-bold text-rose-700">− ₹{Number(result.appliedTransportCost).toLocaleString('en-IN')}</div>
                  <div className="text-slate-500">At user simulated ₹{customTransportCost}/kg rate</div>
                </div>
              </div>

              <div className="bg-earth-50 rounded-2xl p-4 border border-earth-200 divide-y divide-earth-200 text-xs">
                <div className="flex justify-between py-2">
                  <span className="text-slate-600">Storage Cost (₹0.15/kg/day × {customStorageDays} days):</span>
                  <span className="font-semibold text-slate-900">− ₹{result.storageCost || '0.00'}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-600">Handling Fee (₹0.30/kg):</span>
                  <span className="font-semibold text-slate-900">− ₹{result.handlingCost || '0.00'}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-600">APMC Market Cess (1%):</span>
                  <span className="font-semibold text-slate-900">− ₹{result.apmcFee || '0.00'}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-600">Estimated Perishability Loss:</span>
                  <span className="font-semibold text-slate-900">− ₹{result.perishabilityLoss || '0.00'}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 text-sm">
              Select a produce listing to simulate scenarios.
            </div>
          )}

          <div className="pt-4 border-t border-earth-100 flex items-center justify-between text-xs text-slate-500">
            <span>Deterministic mathematical formula applied.</span>
            <span className="font-bold text-agri-800">MASSGS Decision Intelligence Engine</span>
          </div>
        </div>
      </div>
    </div>
  );
}
