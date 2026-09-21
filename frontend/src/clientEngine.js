// In-Browser Fallback Engine for GitHub Pages / Static Hosting
// Allows the complete application to work 100% interactively without a live Python backend

const STORAGE_KEY_TX = 'finai_transactions';
const STORAGE_KEY_BUDGETS = 'finai_budgets';
const STORAGE_KEY_BILLS = 'finai_bills';
const STORAGE_KEY_SETTINGS = 'finai_settings';

const CATEGORY_RULES = {
  'Food & Dining': ['swiggy', 'zomato', 'mcdonald', 'starbucks', 'domino', 'kfc', 'burger', 'pizza', 'cafe', 'restaurant', 'subway', 'coffee', 'chai', 'biryani'],
  'Groceries & Supermarket': ['blinkit', 'zepto', 'instamart', 'bigbasket', 'dmart', 'grocery', 'kirana', 'milk', 'dairy', 'nature basket'],
  'Utilities & Bills': ['electricity', 'bescom', 'water', 'gas', 'cylinder', 'wifi', 'broadband', 'airtel', 'jio', 'recharge', 'bill', 'tata play'],
  'Shopping & E-Commerce': ['amazon', 'flipkart', 'myntra', 'meesho', 'nykaa', 'ajio', 'zara', 'h&m', 'electronics', 'croma'],
  'Travel & Commute': ['uber', 'ola', 'rapido', 'irctc', 'metro', 'bus', 'petrol', 'fuel', 'hpcl', 'shell', 'fastag'],
  'Entertainment & OTT': ['netflix', 'prime video', 'hotstar', 'spotify', 'youtube', 'bookmyshow', 'pvr', 'cinema'],
  'Health & Fitness': ['pharmacy', 'apollo', 'medplus', '1mg', 'doctor', 'clinic', 'gym', 'cult.fit', 'fitness'],
  'Transfers & Personal': ['transfer', 'rent', 'landlord', 'roommate', 'friend', 'sent to'],
  'Investments & Savings': ['zerodha', 'groww', 'mutual fund', 'sip', 'crypto', 'gold', 'deposit']
};

export function clientAutoSegregate(merchant, notes = '', amount = 0) {
  const combined = `${merchant} ${notes}`.toLowerCase();
  for (const [cat, kws] of Object.entries(CATEGORY_RULES)) {
    for (const kw of kws) {
      if (combined.includes(kw)) {
        let subcat = 'General';
        let nec = ['Food & Dining', 'Shopping & E-Commerce', 'Entertainment & OTT'].includes(cat) ? 'Want' : 'Need';
        if (cat === 'Investments & Savings') nec = 'Investment';
        if (combined.includes('rent')) subcat = 'House Rent';
        return { category: cat, subcategory: subcat, necessity: nec };
      }
    }
  }
  return {
    category: amount > 15000 ? 'Transfers & Personal' : 'Miscellaneous',
    subcategory: 'General Expense',
    necessity: amount > 15000 ? 'Need' : 'Want'
  };
}

export function clientEvaluateRisk(amount, merchant, timeStr, category) {
  let score = 0;
  const reasons = [];

  if (amount >= 25000) {
    score += 45;
    reasons.append?.(f`High-value spike of ₹${amount} requires verification`) || reasons.push(`High-value spike of ₹${amount}`);
  } else if (amount >= 10000) {
    score += 20;
    reasons.push(`Substantial transaction amount (₹${amount})`);
  }

  const hour = parseInt((timeStr || '12').split(':')[0], 10);
  if (hour >= 1 && hour <= 4) {
    score += 35;
    reasons.push(`Off-hours transaction recorded at ${timeStr} (unusual active window)`);
  }

  const mLower = merchant.toLowerCase();
  for (const word of ['crypto', 'casino', 'betting', 'overseas', 'unknown']) {
    if (mLower.includes(word)) {
      score += 50;
      reasons.push(`Flagged merchant keyword detected: '${word}'`);
      break;
    }
  }

  score = Math.min(100, score);
  const level = score >= 60 ? 'HIGH' : score >= 30 ? 'MEDIUM' : 'LOW';
  return {
    risk_score: score,
    risk_level: level,
    risk_reason: reasons.length ? reasons.join(' • ') : 'Normal transaction pattern'
  };
}

export function initClientStorage() {
  if (!localStorage.getItem(STORAGE_KEY_SETTINGS)) {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify({
      monthly_income: 65000,
      monthly_budget: 48000,
      savings_goal: 17000,
      currency: '₹',
      privacy_mode: 0
    }));
  }

  if (!localStorage.getItem(STORAGE_KEY_BUDGETS)) {
    localStorage.setItem(STORAGE_KEY_BUDGETS, JSON.stringify([
      { id: 1, category: 'Food & Dining', monthly_limit: 9000, icon: 'utensils', color: '#f59e0b' },
      { id: 2, category: 'Groceries & Supermarket', monthly_limit: 7500, icon: 'shopping-bag', color: '#10b981' },
      { id: 3, category: 'Utilities & Bills', monthly_limit: 6000, icon: 'zap', color: '#3b82f6' },
      { id: 4, category: 'Shopping & E-Commerce', monthly_limit: 7000, icon: 'shopping-cart', color: '#ec4899' },
      { id: 5, category: 'Travel & Commute', monthly_limit: 5000, icon: 'car', color: '#8b5cf6' },
      { id: 6, category: 'Entertainment & OTT', monthly_limit: 2500, icon: 'tv', color: '#06b6d4' }
    ]));
  }

  if (!localStorage.getItem(STORAGE_KEY_BILLS)) {
    const today = new Date();
    const d5 = new Date(today.getTime() + 5 * 86400000).toISOString().split('T')[0];
    const d10 = new Date(today.getTime() + 10 * 86400000).toISOString().split('T')[0];
    localStorage.setItem(STORAGE_KEY_BILLS, JSON.stringify([
      { id: 1, title: 'BESCOM Electricity', amount: 1950, due_date: d5, category: 'Utilities & Bills', app: 'PhonePe', status: 'unpaid', recurring: 'monthly' },
      { id: 2, title: 'Airtel Fiber Broadband', amount: 1179, due_date: d10, category: 'Utilities & Bills', app: 'Google Pay', status: 'unpaid', recurring: 'monthly' }
    ]));
  }

  if (!localStorage.getItem(STORAGE_KEY_TX)) {
    resetClientSeedData();
  }
}

export function resetClientSeedData() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = now.getDate();

  const seed = [
    { id: 1, amount: 18000, merchant: 'Landlord Apartment Rent', category: 'Transfers & Personal', subcategory: 'House Rent', app: 'Google Pay', date: `${year}-${month}-01`, time: '10:00', type: 'debit', status: 'completed', necessity: 'Need', risk_score: 0, risk_level: 'LOW', risk_reason: 'Routine rent payment', is_dismissed: 0, notes: 'Monthly apartment rent' },
    { id: 2, amount: 450, merchant: "Domino's Pizza", category: 'Food & Dining', subcategory: 'Dining Out', app: 'Paytm', date: `${year}-${month}-02`, time: '20:15', type: 'debit', status: 'completed', necessity: 'Want', risk_score: 0, risk_level: 'LOW', risk_reason: 'Normal transaction pattern', is_dismissed: 0, notes: 'Dinner with friends' },
    { id: 3, amount: 1450, merchant: 'Swiggy Gourmet', category: 'Food & Dining', subcategory: 'Dining Out', app: 'Google Pay', date: `${year}-${month}-03`, time: '13:30', type: 'debit', status: 'completed', necessity: 'Want', risk_score: 0, risk_level: 'LOW', risk_reason: 'Normal transaction pattern', is_dismissed: 0, notes: 'Lunch order' },
    { id: 4, amount: 2150, merchant: 'BESCOM Electricity Board', category: 'Utilities & Bills', subcategory: 'Utility Bill', app: 'PhonePe', date: `${year}-${month}-04`, time: '14:10', type: 'debit', status: 'completed', necessity: 'Need', risk_score: 0, risk_level: 'LOW', risk_reason: 'Normal transaction pattern', is_dismissed: 0, notes: 'Power bill' },
    { id: 5, amount: 350, merchant: 'Starbucks Coffee', category: 'Food & Dining', subcategory: 'Beverages & Snacks', app: 'Google Pay', date: `${year}-${month}-05`, time: '16:00', type: 'debit', status: 'completed', necessity: 'Want', risk_score: 0, risk_level: 'LOW', risk_reason: 'Normal transaction pattern', is_dismissed: 0, notes: 'Afternoon coffee' },
    { id: 6, amount: 1200, merchant: 'Blinkit Quick Commerce', category: 'Groceries & Supermarket', subcategory: 'Household Provisions', app: 'PhonePe', date: `${year}-${month}-06`, time: '11:15', type: 'debit', status: 'completed', necessity: 'Need', risk_score: 0, risk_level: 'LOW', risk_reason: 'Normal transaction pattern', is_dismissed: 0, notes: 'Weekly groceries' },
    { id: 7, amount: 36500, merchant: 'CryptoEx Oversea Trade', category: 'Investments & Savings', subcategory: 'Wealth Accumulation', app: 'Paytm', date: `${year}-${month}-07`, time: '03:42', type: 'debit', status: 'flagged', necessity: 'Want', risk_score: 85, risk_level: 'HIGH', risk_reason: "High-value spike of ₹36,500 • Off-hours transaction recorded at 03:42 • Flagged merchant keyword: 'crypto'", is_dismissed: 0, notes: 'Unrecognized foreign crypto wallet debit' },
    { id: 8, amount: 480, merchant: 'Uber Premier', category: 'Travel & Commute', subcategory: 'Daily Commute', app: 'Google Pay', date: `${year}-${month}-08`, time: '08:45', type: 'debit', status: 'completed', necessity: 'Need', risk_score: 0, risk_level: 'LOW', risk_reason: 'Normal transaction pattern', is_dismissed: 0, notes: 'Cab to office' },
    { id: 9, amount: 499, merchant: 'Netflix Monthly Standard', category: 'Entertainment & OTT', subcategory: 'Digital Subscriptions', app: 'Amazon Pay', date: `${year}-${month}-09`, time: '00:05', type: 'debit', status: 'completed', necessity: 'Want', risk_score: 0, risk_level: 'LOW', risk_reason: 'Normal transaction pattern', is_dismissed: 0, notes: 'Streaming subscription' }
  ];

  localStorage.setItem(STORAGE_KEY_TX, JSON.stringify(seed));
  return seed;
}

export function getClientTransactions(params = {}) {
  initClientStorage();
  let list = JSON.parse(localStorage.getItem(STORAGE_KEY_TX) || '[]');

  if (params.app && params.app !== 'All') {
    list = list.filter(t => t.app === params.app);
  }
  if (params.category && params.category !== 'All') {
    list = list.filter(t => t.category === params.category);
  }
  if (params.risk_level && params.risk_level !== 'All') {
    list = list.filter(t => t.risk_level === params.risk_level);
  }
  if (params.necessity && params.necessity !== 'All') {
    list = list.filter(t => t.necessity === params.necessity);
  }
  if (params.search) {
    const s = params.search.toLowerCase();
    list = list.filter(t => (t.merchant || '').toLowerCase().includes(s) || (t.notes || '').toLowerCase().includes(s));
  }
  return list.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
}

export function createClientTransaction(tx) {
  initClientStorage();
  const list = JSON.parse(localStorage.getItem(STORAGE_KEY_TX) || '[]');
  const now = new Date();
  const dStr = tx.date || now.toISOString().split('T')[0];
  const tStr = tx.time || now.toTimeString().slice(0, 5);

  const auto = clientAutoSegregate(tx.merchant, tx.notes || '', tx.amount);
  const risk = clientEvaluateRisk(tx.amount, tx.merchant, tStr, tx.category || auto.category);

  const newRecord = {
    id: Date.now(),
    amount: tx.amount,
    merchant: tx.merchant,
    category: tx.category || auto.category,
    subcategory: tx.subcategory || auto.subcategory,
    necessity: tx.necessity || auto.necessity,
    app: tx.app || 'Google Pay',
    date: dStr,
    time: tStr,
    type: tx.type || 'debit',
    status: risk.risk_level === 'HIGH' ? 'flagged' : 'completed',
    risk_score: risk.risk_score,
    risk_level: risk.risk_level,
    risk_reason: risk.risk_reason,
    is_dismissed: 0,
    notes: tx.notes || ''
  };

  list.unshift(newRecord);
  localStorage.setItem(STORAGE_KEY_TX, JSON.stringify(list));
  return newRecord;
}

export function computeClientForecast(budgetOverride = null, savingsOverride = null, simSpend = 0) {
  initClientStorage();
  const settings = JSON.parse(localStorage.getItem(STORAGE_KEY_SETTINGS) || '{}');
  const budget = budgetOverride ?? settings.monthly_budget ?? 48000;
  const savings = savingsOverride ?? settings.savings_goal ?? 17000;

  const txs = JSON.parse(localStorage.getItem(STORAGE_KEY_TX) || '[]');
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const currentDay = now.getDate();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const monthName = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const currentPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  let spentSoFar = 0;
  const dayTotals = {};
  for (let d = 1; d <= totalDays; d++) dayTotals[d] = 0;

  txs.forEach(t => {
    if (t.type === 'debit' && t.date.startsWith(currentPrefix)) {
      const dNum = parseInt(t.date.split('-')[2], 10);
      if (dNum <= totalDays) {
        dayTotals[dNum] = (dayTotals[dNum] || 0) + t.amount;
        if (dNum <= currentDay) spentSoFar += t.amount;
      }
    }
  });

  const daysElapsed = Math.max(1, currentDay);
  const daysRemaining = Math.max(1, totalDays - currentDay);
  const burnRate = spentSoFar / daysElapsed;
  const projectedSpend = spentSoFar + (burnRate * daysRemaining);
  const projectedBalance = budget - projectedSpend;
  const disposable = Math.max(0, budget - savings);
  const remainingDisposable = disposable - spentSoFar;
  const safeDaily = Math.max(0, remainingDisposable / daysRemaining);

  const dailyBreakdown = [];
  for (let d = 1; d <= totalDays; d++) {
    dailyBreakdown.push({
      day: d,
      date: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      amount: Math.round(dayTotals[d] || 0),
      is_future: d > currentDay
    });
  }

  let simImpact = null;
  if (simSpend > 0) {
    const simSpent = spentSoFar + simSpend;
    const simRemDisp = disposable - simSpent;
    const simSafeDaily = Math.max(0, simRemDisp / daysRemaining);
    simImpact = {
      additional_spend: simSpend,
      new_safe_daily_spend: Math.round(simSafeDaily),
      daily_safe_spend_reduction: Math.round(safeDaily - simSafeDaily),
      new_projected_spend: Math.round(projectedSpend + simSpend),
      new_projected_balance: Math.round(budget - (projectedSpend + simSpend)),
      verdict: simSafeDaily > 200 ? 'Within Safe Limits' : 'Critical Impact: Will Drain Budget'
    };
  }

  return {
    month_name: monthName,
    total_days: totalDays,
    days_elapsed: daysElapsed,
    days_remaining: daysRemaining,
    monthly_budget: budget,
    savings_goal: savings,
    total_spent_so_far: Math.round(spentSoFar),
    daily_burn_rate: Math.round(burnRate),
    projected_month_end_spend: Math.round(projectedSpend),
    projected_balance: Math.round(projectedBalance),
    safe_daily_spend_remaining: Math.round(safeDaily),
    health_status: projectedSpend > budget ? 'OVER_BUDGET' : projectedSpend > budget * 0.88 ? 'CAUTION' : 'ON_TRACK',
    status_message: projectedSpend > budget 
      ? `At your current burn rate of ₹${Math.round(burnRate)}/day, you are projected to overshoot your budget.`
      : `Healthy spending! You can safely spend up to ₹${Math.round(safeDaily)}/day for the remaining ${daysRemaining} days.`,
    daily_breakdown: dailyBreakdown,
    simulated_impact: simImpact
  };
}

export function computeClientOverview() {
  initClientStorage();
  const txs = JSON.parse(localStorage.getItem(STORAGE_KEY_TX) || '[]');
  const settings = JSON.parse(localStorage.getItem(STORAGE_KEY_SETTINGS) || '{}');
  const now = new Date();
  const currentPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthTxs = txs.filter(t => t.date.startsWith(currentPrefix));

  const debits = monthTxs.filter(t => t.type === 'debit');
  const totalSpent = debits.reduce((sum, t) => sum + t.amount, 0);
  const highRiskCount = monthTxs.filter(t => t.risk_level === 'HIGH' && !t.is_dismissed).length;

  const catMap = {};
  debits.forEach(t => { catMap[t.category] = (catMap[t.category] || 0) + t.amount; });
  const catBreakdown = Object.entries(catMap).map(([c, a]) => ({
    category: c,
    amount: Math.round(a),
    percentage: Math.round((a / Math.max(1, totalSpent)) * 100)
  })).sort((a, b) => b.amount - a.amount);

  const appMap = {};
  debits.forEach(t => {
    if (!appMap[t.app]) appMap[t.app] = { total: 0, count: 0 };
    appMap[t.app].total += t.amount;
    appMap[t.app].count += 1;
  });
  const appBreakdown = Object.entries(appMap).map(([app, info]) => ({
    app,
    amount: Math.round(info.total),
    count: info.count,
    percentage: Math.round((info.total / Math.max(1, totalSpent)) * 100)
  })).sort((a, b) => b.amount - a.amount);

  const dayMap = {};
  debits.forEach(t => {
    const d = parseInt(t.date.split('-')[2], 10);
    dayMap[d] = (dayMap[d] || 0) + t.amount;
  });
  const dailyTrend = [];
  for (let d = 1; d <= now.getDate(); d++) {
    dailyTrend.push({ day: d, amount: Math.round(dayMap[d] || 0) });
  }

  const needsTot = debits.filter(t => t.necessity === 'Need').reduce((s, t) => s + t.amount, 0);
  const wantsTot = debits.filter(t => t.necessity === 'Want').reduce((s, t) => s + t.amount, 0);
  const invTot = debits.filter(t => t.necessity === 'Investment').reduce((s, t) => s + t.amount, 0);

  return {
    month_name: now.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
    settings,
    total_spent: Math.round(totalSpent),
    total_credited: 0,
    total_transactions: monthTxs.length,
    avg_transaction: debits.length ? Math.round(totalSpent / debits.length) : 0,
    high_risk_count: highRiskCount,
    category_breakdown: catBreakdown,
    app_breakdown: appBreakdown,
    daily_trend: dailyTrend,
    insights: {
      needs_ratio: Math.round((needsTot / Math.max(1, totalSpent)) * 100),
      wants_ratio: Math.round((wantsTot / Math.max(1, totalSpent)) * 100),
      investments_ratio: Math.round((invTot / Math.max(1, totalSpent)) * 100),
      insights: [
        `You spend most through ${appBreakdown[0]?.app || 'Google Pay'}.`,
        wantsTot / totalSpent > 0.35 ? 'Discretionary spending is above 35% of total budget.' : 'Healthy discretionary spend within 50-30-20 rule.',
        'Consider setting category limits in Budgets tab to increase month-end savings.'
      ]
    }
  };
}

export function computeClientAppSegregation() {
  initClientStorage();
  const txs = JSON.parse(localStorage.getItem(STORAGE_KEY_TX) || '[]');
  const debits = txs.filter(t => t.type === 'debit');
  const totalSpend = debits.reduce((sum, t) => sum + t.amount, 0) || 1;

  const appMap = {};
  debits.forEach(t => {
    if (!appMap[t.app]) {
      appMap[t.app] = { total_spend: 0, count: 0, cats: {}, merchants: {}, recent: [] };
    }
    const a = appMap[t.app];
    a.total_spend += t.amount;
    a.count += 1;
    a.cats[t.category] = (a.cats[t.category] || 0) + t.amount;
    a.merchants[t.merchant] = (a.merchants[t.merchant] || 0) + t.amount;
    if (a.recent.length < 5) a.recent.push(t);
  });

  const apps = Object.entries(appMap).map(([appName, data]) => {
    let topMerch = 'N/A';
    let maxM = 0;
    Object.entries(data.merchants).forEach(([m, amt]) => {
      if (amt > maxM) { maxM = amt; topMerch = m; }
    });

    const catDist = Object.entries(data.cats).map(([c, amt]) => ({ category: c, amount: amt }));
    return {
      app_name: appName,
      total_spend: Math.round(data.total_spend),
      share_percentage: Math.round((data.total_spend / totalSpend) * 100),
      transaction_count: data.count,
      avg_transaction_size: Math.round(data.total_spend / data.count),
      top_merchant: topMerch,
      category_distribution: catDist,
      recent_transactions: data.recent
    };
  }).sort((a, b) => b.total_spend - a.total_spend);

  return { total_wallet_spend: Math.round(totalSpend), total_apps_used: apps.length, apps };
}
