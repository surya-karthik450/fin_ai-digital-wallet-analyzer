export function formatCurrency(amount, privacyMode = false, currency = '₹') {
  if (privacyMode) return `${currency} ••••`;
  if (amount === undefined || amount === null) return `${currency}0.00`;
  return `${currency}${Number(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export const APP_METADATA = {
  'Google Pay': {
    name: 'Google Pay',
    short: 'GPay',
    bg: 'bg-blue-950/40 border-blue-600/30 text-blue-400',
    badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    color: '#3b82f6',
    dot: 'bg-blue-500',
  },
  'PhonePe': {
    name: 'PhonePe',
    short: 'PhonePe',
    bg: 'bg-purple-950/40 border-purple-600/30 text-purple-400',
    badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    color: '#a855f7',
    dot: 'bg-purple-500',
  },
  'Paytm': {
    name: 'Paytm',
    short: 'Paytm',
    bg: 'bg-cyan-950/40 border-cyan-600/30 text-cyan-400',
    badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    color: '#06b6d4',
    dot: 'bg-cyan-500',
  },
  'Amazon Pay': {
    name: 'Amazon Pay',
    short: 'AmazonPay',
    bg: 'bg-amber-950/40 border-amber-600/30 text-amber-400',
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    color: '#f59e0b',
    dot: 'bg-amber-500',
  },
  'Apple Pay': {
    name: 'Apple Pay',
    short: 'ApplePay',
    bg: 'bg-slate-800/40 border-slate-600/30 text-slate-300',
    badge: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
    color: '#94a3b8',
    dot: 'bg-slate-400',
  },
  'Cred': {
    name: 'Cred',
    short: 'Cred',
    bg: 'bg-rose-950/40 border-rose-600/30 text-rose-400',
    badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    color: '#f43f5e',
    dot: 'bg-rose-500',
  },
  'BHIM UPI': {
    name: 'BHIM UPI',
    short: 'BHIM',
    bg: 'bg-emerald-950/40 border-emerald-600/30 text-emerald-400',
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    color: '#10b981',
    dot: 'bg-emerald-500',
  },
};

export function getAppMeta(appName) {
  return APP_METADATA[appName] || {
    name: appName || 'Wallet',
    short: appName || 'Wallet',
    bg: 'bg-slate-800/40 border-slate-700 text-slate-300',
    badge: 'bg-slate-700/50 text-slate-300 border-slate-600',
    color: '#64748b',
    dot: 'bg-slate-400',
  };
}

export const CATEGORY_COLORS = {
  'Food & Dining': '#f59e0b',
  'Groceries & Supermarket': '#10b981',
  'Utilities & Bills': '#3b82f6',
  'Shopping & E-Commerce': '#ec4899',
  'Travel & Commute': '#8b5cf6',
  'Entertainment & OTT': '#06b6d4',
  'Health & Fitness': '#ef4444',
  'Transfers & Personal': '#64748b',
  'Investments & Savings': '#14b8a6',
  'Miscellaneous': '#a1a1aa',
};
