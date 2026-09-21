import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  Check, 
  X, 
  Sparkles, 
  ArrowRight, 
  AlertCircle, 
  Loader2,
  Send,
  HelpCircle,
  ShieldCheck,
  Edit2,
  Globe,
  RefreshCw,
  Info
} from 'lucide-react';
import { api } from '../api';
import { formatCurrency, getAppMeta } from '../utils';

export default function VoicePaymentModal({ isOpen, onClose, onPaymentAdded, privacyMode }) {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [transcript, setTranscript] = useState('');
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [aiResponseText, setAiResponseText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [speechLang, setSpeechLang] = useState('en-IN'); // en-IN or en-US
  const [micVolume, setMicVolume] = useState(0);

  const recognitionRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const micStreamRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Setup Web Speech API
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true; // Real-time feedback!
    recognition.lang = speechLang;

    recognition.onstart = () => {
      setIsListening(true);
      setErrorMessage('');
      setInterimTranscript('');
      startAudioVisualizer();
    };

    recognition.onresult = (event) => {
      let finalStr = '';
      let interimStr = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item.isFinal) {
          finalStr += item[0].transcript;
        } else {
          interimStr += item[0].transcript;
        }
      }

      if (interimStr) {
        setInterimTranscript(interimStr);
      }

      if (finalStr) {
        setTranscript(finalStr);
        setInputText(finalStr);
        setInterimTranscript('');
        stopAudioVisualizer();
        handleProcessVoice(finalStr);
      }
    };

    recognition.onerror = (event) => {
      console.warn('Speech error:', event.error);
      setIsListening(false);
      stopAudioVisualizer();

      if (event.error === 'no-speech') {
        setErrorMessage('No speech detected. Click the microphone and speak clearly.');
      } else if (event.error === 'not-allowed' || event.error === 'permission-denied') {
        setErrorMessage('Microphone access blocked. Click the lock/tune icon in your browser address bar to allow Microphone permission.');
      } else if (event.error === 'network') {
        setErrorMessage('Speech recognition network error. You can also type commands below.');
      } else {
        setErrorMessage(`Microphone status: ${event.error}. You can also type commands directly below.`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      stopAudioVisualizer();
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
      stopAudioVisualizer();
    };
  }, [speechLang]);

  // Real-time audio analyzer for mic volume bars
  const startAudioVisualizer = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setMicVolume(Math.min(100, Math.round((avg / 128) * 100)));
        animationFrameRef.current = requestAnimationFrame(updateVolume);
      };
      updateVolume();
    } catch (e) {
      console.warn('Audio visualization not available:', e);
    }
  };

  const stopAudioVisualizer = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setMicVolume(0);
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setErrorMessage('Speech recognition is not supported in this browser. Please use the text input below.');
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setIsListening(false);
      stopAudioVisualizer();
    } else {
      setTranscript('');
      setInterimTranscript('');
      setParsedData(null);
      setAiResponseText('');
      setErrorMessage('');
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.warn(e);
        try {
          recognitionRef.current.abort();
          setTimeout(() => recognitionRef.current.start(), 200);
        } catch (err) {}
      }
    }
  };

  const speakText = (text) => {
    if (isMuted || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      // Select natural voice if available
      const voices = window.speechSynthesis.getVoices();
      const naturalVoice = voices.find(
        (v) => (v.lang.startsWith('en') && v.name.includes('Natural')) || v.name.includes('Google') || v.lang === speechLang
      );
      if (naturalVoice) utterance.voice = naturalVoice;

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('TTS error:', e);
    }
  };

  const handleProcessVoice = async (textToProcess) => {
    const query = (textToProcess || inputText).trim();
    if (!query) return;

    try {
      setIsProcessing(true);
      setErrorMessage('');
      const res = await api.processVoiceCommand(query);

      setAiResponseText(res.speech_response);
      speakText(res.speech_response);

      if (res.intent === 'LOG_PAYMENT' && res.parsed_transaction) {
        setParsedData(res.parsed_transaction);
      } else {
        setParsedData(null);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Error analyzing voice command. Please check if backend is running.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!parsedData) return;
    try {
      setIsSaving(true);
      await api.confirmVoicePayment(parsedData);
      speakText(`Payment of ${parsedData.amount} rupees to ${parsedData.merchant} confirmed and saved.`);
      onPaymentAdded();
      handleClose();
    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to save transaction.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    stopAudioVisualizer();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setTranscript('');
    setInterimTranscript('');
    setInputText('');
    setParsedData(null);
    setAiResponseText('');
    setErrorMessage('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-indigo-500/40 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                AI Voice Payment Assistant
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                  Enhanced Speech AI
                </span>
              </h3>
              <p className="text-xs text-slate-400">Speak naturally to log payments or ask financial questions</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Speech Audio Mute Toggle */}
            <button
              onClick={() => {
                if (!isMuted && 'speechSynthesis' in window) window.speechSynthesis.cancel();
                setIsMuted(!isMuted);
              }}
              title={isMuted ? 'Unmute voice feedback' : 'Mute voice feedback'}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-slate-300" />}
            </button>

            {/* Language Accent Selector */}
            <button
              onClick={() => setSpeechLang(speechLang === 'en-IN' ? 'en-US' : 'en-IN')}
              title="Toggle English accent model"
              className="px-2 py-1 rounded-lg bg-slate-800 text-[11px] font-semibold text-indigo-300 border border-slate-700 hover:bg-slate-700 transition-colors flex items-center gap-1"
            >
              <Globe className="w-3 h-3" />
              <span>{speechLang}</span>
            </button>

            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 overflow-y-auto">
          {/* Animated Microphone Area */}
          <div className="flex flex-col items-center justify-center py-6 bg-slate-950/70 rounded-2xl border border-slate-800 relative overflow-hidden">
            <button
              onClick={toggleListening}
              className={`relative z-10 flex items-center justify-center w-20 h-20 rounded-full transition-all duration-300 ${
                isListening
                  ? 'bg-rose-500 text-white shadow-2xl shadow-rose-500/60 ring-8 ring-rose-500/25 scale-105'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/40 hover:scale-105'
              }`}
            >
              {isListening ? (
                <MicOff className="w-8 h-8 animate-pulse" />
              ) : (
                <Mic className="w-8 h-8" />
              )}
            </button>

            {/* Volume-Reactive Audio Wave Bars */}
            {isListening && (
              <div className="flex items-center justify-center gap-1.5 mt-4 h-10">
                {[...Array(9)].map((_, i) => {
                  // Scale height based on micVolume
                  const factor = Math.max(0.2, (micVolume / 100) * ((i % 2 === 0 ? 1 : 0.7) + 0.3));
                  const height = Math.min(38, Math.max(6, Math.round(38 * factor)));
                  return (
                    <span
                      key={i}
                      style={{ height: `${height}px` }}
                      className={`w-1.5 rounded-full transition-all duration-75 ${
                        i % 2 === 0 ? 'bg-rose-500' : 'bg-indigo-400'
                      }`}
                    ></span>
                  );
                })}
              </div>
            )}

            <p className="text-xs font-bold text-slate-200 mt-3 flex items-center gap-1.5">
              {isListening ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                  <span>Listening... Speak now</span>
                </>
              ) : (
                <span>Tap the microphone to speak</span>
              )}
            </p>

            {/* Live Real-Time Transcription feedback */}
            {(interimTranscript || transcript) && (
              <div className="mt-2 px-4 text-center max-w-md">
                <p className="text-xs text-indigo-300 font-medium italic">
                  "{interimTranscript || transcript}"
                </p>
              </div>
            )}
          </div>

          {/* Quick Speech Prompt Chips */}
          <div>
            <p className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
              <span>Tap any sample to try instantly:</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { label: '💳 Starbucks ₹350 on GPay', text: 'Paid 350 for coffee at Starbucks on Google Pay' },
                { label: '⚡ Electricity ₹1200 PhonePe', text: 'Paid 1200 for electricity bill on PhonePe' },
                { label: '🍕 Domino\'s ₹450 Paytm', text: 'Paid 450 for Domino\'s pizza on Paytm' },
                { label: '📊 "What is my safe spending limit?"', text: 'What is my safe spending limit today?' },
                { label: '💰 "How much have I spent?"', text: 'How much have I spent this month?' },
                { label: '🛡️ "Any fraud alerts?"', text: 'Any fraud alerts or suspicious activity?' },
              ].map((sample, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setInputText(sample.text);
                    handleProcessVoice(sample.text);
                  }}
                  className="px-3 py-2 rounded-xl text-left text-xs bg-slate-950/80 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-indigo-500/40 transition-all truncate"
                >
                  <span className="font-semibold text-white block">{sample.label}</span>
                  <span className="text-[11px] text-slate-400 truncate block">"{sample.text}"</span>
                </button>
              ))}
            </div>
          </div>

          {/* Fallback Text Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleProcessVoice(inputText);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Or type voice command here... (e.g. Paid 350 at Starbucks on GPay)"
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <button
              type="submit"
              disabled={isProcessing || !inputText.trim()}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold disabled:opacity-50 flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all"
            >
              {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>Send</span>
            </button>
          </form>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block">Microphone Notice</span>
                <span className="text-slate-300 leading-relaxed">{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Spoken AI Response Card */}
          {aiResponseText && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/60 to-purple-950/40 border border-indigo-500/30 text-xs text-indigo-200 flex items-start gap-3">
              <Volume2 className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-white text-sm">Assistant Voice Feedback:</span>
                <p className="leading-relaxed text-slate-200">{aiResponseText}</p>
              </div>
            </div>
          )}

          {/* Parsed Transaction Card with Editable Confirmation */}
          {parsedData && (
            <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/40 space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> Parsed Payment Preview
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 font-semibold text-slate-300">
                  Ready to Log
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                <div>
                  <span className="text-slate-400 block text-[11px]">Amount:</span>
                  <input
                    type="number"
                    value={parsedData.amount}
                    onChange={(e) => setParsedData({ ...parsedData, amount: parseFloat(e.target.value) || 0 })}
                    className="mt-0.5 w-full font-extrabold text-base bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Digital Wallet:</span>
                  <select
                    value={parsedData.app}
                    onChange={(e) => setParsedData({ ...parsedData, app: e.target.value })}
                    className="mt-0.5 w-full font-semibold text-xs bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-indigo-400 focus:outline-none focus:border-indigo-500"
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
                  <span className="text-slate-400 block text-[11px]">Merchant / Payee:</span>
                  <input
                    type="text"
                    value={parsedData.merchant}
                    onChange={(e) => setParsedData({ ...parsedData, merchant: e.target.value })}
                    className="mt-0.5 w-full font-medium text-xs bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Category:</span>
                  <input
                    type="text"
                    value={parsedData.category}
                    onChange={(e) => setParsedData({ ...parsedData, category: e.target.value })}
                    className="mt-0.5 w-full font-medium text-xs bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                <span>Necessity:</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-800 font-semibold text-slate-200">
                  {parsedData.necessity}
                </span>
                <span>•</span>
                <span>Risk:</span>
                <span className={`font-semibold ${parsedData.risk_score > 40 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {parsedData.risk_score}/100 ({parsedData.risk_level})
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setParsedData(null)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
                >
                  Discard
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleConfirmPayment}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Confirm & Log Payment</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
