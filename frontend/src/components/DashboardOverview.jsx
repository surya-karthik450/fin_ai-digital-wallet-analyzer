import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Layers, 
  ShieldAlert, 
  Lightbulb, 
  Sparkles, 
  Flame,
  PieChart as PieIcon,
  BarChart3,
  CheckCircle2
} from 'lucide-react';
import { 
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend 
} from 'recharts';
import { formatCurrency, CATEGORY_COLORS, getAppMeta } from '../utils';

export default function DashboardOverview({ overview, forecast, privacyMode, setActiveTab }) {
  if (!overview) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const { 
    total_spent, 
    total_transactions, 
    avg_transaction, 
    high_risk_count, 
    category_breakdown, 
    app_breakdown, 
    daily_trend, 
    insights 
  } = overview;

  const safeSpend = forecast?.safe_daily_spend_remaining ?? 0;
  const projectedSpend = forecast?.projected_month_end_spend ?? 0;
  const daysRemaining = forecast?.days_remaining ?? 0;
  const burnRate = forecast?.daily_burn_rate ?? 0;
  const healthStatus = forecast?.health_status ?? 'ON_TRACK';

  // Status color logic
  const statusConfig = {
    ON_TRACK: { label: 'On Track', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
    CAUTION: { label: 'Caution Required', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
    OVER_BUDGET: { label: 'Over Budget Risk', bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30' },
  }[healthStatus] || { label: 'On Track', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };

  return (
    <div className="space-y-6">
      {/* Top Welcome & KPI Grid */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Financial Command Center</h2>
          <p className="text-sm text-slate-400">
            Real-time multi-wallet analysis for {overview.month_name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusConfig.bg}`}>
            {statusConfig.label}
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Spent */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 text-indigo-500/10 group-hover:text-indigo-500/20 transition-colors">
            <TrendingUp className="w-16 h-16 -mr-4 -mt-4" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Spent This Month</p>
          <p className="text-2xl font-extrabold text-white mt-1">
            {formatCurrency(total_spent, privacyMode)}
          </p>
          <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
            <span>{total_transactions} transactions</span>
            <span>•</span>
            <span>Avg: {formatCurrency(avg_transaction, privacyMode)}</span>
          </div>
        </div>

        {/* Safe Daily Spend */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-emerald-800/40 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 text-emerald-500/10 group-hover:text-emerald-500/20 transition-colors">
            <Calendar className="w-16 h-16 -mr-4 -mt-4" />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Safe Daily Limit</p>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
              {daysRemaining} Days Left
            </span>
          </div>
          <p className="text-2xl font-extrabold text-white mt-1">
            {formatCurrency(safeSpend, privacyMode)}
            <span className="text-xs font-normal text-slate-400 ml-1">/ day</span>
          </p>
          <p className="mt-3 text-xs text-emerald-400/90 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Preserves your savings target</span>
          </p>
        </div>

        {/* Projected Month-End Spend */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 text-amber-500/10 group-hover:text-amber-500/20 transition-colors">
            <Flame className="w-16 h-16 -mr-4 -mt-4" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Projected Month-End</p>
          <p className="text-2xl font-extrabold text-white mt-1">
            {formatCurrency(projectedSpend, privacyMode)}
          </p>
          <div className="flex items-center gap-1.5 mt-3 text-xs text-slate-400">
            <span>Burn rate:</span>
            <span className="font-semibold text-amber-400">{formatCurrency(burnRate, privacyMode)}/day</span>
          </div>
        </div>

        {/* Security / High Risk Card */}
        <div 
          onClick={() => setActiveTab('fraud')}
          className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-rose-500/50 shadow-sm relative overflow-hidden cursor-pointer group transition-all"
        >
          <div className="absolute top-0 right-0 p-4 text-rose-500/10 group-hover:text-rose-500/20 transition-colors">
            <ShieldAlert className="w-16 h-16 -mr-4 -mt-4" />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">AI Fraud Monitor</p>
            {high_risk_count > 0 && (
              <span className="animate-pulse px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                Alert
              </span>
            )}
          </div>
          <p className="text-2xl font-extrabold text-white mt-1">
            {high_risk_count} <span className="text-xs font-normal text-slate-400">Anomalies</span>
          </p>
          <p className="mt-3 text-xs text-rose-400 group-hover:underline flex items-center gap-1">
            <span>Review suspicious activity</span> &rarr;
          </p>
        </div>
      </div>

      {/* AI Insights & Personalized Recommendations Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900 border border-indigo-500/30">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white tracking-tight">AI Financial Insights & Recommendations</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {insights?.insights?.slice(0, 3).map((insight, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs text-slate-300 leading-relaxed flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{insight}</span>
            </div>
          ))}
        </div>

        {/* 50-30-20 Rule Progress Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800/60">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span>50-30-20 Spending Ratio:</span>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Needs: {insights?.needs_ratio}%</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Wants: {insights?.wants_ratio}%</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Investments: {insights?.investments_ratio}%</span>
            </div>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden flex">
            <div style={{ width: `${insights?.needs_ratio || 50}%` }} className="bg-blue-500 h-full"></div>
            <div style={{ width: `${insights?.wants_ratio || 30}%` }} className="bg-amber-500 h-full"></div>
            <div style={{ width: `${insights?.investments_ratio || 20}%` }} className="bg-emerald-500 h-full"></div>
          </div>
        </div>
      </div>

      {/* Visualizations Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Spending Trend Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Daily Spending Trajectory</h3>
              <p className="text-xs text-slate-400">Day-by-day wallet payments this month</p>
            </div>
            <button 
              onClick={() => setActiveTab('month-end')}
              className="text-xs text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>Forecast Sim</span> &rarr;
            </button>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={daily_trend}>
                <defs>
                  <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" tickFormatter={(v) => `Day ${v}`} />
                <YAxis stroke="#64748b" tickFormatter={(v) => `₹${v >= 1000 ? (v/1000).toFixed(0) + 'k' : v}`} />
                <Tooltip 
                  formatter={(val) => [formatCurrency(val, privacyMode), 'Spent']}
                  labelFormatter={(lbl) => `Day ${lbl} of month`}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem' }}
                />
                <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#spendGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Donut Chart */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-white">Category Distribution</h3>
              <p className="text-xs text-slate-400">AI Auto-segregated expenses</p>
            </div>
            <PieIcon className="w-4 h-4 text-slate-400" />
          </div>
          <div className="h-48 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={category_breakdown?.slice(0, 6)}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={46}
                  outerRadius={68}
                  paddingAngle={3}
                >
                  {category_breakdown?.slice(0, 6).map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={CATEGORY_COLORS[entry.category] || '#6366f1'} 
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(val) => [formatCurrency(val, privacyMode), 'Spent']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-1.5 mt-2 pt-2 border-t border-slate-800">
            {category_breakdown?.slice(0, 4).map((c, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs text-slate-300 truncate">
                <span 
                  className="w-2 h-2 rounded-full shrink-0" 
                  style={{ backgroundColor: CATEGORY_COLORS[c.category] || '#6366f1' }}
                ></span>
                <span className="truncate">{c.category} ({c.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Wallet App Segregation Bar Summary */}
      <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">Payment Share By Digital Wallet App</h3>
            <p className="text-xs text-slate-400">Google Pay, PhonePe, Paytm, Amazon Pay, etc.</p>
          </div>
          <button 
            onClick={() => setActiveTab('by-app')}
            className="text-xs text-indigo-400 hover:underline flex items-center gap-1"
          >
            <span>Detailed App Segregation Hub</span> &rarr;
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {app_breakdown?.map((appItem, idx) => {
            const meta = getAppMeta(appItem.app);
            return (
              <div 
                key={idx} 
                onClick={() => setActiveTab('by-app')}
                className={`p-3.5 rounded-xl border ${meta.bg} cursor-pointer hover:scale-[1.02] transition-transform`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold">{meta.name}</span>
                  <span className={`w-2 h-2 rounded-full ${meta.dot}`}></span>
                </div>
                <p className="text-lg font-extrabold text-white">
                  {formatCurrency(appItem.amount, privacyMode)}
                </p>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800/40">
                  <span>{appItem.count} txns</span>
                  <span className="font-semibold text-slate-300">{appItem.percentage}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
