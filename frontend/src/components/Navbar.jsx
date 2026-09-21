import React from 'react';
import { 
  Wallet, 
  Mic, 
  Eye, 
  EyeOff, 
  Sparkles, 
  RotateCcw, 
  ShieldCheck,
  TrendingUp
} from 'lucide-react';
import { formatCurrency } from '../utils';

export default function Navbar({
  overview,
  privacyMode,
  setPrivacyMode,
  openVoiceModal,
  onResetData,
  isResetting
}) {
  const safeSpend = overview?.forecasting?.safe_daily_spend_remaining ?? 0;

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-4 lg:px-8 py-3.5 transition-all">
      <div className="flex items-center justify-between gap-4">
        {/* Logo & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/20">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white">
                FinAI <span className="text-indigo-400 font-semibold text-base">Wallet Analyzer</span>
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Sparkles className="w-3 h-3" /> AI Core
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Auto-Segregation • Multi-Wallet Breakdown • Month-End Forecast
            </p>
          </div>
        </div>

        {/* Quick Actions & Status */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Daily Safe Spend Pill */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Safe Spend Today:</span>
            <span className="font-bold">
              {formatCurrency(safeSpend, privacyMode)}/day
            </span>
          </div>

          {/* Privacy Mode Toggle */}
          <button
            onClick={() => setPrivacyMode(!privacyMode)}
            title={privacyMode ? "Disable Privacy Mode" : "Enable Privacy Mode (Mask Balances)"}
            className={`p-2 rounded-lg border text-xs font-medium transition-all flex items-center gap-1.5 ${
              privacyMode
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {privacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span className="hidden lg:inline">{privacyMode ? 'Privacy: ON' : 'Privacy'}</span>
          </button>

          {/* Voice AI Action */}
          <button
            onClick={openVoiceModal}
            className="group relative flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-xs shadow-md shadow-indigo-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
            </span>
            <Mic className="w-4 h-4" />
            <span className="font-semibold">Voice Payment AI</span>
          </button>

          {/* Reset Demo Data Button */}
          <button
            onClick={onResetData}
            disabled={isResetting}
            title="Reload Demo Seed Transactions"
            className="p-2 rounded-lg border border-slate-800 bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <RotateCcw className={`w-4 h-4 ${isResetting ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
}
