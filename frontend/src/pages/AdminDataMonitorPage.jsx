import React, { useEffect, useState } from 'react';
import { adminApi } from '../services/api';
import { Activity, RefreshCw, ShieldCheck, Database, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

export default function AdminDataMonitorPage() {
  const [dataHealth, setDataHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDataHealth = () => {
    adminApi.getDataMonitoring()
      .then((res) => {
        setDataHealth(res.data);
        setLoading(false);
        setRefreshing(false);
      })
      .catch((err) => {
        console.error('Error fetching admin data monitoring:', err);
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    loadDataHealth();
  }, []);

  const handleTriggerIngestion = async () => {
    setRefreshing(true);
    try {
      await adminApi.triggerIngestion();
      loadDataHealth();
    } catch (err) {
      console.error('Trigger ingestion error:', err);
      setRefreshing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-earth-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 text-agri-700 mb-1">
            <Activity className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">System Administration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Data Ingestion & Integrity Monitor</h1>
          <p className="text-sm text-slate-600 mt-1">
            Monitor verified data streams, ingestion logs, and stale record metrics for SIH judge auditability.
          </p>
        </div>

        <button
          onClick={handleTriggerIngestion}
          disabled={refreshing}
          className="inline-flex items-center px-5 py-2.5 rounded-xl bg-agri-800 text-white text-sm font-semibold hover:bg-agri-700 disabled:opacity-50 transition shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Ingesting Feeds...' : 'Trigger AGMARKNET Ingestion'}</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-earth-200 shadow-sm space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Verified Prices</span>
          <div className="text-3xl font-black text-agri-900">{dataHealth?.totalVerifiedPricesCount ?? 0}</div>
          <p className="text-xs text-slate-500">Live commodity mandi arrival records</p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-earth-200 shadow-sm space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Data Sources</span>
          <div className="text-3xl font-black text-emerald-700">{dataHealth?.dataSources?.length ?? 0}</div>
          <p className="text-xs text-slate-500">AGMARKNET & Open Govt Agriculture Portal</p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-earth-200 shadow-sm space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Stale Records Flagged</span>
          <div className="text-3xl font-black text-amber-700">{dataHealth?.stalePricesCount ?? 0}</div>
          <p className="text-xs text-slate-500">&gt; 48 hours arrival latency threshold</p>
        </div>
      </div>

      {/* Ingestion Runs History Table */}
      <div className="bg-white rounded-3xl border border-earth-200 shadow-sm overflow-hidden p-6 sm:p-8 space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-earth-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Recent Data Ingestion Runs</h2>
            <p className="text-xs text-slate-500">Complete execution history of automated ingestion pipelines</p>
          </div>
          <span className="text-xs font-semibold text-agri-800 bg-agri-50 px-3 py-1 rounded-full border border-agri-200">
            Real Data Pipeline
          </span>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-agri-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-earth-50 text-slate-700 border-b border-earth-200 uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-3 px-4">Run ID</th>
                  <th className="py-3 px-4">Data Source</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Processed</th>
                  <th className="py-3 px-4 text-right">Failed</th>
                  <th className="py-3 px-4">Log Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-earth-100 text-slate-800">
                {dataHealth?.recentIngestionRuns?.map((run) => (
                  <tr key={run.id} className="hover:bg-earth-50/50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-600">#{run.id}</td>
                    <td className="py-3 px-4 font-semibold text-agri-900">{run.dataSourceName}</td>
                    <td className="py-3 px-4 text-slate-600">{new Date(run.executionTimestamp).toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                        run.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {run.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">{run.recordsProcessed}</td>
                    <td className="py-3 px-4 text-right text-slate-500">{run.recordsFailed}</td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{run.logDetails}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
