import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { farmerApi } from '../services/api';
import VoiceInputModal from '../components/VoiceInputModal';
import { Sprout, Mic, Sparkles, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export default function ProduceEntryPage() {
  const navigate = useNavigate();
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    cropName: 'Tomato',
    varietyName: 'Hybrid Grade 1',
    quantityValue: '2',
    quantityUnit: 'tonne', // kg, quintal, tonne
    district: 'Guntur',
    state: 'Andhra Pradesh',
    readyDate: new Date().toISOString().split('T')[0],
    qualityGrade: 'A',
  });

  const crops = [
    { name: 'Tomato', category: 'Perishable (5-7 days)', varieties: ['Hybrid Grade 1', 'Desi Local', 'Nandi Hybrid'] },
    { name: 'Onion', category: 'Semi-Perishable (30 days)', varieties: ['Nasik Red', 'Garwa Local', 'White Onion'] },
    { name: 'Chilli', category: 'Semi-Perishable (60 days)', varieties: ['Teja Chilli', 'Guntur Sannam', 'Byadagi'] },
    { name: 'Rice', category: 'Staple (180 days)', varieties: ['BPT 5204 (Sona Masoori)', 'Swarna', 'HMT'] },
  ];

  const districts = [
    { name: 'Guntur', state: 'Andhra Pradesh' },
    { name: 'Chittoor', state: 'Andhra Pradesh' },
    { name: 'Kurnool', state: 'Andhra Pradesh' },
    { name: 'Krishna', state: 'Andhra Pradesh' },
    { name: 'Kolar', state: 'Karnataka' },
    { name: 'Hyderabad', state: 'Telangana' },
    { name: 'Khammam', state: 'Telangana' },
    { name: 'North Delhi', state: 'Delhi' },
  ];

  const handleVoiceData = (parsed) => {
    setFormData((prev) => ({
      ...prev,
      cropName: parsed.cropName || prev.cropName,
      quantityValue: parsed.quantityKg ? (parseFloat(parsed.quantityKg) / 1000).toString() : prev.quantityValue,
      quantityUnit: parsed.quantityKg ? 'tonne' : prev.quantityUnit,
      district: parsed.district || prev.district,
      state: parsed.state || prev.state,
      readyDate: parsed.readyDate || prev.readyDate,
      qualityGrade: parsed.qualityGrade || prev.qualityGrade,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Calculate standardized quantity in KG
    let quantityKg = parseFloat(formData.quantityValue);
    if (formData.quantityUnit === 'tonne') quantityKg *= 1000;
    else if (formData.quantityUnit === 'quintal') quantityKg *= 100;

    if (isNaN(quantityKg) || quantityKg <= 0) {
      setError('Please enter a valid positive quantity.');
      setLoading(false);
      return;
    }

    try {
      const res = await farmerApi.createListing({
        cropName: formData.cropName,
        varietyName: formData.varietyName,
        quantityKg: quantityKg,
        readyDate: formData.readyDate,
        district: formData.district,
        state: formData.state,
        qualityGrade: formData.qualityGrade,
      });

      // Navigate directly to recommendation results
      navigate(`/recommendation/${res.data.id}`);
    } catch (err) {
      console.error('Error creating produce listing:', err);
      setError(err.response?.data?.message || 'Failed to submit produce listing. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-earth-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-earth-100">
          <div>
            <span className="text-xs font-bold text-agri-700 tracking-wider uppercase">Step 1: Produce Details</span>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-1">Enter Your Current Crop</h1>
            <p className="text-sm text-slate-600 mt-1">
              Provide real crop information. Our decision engine will match verified AGMARKNET prices and platform buyers.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsVoiceOpen(true)}
            className="inline-flex items-center px-4 py-2.5 rounded-xl bg-emerald-50 text-agri-800 border border-emerald-300 font-semibold text-sm hover:bg-emerald-100 transition shadow-sm"
          >
            <Mic className="w-4 h-4 mr-2 text-agri-700" />
            Voice Assistant
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Crop Selector */}
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">Select Crop</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {crops.map((c) => (
                <button
                  type="button"
                  key={c.name}
                  onClick={() => setFormData({ ...formData, cropName: c.name, varietyName: c.varieties[0] })}
                  className={`p-3.5 rounded-2xl border text-left transition ${
                    formData.cropName === c.name
                      ? 'border-agri-700 bg-agri-50/70 ring-2 ring-agri-700/20'
                      : 'border-earth-200 bg-white hover:border-earth-300'
                  }`}
                >
                  <span className="block font-bold text-slate-900 text-sm">{c.name}</span>
                  <span className="block text-[11px] text-slate-500 mt-0.5">{c.category}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Variety & Grade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Crop Variety
              </label>
              <input
                type="text"
                value={formData.varietyName}
                onChange={(e) => setFormData({ ...formData, varietyName: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-earth-300 bg-white text-sm text-slate-900 focus:ring-2 focus:ring-agri-600 focus:outline-none"
                placeholder="e.g. Hybrid Grade 1"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Quality / Grade
              </label>
              <select
                value={formData.qualityGrade}
                onChange={(e) => setFormData({ ...formData, qualityGrade: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-earth-300 bg-white text-sm text-slate-900 focus:ring-2 focus:ring-agri-600 focus:outline-none"
              >
                <option value="A">Grade A (Premium / FAQ Standard)</option>
                <option value="B">Grade B (Medium Quality)</option>
                <option value="C">Grade C (Local Processing)</option>
              </select>
            </div>
          </div>

          {/* Quantity & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Quantity Available
              </label>
              <input
                type="number"
                step="0.01"
                min="0.1"
                value={formData.quantityValue}
                onChange={(e) => setFormData({ ...formData, quantityValue: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-earth-300 bg-white text-sm text-slate-900 font-semibold focus:ring-2 focus:ring-agri-600 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Unit
              </label>
              <select
                value={formData.quantityUnit}
                onChange={(e) => setFormData({ ...formData, quantityUnit: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-earth-300 bg-white text-sm text-slate-900 focus:ring-2 focus:ring-agri-600 focus:outline-none"
              >
                <option value="tonne">Tonnes (1000 kg)</option>
                <option value="quintal">Quintals (100 kg)</option>
                <option value="kg">Kilograms (kg)</option>
              </select>
            </div>
          </div>

          {/* Location & Ready Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Farmer District Location
              </label>
              <select
                value={formData.district}
                onChange={(e) => {
                  const sel = districts.find(d => d.name === e.target.value);
                  setFormData({ ...formData, district: e.target.value, state: sel ? sel.state : formData.state });
                }}
                className="w-full px-4 py-2.5 rounded-xl border border-earth-300 bg-white text-sm text-slate-900 focus:ring-2 focus:ring-agri-600 focus:outline-none"
              >
                {districts.map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name} ({d.state})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Harvest Ready Date
              </label>
              <input
                type="date"
                value={formData.readyDate}
                onChange={(e) => setFormData({ ...formData, readyDate: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-earth-300 bg-white text-sm text-slate-900 focus:ring-2 focus:ring-agri-600 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 rounded-2xl bg-agri-800 text-white font-bold text-base hover:bg-agri-700 disabled:opacity-50 shadow-md flex items-center justify-center space-x-2 transition"
            >
              {loading ? (
                <span>Running Decision Engine...</span>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-emerald-300" />
                  <span>Evaluate Verified Selling Options</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Voice Assistant Modal */}
      <VoiceInputModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onApplyParsedData={handleVoiceData}
      />
    </div>
  );
}
