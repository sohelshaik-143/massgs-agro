import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { farmerApi, recommendationApi } from '../services/api';
import { Sprout, Plus, Sparkles, MapPin, Calendar, ArrowRight, Layers, CheckCircle2 } from 'lucide-react';

export default function FarmerDashboard() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [evaluatingId, setEvaluatingId] = useState(null);

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = () => {
    farmerApi.getListings()
      .then((res) => {
        setListings(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching produce listings:', err);
        setLoading(false);
      });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-earth-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Your Current Produce</h1>
          <p className="text-sm text-slate-600 mt-1">
            Manage your crop listings and run verified decision intelligence to find the highest net realization.
          </p>
        </div>

        <Link
          to="/produce/new"
          className="inline-flex items-center px-5 py-2.5 rounded-xl bg-agri-800 text-white text-sm font-semibold hover:bg-agri-700 shadow-sm transition"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add New Produce
        </Link>
      </div>

      {/* Produce Listings Grid */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-earth-200">
          <div className="inline-block w-8 h-8 border-4 border-agri-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-3 text-sm text-slate-500 font-medium">Loading your produce records...</p>
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-earth-200 p-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-agri-50 text-agri-700 flex items-center justify-center mx-auto">
            <Sprout className="w-8 h-8 text-agri-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No Produce Listed Yet</h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Add your current harvest (crop, quantity, and location) or use the Voice Assistant to evaluate verified selling options.
          </p>
          <Link
            to="/produce/new"
            className="inline-flex items-center px-6 py-3 rounded-xl bg-agri-800 text-white text-sm font-semibold hover:bg-agri-700 shadow-sm transition"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add First Produce
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-6 border border-earth-200 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-agri-100 text-agri-800">
                      {item.cropName}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-1">{item.varietyName || 'Standard Variety'}</h3>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
                    Grade {item.qualityGrade || 'A'}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex items-center justify-between py-1 border-b border-earth-100">
                    <span className="text-slate-500">Available Quantity:</span>
                    <strong className="text-slate-900 font-bold">{item.quantityKg} kg</strong>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-earth-100">
                    <span className="text-slate-500 flex items-center"><MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" /> Location:</span>
                    <span className="font-medium text-slate-800">{item.locationDistrict}, {item.locationState}</span>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-500 flex items-center"><Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" /> Ready Date:</span>
                    <span className="font-medium text-slate-800">{item.readyDate}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-earth-100">
                <Link
                  to={`/recommendation/${item.id}`}
                  className="w-full py-2.5 px-4 rounded-xl bg-agri-800 text-white text-sm font-semibold hover:bg-agri-700 flex items-center justify-center space-x-2 transition shadow-sm"
                >
                  <Sparkles className="w-4 h-4 text-emerald-300" />
                  <span>Evaluate Selling Options</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
