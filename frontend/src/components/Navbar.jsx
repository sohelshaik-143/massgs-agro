import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sprout, BarChart3, Database, ShieldCheck, Sliders, Users, Layers, Activity } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: Layers },
    { name: 'Evaluate Produce', path: '/produce/new', icon: Sprout },
    { name: 'Market Intel', path: '/markets', icon: BarChart3 },
    { name: 'What-If Simulator', path: '/simulator', icon: Sliders },
    { name: 'FPO Aggregation', path: '/aggregation', icon: Users },
    { name: 'Data Transparency', path: '/data-sources', icon: Database },
    { name: 'Admin Health', path: '/admin', icon: Activity },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-earth-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-agri-800 flex items-center justify-center text-white shadow-sm group-hover:bg-agri-700 transition">
                <Sprout className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-tight text-agri-900">MASSGS</span>
                <span className="block text-[10px] font-semibold tracking-wider text-earth-600 uppercase">Decision Engine</span>
              </div>
            </Link>

            <div className="hidden md:flex items-center ml-4 pl-4 border-l border-earth-200">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                AGMARKNET Live Data
              </span>
            </div>
          </div>

          <nav className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-agri-50 text-agri-800 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-earth-100'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-1.5 text-agri-600" />
                  {link.name}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center space-x-3">
            <Link
              to="/produce/new"
              className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold bg-agri-800 text-white hover:bg-agri-700 shadow-sm transition"
            >
              <Sprout className="w-4 h-4 mr-1.5" />
              Check Options
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
