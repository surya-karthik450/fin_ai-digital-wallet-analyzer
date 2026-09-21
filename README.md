# AI-Assisted Digital Wallet Analyzer

A full-stack financial intelligence platform designed to transform digital wallet transactions (Google Pay, PhonePe, Paytm, Amazon Pay, Apple Pay, Cred, BHIM UPI) into actionable insights, automated budgeting, predictive month-end spending runways, and voice-assisted payment tracking.

---

## Key Features

1. **Intelligent Auto-Segregation**
   - Automatically categorizes transactions into **10+ spending domains** (Groceries, Food & Dining, Utilities & Bills, Travel & Commute, Entertainment & OTT, Shopping, Health & Fitness, Investments, etc.).
   - Classifies necessity according to the **50-30-20 Rule**: *Needs* vs. *Wants* vs. *Investments*.
   - Live real-time categorization preview as you type merchant names.

2. **AI Voice Access for Payments**
   - Hands-free voice payment logging powered by the browser's native **Web Speech API** (`SpeechRecognition` + `SpeechSynthesis`).
   - Pulsing audio waveform visualizer.
   - Natural language entity extraction (recognizes amount, merchant, wallet app, category, and date).
   - Conversational voice queries (e.g., *"What is my safe spending limit today?"*).

3. **Digital Wallet App Segregation**
   - Dedicated analytics hub breaking down expenses by wallet app: **Google Pay, PhonePe, Paytm, Amazon Pay, Apple Pay, Cred, BHIM UPI**.
   - Displays volume share, transaction frequency, average ticket size, and category distribution per wallet.

4. **Predictive Month-End Spend & Burn-Rate Forecaster**
   - Analyzes payments made on the present day and past days of the month.
   - Computes:
     - **Current Daily Burn Rate** ($\text{Total Spent} / \text{Days Elapsed}$)
     - **Projected Total Month-End Spending**
     - **Safe Daily Spending Limit for Remaining Days**
   - **Interactive "What-If" Simulator**: Test how an upcoming planned expense (e.g., ₹2,500 on shopping) impacts your daily safe limit and remaining month-end savings in real time.

5. **AI Fraud & Anomaly Monitor**
   - Transparent risk scoring (0–100) with explainable reasons.
   - Flags sudden amount spikes (Z-score deviation against category median).
   - Off-hours detection (transactions during late-night hours 01:00 AM – 05:00 AM).
   - Rapid velocity checks (duplicate charges to the same merchant within minutes).

6. **Budgets & Bill Reminders**
   - Monthly category budget progress bars with visual threshold alerts.
   - Upcoming bill reminders with 1-click **Pay via Wallet** auto-debit recording.
   - Privacy Mode: Mask sensitive monetary figures with one click.

---

## Tech Stack

- **Backend**: Python 3.13, FastAPI, Uvicorn, SQLite, Pydantic v2, Pytest
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, Recharts
- **AI / Speech**: Web Speech API (`SpeechRecognition` + `SpeechSynthesis`), Custom NLP Entity Extractor & Rule-based Classifier

---

## Running the Application

### 1. Start the Backend API
In a terminal:
```bash
cd d:/miniproject/backend
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
- API Health: `http://127.0.0.1:8000/api/health`
- Interactive Swagger Docs: `http://127.0.0.1:8000/docs`

### 2. Start the Frontend
In a second terminal:
```bash
cd d:/miniproject/frontend
npm run dev
```
- Open browser: `http://localhost:5173`

---

## Running Automated Backend Tests

```bash
cd d:/miniproject/backend
python -m pytest -o pythonpath=. tests
```
"# fin_ai-digital-wallet-analyzer" 
"# fin_ai-digital-wallet-analyzer" 
"# fin_ai-digital-wallet-analyzer" 
"# fin_ai-digital-wallet-analyzer" 
"# fin_ai-digital-wallet-analyzer" 
