import React from 'react';
import { 
  LayoutDashboard, 
  Layers, 
  CalendarClock, 
  Mic, 
  Receipt, 
  ShieldAlert, 
  PiggyBank,
  Sparkles
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, highRiskCount = 0 }) {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'by-app', label: 'Payment By App', icon: Layers, badge: 'Key Feature' },
    { id: 'month-end', label: 'Month-End Forecaster', icon: CalendarClock, badge: 'AI Burn-Rate' },
    { id: 'voice', label: 'AI Voice Payments', icon: Mic, badge: 'Speech AI' },
    { id: 'transactions', label: 'Auto-Segregation', icon: Receipt },
    { 
      id: 'fraud', 
      label: 'Fraud & Anomalies', 
      icon: ShieldAlert, 
      alertCount: highRiskCount 
    },
    { id: 'budgets', label: 'Budgets & Bills', icon: PiggyBank },
  ];

  return (
    <aside className="w-full md:w-64 shrink-0 bg-slate-950/60 border-r border-slate-800/80 p-3 sm:p-4 flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto">
      <div className="hidden md:block px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
        Navigation
      </div>
      <nav className="flex md:flex-col gap-1.5 w-full">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all text-left whitespace-nowrap ${
                isActive
                  ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-sm shadow-indigo-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>

              <div className="flex items-center gap-1.5">
                {item.alertCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse">
                    {item.alertCount}
                  </span>
                )}
                {item.badge && (
                  <span className="hidden xl:inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                    {item.badge}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </nav>
      
      {/* Mini banner at bottom of sidebar on desktop */}
      <div className="hidden md:block mt-auto pt-4 border-t border-slate-800/60">
        <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/20">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>AI Auto-Segregator</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Every transaction is automatically tagged by category, wallet source, and necessity.
          </p>
        </div>
      </div>
    </aside>
  );
}
