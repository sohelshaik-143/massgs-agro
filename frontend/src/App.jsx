import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import FarmerDashboard from './pages/FarmerDashboard';
import ProduceEntryPage from './pages/ProduceEntryPage';
import RecommendationResultsPage from './pages/RecommendationResultsPage';
import MarketIntelligencePage from './pages/MarketIntelligencePage';
import WhatIfSimulatorPage from './pages/WhatIfSimulatorPage';
import FpoAggregationPage from './pages/FpoAggregationPage';
import DataSourcesPage from './pages/DataSourcesPage';
import AdminDataMonitorPage from './pages/AdminDataMonitorPage';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-earth-50 text-slate-900 selection:bg-emerald-200 selection:text-emerald-900">
        <Navbar />

        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<FarmerDashboard />} />
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
            <p className="font-semibold text-slate-700">
              MASSGS — Agricultural Decision & Supply Optimization Engine
            </p>
            <p>
              Built for SIH with Java 21, Spring Boot, MySQL, React &amp; Verified AGMARKNET Data. Zero Fabricated Records.
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
}
