import React, { useState, useEffect } from 'react';
import { Mic, Sparkles } from 'lucide-react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import DashboardOverview from './components/DashboardOverview';
import AppSegregationView from './components/AppSegregationView';
import MonthEndCalculator from './components/MonthEndCalculator';
import TransactionList from './components/TransactionList';
import FraudDetectionView from './components/FraudDetectionView';
import BudgetsAndBills from './components/BudgetsAndBills';
import VoicePaymentModal from './components/VoicePaymentModal';
import { api } from './api';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [privacyMode, setPrivacyMode] = useState(false);
  const [overview, setOverview] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [preselectedApp, setPreselectedApp] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    loadAllData();

    // Hotkey listener: pressing 'v' (outside of inputs) or Ctrl+Space opens voice assistant!
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') return;
      if ((e.key === 'v' || e.key === 'V') && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setIsVoiceOpen(true);
      } else if (e.code === 'Space' && e.ctrlKey) {
        e.preventDefault();
        setIsVoiceOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  async function loadAllData() {
    try {
      const [ovData, fcData] = await Promise.all([
        api.getOverview(),
        api.getMonthEndForecast(),
      ]);
      setOverview(ovData);
      setForecast(fcData);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
  }

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleResetData = async () => {
    if (confirm('Reset transactions and demo data to default multi-wallet seed?')) {
      try {
        setIsResetting(true);
        await api.resetSeedData();
        await loadAllData();
        showToast('Demo data reset successfully with realistic multi-app transactions!');
      } catch (err) {
        console.error(err);
      } finally {
        setIsResetting(false);
      }
    }
  };

  const handleSelectAppFilter = (appName) => {
    setPreselectedApp(appName);
    setActiveTab('transactions');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Navbar */}
      <Navbar
        overview={overview}
        privacyMode={privacyMode}
        setPrivacyMode={setPrivacyMode}
        openVoiceModal={() => setIsVoiceOpen(true)}
        onResetData={handleResetData}
        isResetting={isResetting}
      />

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 px-4 py-3 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-xl border border-indigo-400/40 animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* Main Layout: Sidebar + Active Content */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            if (tab === 'voice') {
              setIsVoiceOpen(true);
            } else {
              setActiveTab(tab);
            }
          }}
          highRiskCount={overview?.high_risk_count ?? 0}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-full">
          {activeTab === 'overview' && (
            <DashboardOverview
              overview={overview}
              forecast={forecast}
              privacyMode={privacyMode}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'by-app' && (
            <AppSegregationView
              privacyMode={privacyMode}
              onSelectAppFilter={handleSelectAppFilter}
            />
          )}

          {activeTab === 'month-end' && (
            <MonthEndCalculator
              privacyMode={privacyMode}
              onPaymentLogged={loadAllData}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionList
              privacyMode={privacyMode}
              preselectedApp={preselectedApp}
              onTransactionUpdated={loadAllData}
            />
          )}

          {activeTab === 'fraud' && (
            <FraudDetectionView
              privacyMode={privacyMode}
              onTransactionUpdated={loadAllData}
            />
          )}

          {activeTab === 'budgets' && (
            <BudgetsAndBills
              privacyMode={privacyMode}
              onDataChanged={loadAllData}
            />
          )}
        </main>
      </div>

      {/* Floating Global Voice Assistant Action Button */}
      <button
        onClick={() => setIsVoiceOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-2xl shadow-indigo-600/50 hover:scale-105 active:scale-95 transition-all border border-indigo-400/40 group"
        title="Voice Payment AI Assistant (or press 'V')"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-80"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
        </span>
        <Mic className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
        <span className="hidden sm:inline">Voice Assistant</span>
        <kbd className="hidden lg:inline-block px-1.5 py-0.5 rounded text-[9px] bg-indigo-900/60 text-indigo-200 border border-indigo-400/30">
          V
        </kbd>
      </button>

      {/* AI Voice Access Payment Modal */}
      <VoicePaymentModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onPaymentAdded={() => {
          loadAllData();
          showToast('Voice payment logged and auto-segregated!');
        }}
        privacyMode={privacyMode}
      />
    </div>
  );
}
