import React, { useState, useEffect } from 'react';
import { aggregationApi } from '../services/api';
import { Users, Sprout, ShieldCheck, AlertCircle, CheckCircle2, Layers, MapPin } from 'lucide-react';

export default function FpoAggregationPage() {
  const [cropName, setCropName] = useState('Tomato');
  const [district, setDistrict] = useState('Guntur');
  const [aggregationData, setAggregationData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchAggregation = () => {
    setLoading(true);
    aggregationApi.getOpportunities(cropName, district)
      .then((res) => {
        setAggregationData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Aggregation fetch error:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAggregation();
  }, [cropName, district]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-earth-200 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 text-agri-700">
          <Users className="w-6 h-6" />
          <span className="text-xs font-bold uppercase tracking-wider">FPO & Collective Supply Pooling</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Verified Farmer Supply Aggregation</h1>
        <p className="text-sm text-slate-600">
          Pool produce supply with other verified platform farmers in your district to unlock bulk institutional buyer orders and lower transportation overheads.
        </p>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Select Crop</label>
            <select
              value={cropName}
              onChange={(e) => setCropName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-earth-300 bg-white text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-agri-600"
            >
              <option value="Tomato">Tomato</option>
              <option value="Onion">Onion</option>
              <option value="Chilli">Chilli</option>
              <option value="Rice">Rice</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">District Location</label>
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-earth-300 bg-white text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-agri-600"
            >
              <option value="Guntur">Guntur (Andhra Pradesh)</option>
              <option value="Chittoor">Chittoor (Andhra Pradesh)</option>
              <option value="Kurnool">Kurnool (Andhra Pradesh)</option>
              <option value="Kolar">Kolar (Karnataka)</option>
              <option value="Hyderabad">Hyderabad (Telangana)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Aggregation Results */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-earth-200">
          <div className="inline-block w-8 h-8 border-4 border-agri-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-3 text-sm text-slate-500 font-medium">Scanning verified platform farmer listings...</p>
        </div>
      ) : aggregationData?.status === 'NO_VERIFIED_AGGREGATION' || !aggregationData?.opportunities?.length ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-earth-200 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No Verified Aggregation Opportunity Currently Available</h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            We only form aggregation pools from genuine platform farmer supply. Currently, there are not enough registered farmer listings for {cropName} in {district} to form a bulk truckload batch.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {aggregationData.opportunities.map((group) => (
            <div key={group.id} className="bg-white rounded-3xl p-6 sm:p-8 border border-earth-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-earth-100">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                      Status: {group.status}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center">
                      <MapPin className="w-3 h-3 mr-1" /> {group.targetDistrict}
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 mt-1">
                    {group.cropName} Collective Batch ({group.farmerCount} Farmers Pooled)
                  </h2>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-500 font-medium block">Total Pooled Supply</span>
                  <span className="text-2xl font-black text-agri-900">{group.totalQuantityKg} kg</span>
                </div>
              </div>

              {/* Members Table */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
                  Contributing Platform Farmer Listings
                </h4>
                <div className="bg-earth-50 rounded-2xl p-4 border border-earth-200 divide-y divide-earth-200 text-xs">
                  {group.members?.map((m, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2.5">
                      <div className="flex items-center space-x-2">
                        <span className="w-6 h-6 rounded-full bg-agri-200 text-agri-800 font-bold flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-slate-900">{m.farmerName}</span>
                      </div>
                      <span className="font-bold text-slate-800">{m.contributedQuantityKg} kg</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center text-emerald-700 font-semibold">
                  <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-600" />
                  Eligible for Direct Institutional Buyer Quotation
                </span>
                <span className="text-slate-400">Authentic platform records only</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
