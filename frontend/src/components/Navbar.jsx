import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sprout, BarChart3, Database, Sliders, Users, Layers, Activity, Globe, ChevronDown } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Navbar() {
  const location = useLocation();
  const { language, setLanguage, t } = useLanguage();
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);

  const primaryLinks = [
    { name: t('todaysMandiRates'), path: '/markets', icon: BarChart3 },
    { name: t('sellMyCrop'), path: '/produce/new', icon: Sprout },
    { name: t('myCrop'), path: '/dashboard', icon: Layers },
  ];

  const secondaryLinks = [
    { name: t('whatIfSimulator'), path: '/simulator', icon: Sliders },
    { name: t('fpoAggregation'), path: '/aggregation', icon: Users },
    { name: t('dataTransparency'), path: '/data-sources', icon: Database },
    { name: t('adminHealth'), path: '/admin', icon: Activity },
  ];

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'te' : 'en');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-earth-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo & Live Badge */}
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-agri-800 flex items-center justify-center text-white shadow-sm group-hover:bg-agri-700 transition">
                <Sprout className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-tight text-agri-900">{t('appTitle')}</span>
                <span className="block text-[10px] font-semibold tracking-wider text-earth-600 uppercase">{t('decisionEngine')}</span>
              </div>
            </Link>

            <div className="hidden md:flex items-center ml-4 pl-4 border-l border-earth-200">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                {t('liveDataBadge')}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-2 relative">
            {primaryLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`inline-flex items-center px-3.5 py-2 rounded-xl text-sm font-semibold transition ${
                    isActive
                      ? 'bg-agri-50 text-agri-800 border border-agri-100 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-earth-50'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-1.5 text-agri-600" />
                  {link.name}
                </Link>
              );
            })}

            {/* Dropdown for Secondary Tools */}
            <div className="relative">
              <button
                onClick={() => setShowToolsDropdown(!showToolsDropdown)}
                className="inline-flex items-center px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-earth-50 transition focus:outline-none"
              >
                <span>{t('moreTools')}</span>
                <ChevronDown className="w-4 h-4 ml-1 text-slate-400" />
              </button>

              {showToolsDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowToolsDropdown(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-earth-200 shadow-xl py-2 z-20 transition">
                    {secondaryLinks.map((link) => {
                      const Icon = link.icon;
                      const isActive = location.pathname === link.path;
                      return (
                        <Link
                          key={link.path}
                          to={link.path}
                          onClick={() => setShowToolsDropdown(false)}
                          className={`flex items-center px-4 py-2.5 text-sm font-medium transition ${
                            isActive
                              ? 'bg-earth-100 text-slate-900 font-bold'
                              : 'text-slate-600 hover:bg-earth-50 hover:text-slate-900'
                          }`}
                        >
                          <Icon className="w-4 h-4 mr-2.5 text-slate-400" />
                          {link.name}
                        </Link>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </nav>

          {/* Action Bar (Language Switcher & CTA) */}
          <div className="flex items-center space-x-3">
            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="inline-flex items-center px-3 py-2 rounded-xl border border-earth-200 bg-earth-50 text-slate-700 hover:bg-earth-100 transition text-xs font-bold space-x-1.5 focus:outline-none"
              title={t('selectLanguage')}
            >
              <Globe className="w-4 h-4 text-slate-500" />
              <span>{language === 'en' ? 'తెలుగు' : 'English'}</span>
            </button>

            <Link
              to="/produce/new"
              className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-extrabold bg-agri-800 text-white hover:bg-agri-700 shadow-sm transition"
            >
              <Sprout className="w-4 h-4 mr-1.5 text-emerald-300" />
              {t('sellMyCrop')}
            </Link>
          </div>

        </div>
      </div>
    </header>
  );
}
