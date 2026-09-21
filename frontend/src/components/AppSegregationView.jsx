import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  TrendingUp, 
  PieChart as PieIcon, 
  ArrowUpRight, 
  CreditCard, 
  Receipt, 
  ShoppingBag,
  Filter
} from 'lucide-react';
import { api } from '../api';
import { formatCurrency, getAppMeta, CATEGORY_COLORS } from '../utils';

export default function AppSegregationView({ privacyMode, onSelectAppFilter }) {
  const [appData, setAppData] = useState(null);
  const [selectedApp, setSelectedApp] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const res = await api.getAppSegregation();
      setAppData(res);
      if (res.apps?.length > 0 && !selectedApp) {
        setSelectedApp(res.apps[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const apps = appData?.apps || [];
  const currentApp = selectedApp || apps[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Digital Wallet App Segregation</h2>
            <p className="text-sm text-slate-400">
              Breakdown and spending behavior comparison across all your digital payment apps
            </p>
          </div>
        </div>
      </div>

      {/* App Selector Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {apps.map((app) => {
          const meta = getAppMeta(app.app_name);
          const isSelected = currentApp?.app_name === app.app_name;
          return (
            <button
              key={app.app_name}
              onClick={() => setSelectedApp(app)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border shrink-0 ${
                isSelected
                  ? `${meta.badge} ring-2 ring-indigo-500/50 shadow-md`
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${meta.dot}`}></span>
              <span>{meta.name}</span>
              <span className="text-xs px-1.5 py-0.5 rounded-md bg-slate-800/80 text-slate-300">
                {app.share_percentage}%
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected App Deep-Dive Card */}
      {currentApp && (
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6">
          {/* Top Bar for Selected App */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg border ${getAppMeta(currentApp.app_name).bg}`}>
                {getAppMeta(currentApp.app_name).short.slice(0, 2)}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  {currentApp.app_name}
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {currentApp.share_percentage}% of total wallet spend
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Top Merchant: <span className="text-slate-200 font-medium">{currentApp.top_merchant}</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => onSelectAppFilter(currentApp.app_name)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-colors self-start sm:self-auto"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>View All {currentApp.app_name} Transactions</span>
            </button>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Debits</p>
              <p className="text-2xl font-extrabold text-white mt-1">
                {formatCurrency(currentApp.total_spend, privacyMode)}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Transactions Processed</p>
              <p className="text-2xl font-extrabold text-white mt-1">
                {currentApp.transaction_count} <span className="text-sm font-normal text-slate-400">payments</span>
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Average Ticket Size</p>
              <p className="text-2xl font-extrabold text-white mt-1">
                {formatCurrency(currentApp.avg_transaction_size, privacyMode)}
              </p>
            </div>
          </div>

          {/* Category Distribution inside this App */}
          <div>
            <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-indigo-400" />
              <span>Category Segregation within {currentApp.app_name}</span>
            </h4>
            <div className="space-y-3">
              {currentApp.category_distribution?.map((cat, idx) => {
                const pct = currentApp.total_spend > 0 
                  ? Math.round((cat.amount / currentApp.total_spend) * 100) 
                  : 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-300">{cat.category}</span>
                      <span className="text-slate-400 font-semibold">
                        {formatCurrency(cat.amount, privacyMode)} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: CATEGORY_COLORS[cat.category] || '#6366f1'
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Payments under this app */}
          <div>
            <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-indigo-400" />
              <span>Recent Payments on {currentApp.app_name}</span>
            </h4>
            <div className="divide-y divide-slate-800/80 rounded-xl border border-slate-800/80 overflow-hidden bg-slate-950/40">
              {currentApp.recent_transactions?.map((tx) => (
                <div key={tx.id} className="p-3.5 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <p className="font-semibold text-white">{tx.merchant}</p>
                    <p className="text-[11px] text-slate-400">
                      {tx.date} at {tx.time} • <span className="text-indigo-400">{tx.category}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-white">
                      {formatCurrency(tx.amount, privacyMode)}
                    </p>
                    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300">
                      {tx.necessity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Multi-App Comparative Grid */}
      <div>
        <h3 className="text-lg font-bold text-white mb-3">All Digital Wallets Comparison</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {apps.map((app, idx) => {
            const meta = getAppMeta(app.app_name);
            return (
              <div 
                key={idx}
                onClick={() => setSelectedApp(app)}
                className={`p-4 rounded-xl border ${meta.bg} hover:border-indigo-500/50 cursor-pointer transition-all space-y-3`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${meta.dot}`}></span>
                    <span className="font-bold text-white">{app.app_name}</span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-900 text-slate-300 font-semibold">
                    {app.share_percentage}%
                  </span>
                </div>

                <div>
                  <p className="text-xs text-slate-400">Total Volume</p>
                  <p className="text-xl font-extrabold text-white">
                    {formatCurrency(app.total_spend, privacyMode)}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/40">
                  <span>{app.transaction_count} payments</span>
                  <span>Avg: {formatCurrency(app.avg_transaction_size, privacyMode)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
