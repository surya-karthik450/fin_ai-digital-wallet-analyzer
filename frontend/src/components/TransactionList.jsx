import React, { useState, useEffect } from 'react';
import { 
  Receipt, 
  Search, 
  Filter, 
  Plus, 
  Download, 
  Trash2, 
  Sparkles, 
  ShieldAlert, 
  Tag, 
  CreditCard,
  CheckCircle2,
  X
} from 'lucide-react';
import { api } from '../api';
import { formatCurrency, getAppMeta, CATEGORY_COLORS } from '../utils';

export default function TransactionList({ 
  privacyMode, 
  preselectedApp = null, 
  onTransactionUpdated 
}) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedApp, setSelectedApp] = useState(preselectedApp || 'All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedNecessity, setSelectedNecessity] = useState('All');
  const [selectedRisk, setSelectedRisk] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Transaction Form State
  const [newTx, setNewTx] = useState({
    amount: '',
    merchant: '',
    app: 'Google Pay',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    notes: '',
  });
  const [liveAutoCat, setLiveAutoCat] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (preselectedApp) {
      setSelectedApp(preselectedApp);
    }
  }, [preselectedApp]);

  useEffect(() => {
    loadTransactions();
  }, [search, selectedApp, selectedCategory, selectedNecessity, selectedRisk]);

  async function loadTransactions() {
    try {
      setLoading(true);
      const data = await api.getTransactions({
        app: selectedApp,
        category: selectedCategory,
        necessity: selectedNecessity,
        risk_level: selectedRisk,
        search: search.trim() || undefined,
      });
      setTransactions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Live client-side preview of auto-categorization as user types
  const handleMerchantChange = (text) => {
    setNewTx((prev) => ({ ...prev, merchant: text }));
    const lower = text.toLowerCase();
    if (lower.includes('swiggy') || lower.includes('zomato') || lower.includes('pizza') || lower.includes('burger') || lower.includes('coffee')) {
      setLiveAutoCat({ category: 'Food & Dining', necessity: 'Want' });
    } else if (lower.includes('blinkit') || lower.includes('zepto') || lower.includes('grocery') || lower.includes('milk') || lower.includes('mart')) {
      setLiveAutoCat({ category: 'Groceries & Supermarket', necessity: 'Need' });
    } else if (lower.includes('electricity') || lower.includes('water') || lower.includes('wifi') || lower.includes('bill') || lower.includes('airtel') || lower.includes('jio')) {
      setLiveAutoCat({ category: 'Utilities & Bills', necessity: 'Need' });
    } else if (lower.includes('uber') || lower.includes('ola') || lower.includes('petrol') || lower.includes('fuel') || lower.includes('metro')) {
      setLiveAutoCat({ category: 'Travel & Commute', necessity: 'Need' });
    } else if (lower.includes('amazon') || lower.includes('flipkart') || lower.includes('myntra') || lower.includes('zara')) {
      setLiveAutoCat({ category: 'Shopping & E-Commerce', necessity: 'Want' });
    } else if (lower.includes('netflix') || lower.includes('spotify') || lower.includes('cinema') || lower.includes('movie')) {
      setLiveAutoCat({ category: 'Entertainment & OTT', necessity: 'Want' });
    } else if (lower.includes('rent') || lower.includes('landlord')) {
      setLiveAutoCat({ category: 'Transfers & Personal', necessity: 'Need' });
    } else if (text.trim().length > 2) {
      setLiveAutoCat({ category: 'Miscellaneous', necessity: 'Want' });
    } else {
      setLiveAutoCat(null);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newTx.amount || !newTx.merchant) return;

    try {
      setIsSaving(true);
      await api.createTransaction({
        amount: parseFloat(newTx.amount),
        merchant: newTx.merchant,
        app: newTx.app,
        date: newTx.date,
        time: newTx.time,
        notes: newTx.notes,
      });
      setIsModalOpen(false);
      setNewTx({
        amount: '',
        merchant: '',
        app: 'Google Pay',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        notes: '',
      });
      setLiveAutoCat(null);
      loadTransactions();
      if (onTransactionUpdated) onTransactionUpdated();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      try {
        await api.deleteTransaction(id);
        loadTransactions();
        if (onTransactionUpdated) onTransactionUpdated();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleExportCsv = () => {
    window.open('/api/transactions/export', '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Auto-Segregated Transactions
              </h2>
              <p className="text-sm text-slate-400">
                All digital wallet payments categorized by AI and source application
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Payment</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search merchant, item, note..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Filter by Digital Wallet App */}
          <div>
            <select
              value={selectedApp}
              onChange={(e) => setSelectedApp(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All Wallet Apps</option>
              <option value="Google Pay">Google Pay</option>
              <option value="PhonePe">PhonePe</option>
              <option value="Paytm">Paytm</option>
              <option value="Amazon Pay">Amazon Pay</option>
              <option value="Apple Pay">Apple Pay</option>
              <option value="Cred">Cred</option>
              <option value="BHIM UPI">BHIM UPI</option>
            </select>
          </div>

          {/* Filter by Category */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All Categories</option>
              <option value="Food & Dining">Food & Dining</option>
              <option value="Groceries & Supermarket">Groceries</option>
              <option value="Utilities & Bills">Utilities & Bills</option>
              <option value="Shopping & E-Commerce">Shopping</option>
              <option value="Travel & Commute">Travel & Commute</option>
              <option value="Entertainment & OTT">Entertainment</option>
              <option value="Health & Fitness">Health</option>
              <option value="Transfers & Personal">Transfers</option>
            </select>
          </div>

          {/* Filter by Necessity (Need / Want) */}
          <div>
            <select
              value={selectedNecessity}
              onChange={(e) => setSelectedNecessity(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All Types (Need/Want)</option>
              <option value="Need">Needs Only</option>
              <option value="Want">Wants Only</option>
              <option value="Investment">Investments</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-900/60 shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center p-12 text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Receipt className="w-10 h-10 mx-auto text-slate-600" />
            <p className="text-sm font-semibold text-slate-300">No transactions found</p>
            <p className="text-xs text-slate-500">Try adjusting your filters or search query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4 font-semibold">Date & Time</th>
                  <th className="py-3.5 px-4 font-semibold">Merchant / Payee</th>
                  <th className="py-3.5 px-4 font-semibold">Wallet App</th>
                  <th className="py-3.5 px-4 font-semibold">Auto-Category</th>
                  <th className="py-3.5 px-4 font-semibold">Necessity</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Amount</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Risk</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {transactions.map((tx) => {
                  const appMeta = getAppMeta(tx.app);
                  const isHighRisk = tx.risk_level === 'HIGH' && !tx.is_dismissed;
                  return (
                    <tr 
                      key={tx.id} 
                      className={`hover:bg-slate-800/30 transition-colors ${
                        isHighRisk ? 'bg-rose-950/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                        <div className="font-medium text-slate-200">{tx.date}</div>
                        <div className="text-[10px] text-slate-500">{tx.time}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span>{tx.merchant}</span>
                        </div>
                        {tx.notes && (
                          <div className="text-[10px] text-slate-400 truncate max-w-xs">{tx.notes}</div>
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${appMeta.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${appMeta.dot}`}></span>
                          {appMeta.name}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span 
                            className="w-2 h-2 rounded-full shrink-0" 
                            style={{ backgroundColor: CATEGORY_COLORS[tx.category] || '#6366f1' }}
                          ></span>
                          <span className="font-medium text-slate-200">{tx.category}</span>
                        </div>
                        {tx.subcategory && (
                          <span className="text-[10px] text-slate-500 block">{tx.subcategory}</span>
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                          tx.necessity === 'Need'
                            ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                            : tx.necessity === 'Investment'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        }`}>
                          {tx.necessity}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap font-bold text-sm text-white">
                        {formatCurrency(tx.amount, privacyMode)}
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          tx.risk_level === 'HIGH'
                            ? 'bg-rose-500 text-white animate-pulse'
                            : tx.risk_level === 'MEDIUM'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {tx.risk_level}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleDelete(tx.id)}
                          className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                          title="Delete transaction"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual "Add Payment" Modal with Live Auto-Segregation */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-400" />
                <span>Log Digital Wallet Payment</span>
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={newTx.amount}
                  onChange={(e) => setNewTx({ ...newTx, amount: e.target.value })}
                  placeholder="e.g. 450"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Merchant / Payee Name *
                </label>
                <input
                  type="text"
                  required
                  value={newTx.merchant}
                  onChange={(e) => handleMerchantChange(e.target.value)}
                  placeholder="e.g. Starbucks, Swiggy, BESCOM, Uber"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Live AI Auto-Segregation Badge */}
              {liveAutoCat && (
                <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between text-xs animate-fade-in">
                  <div className="flex items-center gap-1.5 text-indigo-300 font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Auto-Segregating to:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{liveAutoCat.category}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-600 text-white font-bold">
                      {liveAutoCat.necessity}
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Digital Wallet App
                  </label>
                  <select
                    value={newTx.app}
                    onChange={(e) => setNewTx({ ...newTx, app: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Google Pay">Google Pay</option>
                    <option value="PhonePe">PhonePe</option>
                    <option value="Paytm">Paytm</option>
                    <option value="Amazon Pay">Amazon Pay</option>
                    <option value="Apple Pay">Apple Pay</option>
                    <option value="Cred">Cred</option>
                    <option value="BHIM UPI">BHIM UPI</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    value={newTx.date}
                    onChange={(e) => setNewTx({ ...newTx, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Notes / Description (Optional)
                </label>
                <input
                  type="text"
                  value={newTx.notes}
                  onChange={(e) => setNewTx({ ...newTx, notes: e.target.value })}
                  placeholder="e.g. Dinner with team"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30"
                >
                  {isSaving ? 'Saving...' : 'Save Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
