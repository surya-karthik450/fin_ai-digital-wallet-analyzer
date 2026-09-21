import React, { useState, useEffect } from 'react';
import { 
  CalendarClock, 
  TrendingUp, 
  Flame, 
  ShieldCheck, 
  AlertTriangle, 
  Calculator, 
  Sliders, 
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine 
} from 'recharts';
import { api } from '../api';
import { formatCurrency } from '../utils';

export default function MonthEndCalculator({ privacyMode, onPaymentLogged }) {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [budgetInput, setBudgetInput] = useState(48000);
  const [savingsInput, setSavingsInput] = useState(12000);
  const [simulatedSpend, setSimulatedSpend] = useState(2500);
  const [simulationResult, setSimulationResult] = useState(null);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    loadForecast();
  }, []);

  async function loadForecast() {
    try {
      setLoading(true);
      const res = await api.getMonthEndForecast();
      setForecast(res);
      setBudgetInput(res.monthly_budget);
      setSavingsInput(res.savings_goal);
      runSimulation(res.monthly_budget, res.savings_goal, simulatedSpend);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function runSimulation(budget, savings, simSpend) {
    try {
      setSimulating(true);
      const res = await api.simulateForecast({
        monthly_budget: Number(budget),
        savings_goal: Number(savings),
        simulated_additional_spending: Number(simSpend),
      });
      setSimulationResult(res.simulated_impact);
    } catch (err) {
      console.error(err);
    } finally {
      setSimulating(false);
    }
  }

  const handleSimSliderChange = (e) => {
    const val = Number(e.target.value);
    setSimulatedSpend(val);
    runSimulation(budgetInput, savingsInput, val);
  };

  const handleBudgetChange = (b, s) => {
    setBudgetInput(b);
    setSavingsInput(s);
    runSimulation(b, s, simulatedSpend);
  };

  if (loading || !forecast) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const {
    month_name,
    total_days,
    days_elapsed,
    days_remaining,
    total_spent_so_far,
    daily_burn_rate,
    projected_month_end_spend,
    projected_balance,
    safe_daily_spend_remaining,
    health_status,
    status_message,
    daily_breakdown
  } = forecast;

  // Prepare chart trajectory
  let runningTotal = 0;
  const chartTrajectory = daily_breakdown.map((d) => {
    if (!d.is_future) {
      runningTotal += d.amount;
      return {
        day: d.day,
        actualSpend: runningTotal,
        projectedSpend: null,
        budgetCeiling: budgetInput,
      };
    } else {
      const proj = runningTotal + (daily_burn_rate * (d.day - days_elapsed));
      return {
        day: d.day,
        actualSpend: null,
        projectedSpend: Math.round(proj),
        budgetCeiling: budgetInput,
      };
    }
  });

  const isOverBudget = health_status === 'OVER_BUDGET';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20">
            <CalendarClock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Predictive Month-End Spend & Burn-Rate Forecaster
            </h2>
            <p className="text-sm text-slate-400">
              Calculates safe daily spend and month-end trajectory based on payments done on present and past days
            </p>
          </div>
        </div>

        <button
          onClick={loadForecast}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Recalculate</span>
        </button>
      </div>

      {/* Main Status Callout Banner */}
      <div className={`p-4 sm:p-5 rounded-2xl border ${
        isOverBudget
          ? 'bg-rose-950/30 border-rose-500/30 text-rose-200'
          : health_status === 'CAUTION'
          ? 'bg-amber-950/30 border-amber-500/30 text-amber-200'
          : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
      }`}>
        <div className="flex items-start gap-3">
          {isOverBudget ? (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold uppercase tracking-wide">
                AI Runway Analysis: {health_status.replace('_', ' ')}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-900/60 font-semibold">
                {month_name}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {status_message}
            </p>
          </div>
        </div>
      </div>

      {/* 4 Core Mathematical Calculation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cumulative Spent on Present & Past Days */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Spent So Far</p>
          <p className="text-2xl font-extrabold text-white mt-1">
            {formatCurrency(total_spent_so_far, privacyMode)}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-3 pt-2 border-t border-slate-800">
            <span>Days Elapsed:</span>
            <span className="font-semibold text-slate-200">{days_elapsed} of {total_days} days</span>
          </div>
        </div>

        {/* Daily Burn Rate */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">Current Burn Rate</p>
          <p className="text-2xl font-extrabold text-white mt-1">
            {formatCurrency(daily_burn_rate, privacyMode)}
            <span className="text-xs font-normal text-slate-400 ml-1">/ day</span>
          </p>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-3 pt-2 border-t border-slate-800">
            <span>Historical Avg:</span>
            <span className="font-semibold text-slate-200">Across present & past days</span>
          </div>
        </div>

        {/* Projected Month-End Spend */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Projected Month-End</p>
          <p className="text-2xl font-extrabold text-white mt-1">
            {formatCurrency(projected_month_end_spend, privacyMode)}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-3 pt-2 border-t border-slate-800">
            <span>Projected Balance:</span>
            <span className={`font-semibold ${projected_balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatCurrency(projected_balance, privacyMode)}
            </span>
          </div>
        </div>

        {/* Safe Daily Spend for Remaining Days */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-500/30">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Safe Daily Spend</p>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
              {days_remaining} Days Left
            </span>
          </div>
          <p className="text-2xl font-extrabold text-emerald-300 mt-1">
            {formatCurrency(safe_daily_spend_remaining, privacyMode)}
            <span className="text-xs font-normal text-slate-400 ml-1">/ day</span>
          </p>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-3 pt-2 border-t border-slate-800">
            <span>Spend Ceiling:</span>
            <span className="font-semibold text-slate-300">Remaining Runway</span>
          </div>
        </div>
      </div>

      {/* Projection Trajectory Chart vs Budget Ceiling */}
      <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">Month-End Spending Trajectory</h3>
            <p className="text-xs text-slate-400">
              Actual cumulative spending up to today (Day {days_elapsed}) and projected trajectory through Day {total_days}
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-indigo-400">
              <span className="w-3 h-0.5 bg-indigo-500 inline-block"></span> Actual Spend
            </span>
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-3 h-0.5 border-t-2 border-dashed border-amber-400 inline-block"></span> Projected Burn
            </span>
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="w-3 h-0.5 bg-rose-500 inline-block"></span> Budget Limit
            </span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartTrajectory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="day" stroke="#64748b" tickFormatter={(v) => `Day ${v}`} />
              <YAxis stroke="#64748b" tickFormatter={(v) => `₹${v >= 1000 ? (v/1000).toFixed(0) + 'k' : v}`} />
              <Tooltip 
                formatter={(val) => [formatCurrency(val, privacyMode), 'Amount']}
                labelFormatter={(lbl) => `Day ${lbl}`}
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem' }}
              />
              <ReferenceLine y={budgetInput} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Budget Limit', fill: '#ef4444', fontSize: 10 }} />
              <Line type="monotone" dataKey="actualSpend" stroke="#6366f1" strokeWidth={3} dot={{ r: 3 }} connectNulls={false} />
              <Line type="monotone" dataKey="projectedSpend" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" dot={false} connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Interactive "What-If" Expense Impact Simulator */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-950/30 via-indigo-950/40 to-slate-900 border border-indigo-500/30">
        <div className="flex items-center gap-2 mb-2">
          <Sliders className="w-5 h-5 text-indigo-400" />
          <h3 className="text-base font-bold text-white">Interactive "What-If" Spending Impact Simulator</h3>
        </div>
        <p className="text-xs text-slate-400 mb-5">
          Simulate an unplanned or upcoming expense (e.g. dinner with friends, shopping, electronics) and immediately observe the impact on your remaining daily safe spend and month-end balance.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          {/* Slider & Input */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-300">Simulate Additional Expense:</span>
              <span className="text-base font-bold text-indigo-300">
                {formatCurrency(simulatedSpend, privacyMode)}
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="15000"
              step="250"
              value={simulatedSpend}
              onChange={handleSimSliderChange}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />

            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>₹0</span>
              <span>₹5,000</span>
              <span>₹10,000</span>
              <span>₹15,000</span>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="text-xs text-slate-400 self-center">Quick Scenarios:</span>
              {[
                { label: 'Dinner ₹750', val: 750 },
                { label: 'Weekend Outing ₹2,500', val: 2500 },
                { label: 'Electronics ₹6,000', val: 6000 },
                { label: 'Emergency ₹10,000', val: 10000 },
              ].map((sc, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setSimulatedSpend(sc.val);
                    runSimulation(budgetInput, savingsInput, sc.val);
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                >
                  {sc.label}
                </button>
              ))}
            </div>
          </div>

          {/* Simulation Outcome Card */}
          {simulationResult && (
            <div className="p-4 rounded-xl bg-slate-950/80 border border-indigo-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-slate-400">Simulation Result</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  simulationResult.new_safe_daily_spend > 300 
                    ? 'bg-emerald-500/20 text-emerald-300' 
                    : 'bg-rose-500/20 text-rose-300'
                }`}>
                  {simulationResult.verdict}
                </span>
              </div>

              <div>
                <p className="text-xs text-slate-400">New Safe Daily Allowance:</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-white">
                    {formatCurrency(simulationResult.new_safe_daily_spend, privacyMode)}
                  </span>
                  <span className="text-xs text-rose-400 font-semibold">
                    (-{formatCurrency(simulationResult.daily_safe_spend_reduction, privacyMode)}/day)
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 text-xs text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>New Month-End Spend:</span>
                  <span className="font-semibold text-slate-200">
                    {formatCurrency(simulationResult.new_projected_spend, privacyMode)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Projected Savings Left:</span>
                  <span className="font-semibold text-emerald-400">
                    {formatCurrency(simulationResult.new_projected_balance, privacyMode)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Daily Input History Grid (Present & Past Days) */}
      <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <span>Daily Payment Inputs across {month_name}</span>
            </h3>
            <p className="text-xs text-slate-400">
              Aggregated payments done on present day (Day {days_elapsed}) and prior days
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-10 gap-2">
          {daily_breakdown.map((item) => {
            const isToday = item.day === days_elapsed;
            const isPast = item.day < days_elapsed;
            const hasSpend = item.amount > 0;

            return (
              <div
                key={item.day}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  isToday
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200 ring-2 ring-indigo-500/30'
                    : isPast
                    ? hasSpend
                      ? 'bg-slate-950/60 border-slate-800 text-slate-300'
                      : 'bg-slate-950/30 border-slate-800/40 text-slate-600'
                    : 'bg-slate-950/20 border-dashed border-slate-800/50 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                  <span>D{item.day}</span>
                  {isToday && <span className="text-[9px] px-1 bg-indigo-500 text-white rounded font-bold">Today</span>}
                </div>
                <p className="text-xs font-bold truncate text-white">
                  {hasSpend ? formatCurrency(item.amount, privacyMode) : '—'}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
