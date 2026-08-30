import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import FarmerDashboard from './pages/FarmerDashboard';
import BuyerDashboard from './pages/BuyerDashboard';
import ProduceEntryPage from './pages/ProduceEntryPage';
import RecommendationResultsPage from './pages/RecommendationResultsPage';
import MarketIntelligencePage from './pages/MarketIntelligencePage';
import WhatIfSimulatorPage from './pages/WhatIfSimulatorPage';
import FpoAggregationPage from './pages/FpoAggregationPage';
import DataSourcesPage from './pages/DataSourcesPage';
import AdminDataMonitorPage from './pages/AdminDataMonitorPage';
import { AuthProvider } from './context/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-emerald-200 selection:text-emerald-900">
          <Navbar />

          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/farmer" element={<FarmerDashboard />} />
              <Route path="/dashboard" element={<FarmerDashboard />} />
              <Route path="/buyer" element={<BuyerDashboard />} />
              <Route path="/produce/new" element={<ProduceEntryPage />} />
              <Route path="/recommendation/:listingId" element={<RecommendationResultsPage />} />
              <Route path="/markets" element={<MarketIntelligencePage />} />
              <Route path="/simulator" element={<WhatIfSimulatorPage />} />
              <Route path="/aggregation" element={<FpoAggregationPage />} />
              <Route path="/data-sources" element={<DataSourcesPage />} />
              <Route path="/admin" element={<AdminDataMonitorPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <footer className="bg-white border-t border-earth-200 py-8 text-center text-xs text-slate-500">
            <div className="max-w-7xl mx-auto px-4 space-y-2">
              <p className="font-extrabold text-slate-800">
                MASSGS AGRO — Agricultural Decision &amp; Verified Supply Marketplace
              </p>
              <p className="text-slate-400">
                Java 21 • Spring Boot • React 18 • Verified AGMARKNET • Zero Fake Data Guarantee
              </p>
            </div>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}
