import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  ShieldCheck, 
  Clock, 
  Layers, 
  Check, 
  X, 
  Zap,
  Info
} from 'lucide-react';
import { api } from '../api';
import { formatCurrency, getAppMeta } from '../utils';

export default function FraudDetectionView({ privacyMode, onTransactionUpdated }) {
  const [flaggedTransactions, setFlaggedTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFlagged();
  }, []);

  async function loadFlagged() {
    try {
      setLoading(true);
      const all = await api.getTransactions({ limit: 100 });
      // Filter for medium or high risk transactions
      const flagged = all.filter(t => t.risk_score >= 30);
      setFlaggedTransactions(flagged);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleDismiss = async (id) => {
    try {
      await api.updateTransaction(id, { is_dismissed: 1, status: 'completed' });
      loadFlagged();
      if (onTransactionUpdated) onTransactionUpdated();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">AI Fraud & Anomaly Detection Center</h2>
            <p className="text-sm text-slate-400">
              Heuristic and statistical model detecting off-hours spikes, duplicate charges, and suspicious digital wallet activity
            </p>
          </div>
        </div>
      </div>

      {/* Anomaly Detection Logic Explainer Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 mb-1">
            <Zap className="w-4 h-4" />
            <span>Amount Spike Detection</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Flags sudden transaction amounts exceeding category median thresholds or high volume spikes (₹10,000+).
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 mb-1">
            <Clock className="w-4 h-4" />
            <span>Off-Hours Window</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Identifies payments initiated during late-night off-hours (01:00 AM - 05:00 AM) that deviate from typical diurnal behavior.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-400 mb-1">
            <Layers className="w-4 h-4" />
            <span>Velocity & Rapid Duplicate</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Detects rapid burst payments or identical charge amounts occurring within minutes to the same merchant.
          </p>
        </div>
      </div>

      {/* Flagged Transactions List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Flagged Transactions ({flaggedTransactions.length})
          </h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12 text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
          </div>
        ) : flaggedTransactions.length === 0 ? (
          <div className="p-12 rounded-2xl border border-slate-800 bg-slate-900/40 text-center text-slate-400 space-y-2">
            <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto" />
            <p className="text-sm font-bold text-white">All Clear! No Suspicious Transactions</p>
            <p className="text-xs text-slate-500">Your digital wallet transactions are healthy and normal.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {flaggedTransactions.map((tx) => {
              const isHigh = tx.risk_level === 'HIGH';
              const appMeta = getAppMeta(tx.app);

              return (
                <div 
                  key={tx.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                    tx.is_dismissed
                      ? 'bg-slate-900/40 border-slate-800 opacity-60'
                      : isHigh
                      ? 'bg-rose-950/30 border-rose-500/40 shadow-sm'
                      : 'bg-amber-950/20 border-amber-500/30'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          isHigh ? 'bg-rose-500 text-white' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {tx.risk_level} RISK (Score: {tx.risk_score}/100)
                        </span>

                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${appMeta.badge}`}>
                          {appMeta.name}
                        </span>

                        <span className="text-xs text-slate-400">
                          {tx.date} at {tx.time}
                        </span>

                        {tx.is_dismissed === 1 && (
                          <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                            <Check className="w-3 h-3" /> Verified Safe
                          </span>
                        )}
                      </div>

                      <h4 className="text-base font-bold text-white pt-1">
                        {tx.merchant} — <span className="font-extrabold">{formatCurrency(tx.amount, privacyMode)}</span>
                      </h4>

                      {/* AI Explainable Reason */}
                      <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2">
                        <Info className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-white">AI Reason: </span>
                          <span>{tx.risk_reason || 'Anomalous amount or timing pattern.'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    {!tx.is_dismissed && (
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() => handleDismiss(tx.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition-colors"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Mark Safe / Dismiss</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
