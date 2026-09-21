import {
  initClientStorage,
  computeClientOverview,
  computeClientAppSegregation,
  computeClientForecast,
  getClientTransactions,
  createClientTransaction,
  resetClientSeedData,
  clientAutoSegregate,
  clientEvaluateRisk
} from './clientEngine';

const API_BASE = '/api';
let isBackendAvailable = null;

async function checkBackend() {
  if (isBackendAvailable !== null) return isBackendAvailable;
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(1500) });
    isBackendAvailable = res.ok;
  } catch (e) {
    isBackendAvailable = false;
  }
  return isBackendAvailable;
}

export async function fetchJson(endpoint, options = {}) {
  const hasBackend = await checkBackend();
  if (!hasBackend) {
    throw new Error('BACKEND_OFFLINE');
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Network request failed' }));
    throw new Error(err.detail || 'Network error');
  }
  return res.json();
}

export const api = {
  // Analytics & Dashboard
  getOverview: async () => {
    try {
      return await fetchJson('/analytics/overview');
    } catch (e) {
      return computeClientOverview();
    }
  },
  getAppSegregation: async () => {
    try {
      return await fetchJson('/analytics/by-app');
    } catch (e) {
      return computeClientAppSegregation();
    }
  },

  // Forecasting
  getMonthEndForecast: async () => {
    try {
      return await fetchJson('/forecasting/month-end');
    } catch (e) {
      return computeClientForecast();
    }
  },
  simulateForecast: async (data) => {
    try {
      return await fetchJson('/forecasting/simulate', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (e) {
      return computeClientForecast(data.monthly_budget, data.savings_goal, data.simulated_additional_spending);
    }
  },

  // Transactions
  getTransactions: async (params = {}) => {
    try {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== 'All') {
          query.append(k, v);
        }
      });
      return await fetchJson(`/transactions?${query.toString()}`);
    } catch (e) {
      return getClientTransactions(params);
    }
  },
  createTransaction: async (data) => {
    try {
      return await fetchJson('/transactions', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (e) {
      return createClientTransaction(data);
    }
  },
  updateTransaction: async (id, data) => {
    try {
      return await fetchJson(`/transactions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch (e) {
      const list = JSON.parse(localStorage.getItem('finai_transactions') || '[]');
      const idx = list.findIndex(t => t.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...data };
        localStorage.setItem('finai_transactions', JSON.stringify(list));
        return list[idx];
      }
      return data;
    }
  },
  deleteTransaction: async (id) => {
    try {
      return await fetchJson(`/transactions/${id}`, {
        method: 'DELETE',
      });
    } catch (e) {
      const list = JSON.parse(localStorage.getItem('finai_transactions') || '[]');
      const filtered = list.filter(t => t.id !== id);
      localStorage.setItem('finai_transactions', JSON.stringify(filtered));
      return { message: 'Deleted' };
    }
  },
  resetSeedData: async () => {
    try {
      return await fetchJson('/transactions/reset-seed', {
        method: 'POST',
      });
    } catch (e) {
      resetClientSeedData();
      return { message: 'Seed data reset' };
    }
  },

  // Voice AI
  processVoiceCommand: async (command) => {
    try {
      return await fetchJson('/voice/process', {
        method: 'POST',
        body: JSON.stringify({ command }),
      });
    } catch (e) {
      // Client-side voice entity extraction fallback
      const lower = command.toLowerCase();
      const numMatch = lower.match(/(?:(?:rs\.?|inr|₹)\s*)?([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)/);
      const amount = numMatch ? parseFloat(numMatch[1].replace(/,/g, '')) : 0;

      let detectedApp = 'Google Pay';
      for (const [kw, name] of [
        ['google pay', 'Google Pay'], ['gpay', 'Google Pay'],
        ['phonepe', 'PhonePe'], ['paytm', 'Paytm'],
        ['amazon pay', 'Amazon Pay'], ['apple pay', 'Apple Pay'],
        ['cred', 'Cred'], ['bhim', 'BHIM UPI']
      ]) {
        if (lower.includes(kw)) { detectedApp = name; break; }
      }

      const knownMerchants = ['Starbucks', 'Swiggy', 'Zomato', "Domino's", 'BESCOM', 'Blinkit', 'Zepto', 'Uber', 'Ola', 'Netflix', 'Amazon'];
      let merchant = 'General Expense';
      for (const km of knownMerchants) {
        if (lower.includes(km.toLowerCase())) { merchant = km; break; }
      }

      const auto = clientAutoSegregate(merchant, command, amount);
      const now = new Date();
      const dStr = now.toISOString().split('T')[0];
      const tStr = now.toTimeString().slice(0, 5);
      const risk = clientEvaluateRisk(amount, merchant, tStr, auto.category);

      if (amount > 0) {
        return {
          intent: 'LOG_PAYMENT',
          parsed_transaction: {
            amount,
            merchant,
            category: auto.category,
            subcategory: auto.subcategory,
            necessity: auto.necessity,
            app: detectedApp,
            date: dStr,
            time: tStr,
            type: 'debit',
            risk_score: risk.risk_score,
            risk_level: risk.risk_level,
            risk_reason: risk.risk_reason,
            notes: `Voice logged: "${command}"`
          },
          speech_response: `Logged payment of ₹${amount} to ${merchant} via ${detectedApp}. Categorized under ${auto.category}.`,
          success: true,
          suggestions: ['Confirm and Save', 'Cancel']
        };
      } else if (lower.includes('safe spend') || lower.includes('safe limit') || lower.includes('how much can i spend')) {
        const fc = computeClientForecast();
        return {
          intent: 'QUERY_SAFE_SPEND',
          speech_response: `Your safe daily spending limit is ₹${fc.safe_daily_spend_remaining} for today.`,
          success: true,
          suggestions: ['Log a payment', 'Check budget']
        };
      } else {
        return {
          intent: 'UNKNOWN',
          speech_response: "I didn't quite catch the payment details. Please say something like 'Paid 350 for coffee at Starbucks on Google Pay'.",
          success: false,
          suggestions: ['Paid 350 for coffee at Starbucks on Google Pay', 'What is my safe spending limit today?']
        };
      }
    }
  },
  confirmVoicePayment: async (txData) => {
    try {
      return await fetchJson('/voice/confirm-payment', {
        method: 'POST',
        body: JSON.stringify(txData),
      });
    } catch (e) {
      return createClientTransaction(txData);
    }
  },

  // Budgets & Bills
  getBudgets: async () => {
    try {
      return await fetchJson('/budgets-bills/budgets');
    } catch (e) {
      initClientStorage();
      return JSON.parse(localStorage.getItem('finai_budgets') || '[]');
    }
  },
  saveBudget: async (data) => {
    try {
      return await fetchJson('/budgets-bills/budgets', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (e) {
      const list = JSON.parse(localStorage.getItem('finai_budgets') || '[]');
      const idx = list.findIndex(b => b.category === data.category);
      if (idx !== -1) list[idx] = { ...list[idx], ...data };
      else list.push({ id: Date.now(), ...data });
      localStorage.setItem('finai_budgets', JSON.stringify(list));
      return { message: 'Saved' };
    }
  },
  getBills: async () => {
    try {
      return await fetchJson('/budgets-bills/bills');
    } catch (e) {
      initClientStorage();
      return JSON.parse(localStorage.getItem('finai_bills') || '[]');
    }
  },
  createBill: async (data) => {
    try {
      return await fetchJson('/budgets-bills/bills', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (e) {
      const list = JSON.parse(localStorage.getItem('finai_bills') || '[]');
      const newBill = { id: Date.now(), status: 'unpaid', ...data };
      list.push(newBill);
      localStorage.setItem('finai_bills', JSON.stringify(list));
      return { message: 'Bill created', id: newBill.id };
    }
  },
  payBill: async (id) => {
    try {
      return await fetchJson(`/budgets-bills/bills/${id}/pay`, {
        method: 'PUT',
      });
    } catch (e) {
      const list = JSON.parse(localStorage.getItem('finai_bills') || '[]');
      const b = list.find(x => x.id === id);
      if (b) b.status = 'paid';
      localStorage.setItem('finai_bills', JSON.stringify(list));
      return { message: 'Bill paid' };
    }
  },
  getSettings: async () => {
    try {
      return await fetchJson('/budgets-bills/settings');
    } catch (e) {
      initClientStorage();
      return JSON.parse(localStorage.getItem('finai_settings') || '{}');
    }
  },
  updateSettings: async (data) => {
    try {
      return await fetchJson('/budgets-bills/settings', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch (e) {
      localStorage.setItem('finai_settings', JSON.stringify(data));
      return { message: 'Settings updated' };
    }
  },
};
