import React, { useEffect, useState } from 'react';
import { adminApi } from '../services/api';
import { Database, ShieldCheck, CheckCircle2, Clock, ExternalLink, Activity, RefreshCw } from 'lucide-react';

export default function DataSourcesPage() {
  const [dataHealth, setDataHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getDataMonitoring()
      .then((res) => {
        setDataHealth(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching data sources:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-earth-200 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 text-agri-700">
          <Database className="w-6 h-6" />
          <span className="text-xs font-bold uppercase tracking-wider">Public Data Transparency Hub</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Connected Public Data Sources</h1>
        <p className="text-sm text-slate-600">
          MASSGS decision intelligence relies exclusively on authoritative, legally accessible public datasets and verified platform users.
        </p>

        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center space-x-3 text-xs text-emerald-900 font-medium">
          <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
          <span>{dataHealth?.dataIntegrityRule || 'ABSOLUTE DATA INTEGRITY: System strictly forbids fake prices, fake buyers, or unverified AI scores.'}</span>
        </div>
      </div>

      {/* Sources Grid */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-earth-200">
          <div className="inline-block w-8 h-8 border-4 border-agri-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-3 text-sm text-slate-500 font-medium">Loading data source statuses...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {dataHealth?.dataSources?.map((source) => (
            <div key={source.id} className="bg-white rounded-3xl p-6 sm:p-8 border border-earth-200 shadow-sm space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold text-agri-700 uppercase tracking-wider">Authoritative Provider</span>
                  <h3 className="text-xl font-extrabold text-slate-900 mt-1">{source.name}</h3>
                  <a
                    href={source.providerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-slate-500 hover:text-agri-700 inline-flex items-center mt-1"
                  >
                    {source.providerUrl} <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>

                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  <span className="w-2 h-2 mr-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                  {source.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-earth-50 rounded-2xl p-4 border border-earth-200">
                <div>
                  <span className="text-slate-500 block">Total Verified Records:</span>
                  <strong className="text-slate-900 text-base font-bold">{source.totalRecordCount}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Stale / Degraded:</span>
                  <strong className="text-slate-900 text-base font-bold">{source.staleRecordCount}</strong>
                </div>
                <div className="col-span-2 pt-2 border-t border-earth-200">
                  <span className="text-slate-500 block">Last Ingestion Run:</span>
                  <span className="text-slate-800 font-semibold flex items-center mt-0.5">
                    <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    {source.lastSuccessfulIngestion ? new Date(source.lastSuccessfulIngestion).toLocaleString() : 'Recent'}
                  </span>
                </div>
              </div>

              <div className="text-xs text-slate-600">
                <strong>Ingestion Strategy:</strong> REST API ingestion with automated Quintal-to-Kg normalization, deduplication, price date freshness validation (&lt; 48 hours), and quality scoring.
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
