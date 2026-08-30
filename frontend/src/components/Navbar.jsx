import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sprout, BarChart3, Search, Globe, LogIn, LogOut, UserCheck, ShieldCheck, ChevronDown, ShoppingBag } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import UnifiedSearchModal from './UnifiedSearchModal';
import AuthModal from './AuthModal';

export default function Navbar() {
  const location = useLocation();
  const { language, setLanguage, t } = useLanguage();
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'te' : 'en');
  };

  const isFarmerActive = location.pathname.startsWith('/farmer') || location.pathname === '/dashboard' || location.pathname === '/produce/new';
  const isBuyerActive = location.pathname.startsWith('/buyer') || location.pathname === '/demand/new';
  const isMarketsActive = location.pathname.startsWith('/markets');

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-earth-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20 gap-4">
            
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <Link to="/" className="flex items-center space-x-3 group">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-agri-800 flex items-center justify-center text-white shadow-md group-hover:bg-agri-700 transition">
                  <Sprout className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <span className="text-xl font-black tracking-tight text-slate-900 block leading-tight">
                    {t('appTitle')}
                  </span>
                  <span className="block text-[10px] font-bold tracking-wider text-agri-800 uppercase">
                    {t('appTagline')}
                  </span>
                </div>
              </Link>
            </div>

            {/* Portal Switcher & Main Nav */}
            <nav className="hidden md:flex items-center p-1 bg-slate-100/80 rounded-2xl border border-slate-200/80">
              <Link
                to="/farmer"
                className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
                  isFarmerActive
                    ? 'bg-white text-agri-900 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🌾 {t('farmerPortal')}
              </Link>

              <Link
                to="/buyer"
                className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
                  isBuyerActive
                    ? 'bg-white text-agri-900 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🏢 {t('buyerPortal')}
              </Link>

              <Link
                to="/markets"
                className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
                  isMarketsActive
                    ? 'bg-white text-agri-900 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-agri-600" />
                {t('marketIntelligence')}
              </Link>
            </nav>

            {/* Global Search Bar Trigger & Action Elements */}
            <div className="flex items-center space-x-2.5">
              {/* Universal Search Button */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-earth-200 bg-earth-50/70 hover:bg-earth-100 text-slate-500 hover:text-slate-800 text-xs font-semibold transition"
                title="Search crops, locations, listings, demands"
              >
                <Search className="w-4 h-4 text-slate-400" />
                <span className="hidden xl:inline">{t('searchBtn')}...</span>
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-white text-[10px] font-bold text-slate-400 border">
                  ⌘K
                </kbd>
              </button>

              {/* Language Switcher */}
              <button
                onClick={toggleLanguage}
                className="inline-flex items-center px-3 py-2 rounded-xl border border-earth-200 bg-white hover:bg-earth-50 text-slate-700 transition text-xs font-black space-x-1.5 shadow-sm"
              >
                <Globe className="w-3.5 h-3.5 text-agri-700" />
                <span>{language === 'en' ? 'తెలుగు' : 'English'}</span>
              </button>

              {/* Auth / Profile Area */}
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-agri-50 border border-agri-200 text-agri-900 text-xs font-black shadow-sm hover:bg-agri-100 transition"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span className="font-mono">{user?.massgsId || 'MASSGS ID'}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {showUserMenu && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                      <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-earth-200 shadow-xl py-3 z-20 transition text-xs">
                        <div className="px-4 py-2 border-b border-earth-100 mb-1">
                          <p className="font-black text-slate-900 text-sm">{user?.fullName}</p>
                          <p className="text-[11px] font-mono text-agri-800 font-bold">{user?.massgsId}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {user?.role === 'ROLE_BUYER' ? 'Verified Buyer' : 'Verified Farmer'} • {user?.district || 'Andhra Pradesh'}
                          </p>
                        </div>

                        <Link
                          to={user?.role === 'ROLE_BUYER' ? '/buyer' : '/farmer'}
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center px-4 py-2.5 text-slate-700 hover:bg-earth-50 font-bold"
                        >
                          {user?.role === 'ROLE_BUYER' ? '🏢 Buyer Dashboard' : '🌾 Farmer Dashboard'}
                        </Link>

                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            logout();
                          }}
                          className="w-full text-left flex items-center px-4 py-2.5 text-red-600 hover:bg-red-50 font-bold border-t border-earth-100 mt-1"
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          {t('logoutBtn')}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => openAuthModal('ROLE_FARMER')}
                  className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-black bg-agri-800 text-white hover:bg-agri-700 shadow-sm transition gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5 text-emerald-300" />
                  <span>{t('loginBtn')}</span>
                </button>
              )}

            </div>
          </div>
        </div>
      </header>

      {/* Unified Search Modal */}
      <UnifiedSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* OTP Auth Modal */}
      <AuthModal />
    </>
  );
}
