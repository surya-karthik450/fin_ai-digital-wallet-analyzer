import React, { useState, useEffect } from 'react';
import { 
  PiggyBank, 
  Calendar, 
  Check, 
  AlertCircle, 
  CreditCard, 
  Settings, 
  Plus, 
  CheckCircle2, 
  Clock,
  Wallet
} from 'lucide-react';
import { api } from '../api';
import { formatCurrency, getAppMeta, CATEGORY_COLORS } from '../utils';

export default function BudgetsAndBills({ privacyMode, onDataChanged }) {
  const [budgets, setBudgets] = useState([]);
  const [bills, setBills] = useState([]);
  const [settings, setSettings] = useState({
    monthly_income: 65000,
    monthly_budget: 48000,
    savings_goal: 17000,
    currency: '₹',
    privacy_mode: 0,
  });
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [budgetsData, billsData, settingsData] = await Promise.all([
        api.getBudgets(),
        api.getBills(),
        api.getSettings(),
      ]);
      setBudgets(budgetsData);
      setBills(billsData);
      if (settingsData && settingsData.monthly_budget) {
        setSettings(settingsData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handlePayBill = async (billId) => {
    try {
      await api.payBill(billId);
      setSuccessMsg('Bill paid successfully and logged to wallet transactions!');
      setTimeout(() => setSuccessMsg(''), 4000);
      loadData();
      if (onDataChanged) onDataChanged();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      await api.updateSettings(settings);
      setSuccessMsg('Settings and monthly budget updated successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
      if (onDataChanged) onDataChanged();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <PiggyBank className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Budgets & Scheduled Bills</h2>
            <p className="text-sm text-slate-400">
              Manage category spending limits, track upcoming bills, and configure financial goals
            </p>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Budgets Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Monthly Category Budgets</h3>
            <span className="text-xs text-slate-400">{budgets.length} Categories Tracked</span>
          </div>

          <div className="space-y-3">
            {budgets.map((b) => {
              const isOver = b.is_exceeded;
              const isWarning = b.percentage >= 80 && !isOver;

              return (
                <div 
                  key={b.id}
                  className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-2.5 h-2.5 rounded-full" 
                        style={{ backgroundColor: CATEGORY_COLORS[b.category] || '#6366f1' }}
                      ></span>
                      <span className="font-bold text-white text-sm">{b.category}</span>
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-white">
                        {formatCurrency(b.spent, privacyMode)}
                      </span>
                      <span className="text-slate-400"> / {formatCurrency(b.monthly_limit, privacyMode)}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOver 
                          ? 'bg-rose-500' 
                          : isWarning 
                          ? 'bg-amber-500' 
                          : 'bg-indigo-500'
                      }`}
                      style={{ width: `${Math.min(100, b.percentage)}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                    <span>
                      {isOver ? (
                        <span className="text-rose-400 font-semibold">Exceeded by {formatCurrency(b.spent - b.monthly_limit, privacyMode)}</span>
                      ) : (
                        <span>Remaining: <strong className="text-slate-200">{formatCurrency(b.remaining, privacyMode)}</strong></span>
                      )}
                    </span>
                    <span className={`font-semibold ${isOver ? 'text-rose-400' : 'text-slate-400'}`}>
                      {b.percentage}% used
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Sidebar: Upcoming Bills & Profile Settings */}
        <div className="space-y-6">
          {/* Upcoming Bills Box */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <span>Upcoming Bill Reminders</span>
            </h3>

            <div className="space-y-3">
              {bills.map((bill) => {
                const appMeta = getAppMeta(bill.app);
                const isPaid = bill.status === 'paid';

                return (
                  <div 
                    key={bill.id}
                    className={`p-3 rounded-xl border text-xs transition-all ${
                      isPaid 
                        ? 'bg-slate-950/40 border-slate-800/60 opacity-60' 
                        : 'bg-slate-950/80 border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-white">{bill.title}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Due: {bill.due_date}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-white">
                          {formatCurrency(bill.amount, privacyMode)}
                        </p>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${appMeta.badge}`}>
                          {appMeta.short}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500">Auto-recurring: {bill.recurring}</span>
                      {isPaid ? (
                        <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3" /> Paid
                        </span>
                      ) : (
                        <button
                          onClick={() => handlePayBill(bill.id)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] transition-colors"
                        >
                          Pay via {bill.app}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* User Financial Target Settings */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Financial Targets & Income</span>
            </h3>

            <form onSubmit={handleSaveSettings} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Monthly Income (₹)</label>
                <input
                  type="number"
                  value={settings.monthly_income}
                  onChange={(e) => setSettings({ ...settings, monthly_income: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Monthly Budget Ceiling (₹)</label>
                <input
                  type="number"
                  value={settings.monthly_budget}
                  onChange={(e) => setSettings({ ...settings, monthly_budget: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Target Savings Goal (₹)</label>
                <input
                  type="number"
                  value={settings.savings_goal}
                  onChange={(e) => setSettings({ ...settings, savings_goal: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={savingSettings}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors"
              >
                {savingSettings ? 'Updating...' : 'Save Financial Targets'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
