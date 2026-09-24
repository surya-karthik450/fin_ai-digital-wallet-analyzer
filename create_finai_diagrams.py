import os
import matplotlib.pyplot as plt
import matplotlib.patches as patches

assets_dir = r"d:\miniproject\report_assets"
os.makedirs(assets_dir, exist_ok=True)

plt.rcParams['font.family'] = 'sans-serif'
plt.rcParams['font.sans-serif'] = ['DejaVu Sans', 'Arial']

def create_overview_diagram():
    fig, ax = plt.subplots(figsize=(10, 6), dpi=300)
    ax.set_facecolor('#0f172a')
    fig.patch.set_facecolor('#0f172a')
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 6)
    ax.axis('off')

    # Title
    ax.text(5, 5.5, "FINAI WALLET ANALYZER - ARCHITECTURAL OVERVIEW", color='#38bdf8', fontsize=16, fontweight='bold', ha='center')
    ax.text(5, 5.15, "AI-Powered Multi-Wallet Telemetry, Autonomous Categorization & Burn-Rate Forecaster", color='#94a3b8', fontsize=10, ha='center')

    boxes = [
        ("1. USER INPUTS\n- Voice Capture\n- Form Entry\n- CSV Upload", 0.5, 3.2, 1.8, 1.4, '#1e293b', '#38bdf8'),
        ("2. SPEECH & NLP\n- Web Speech ASR\n- Tokenizer\n- Entity Extractor", 2.8, 3.2, 1.8, 1.4, '#1e293b', '#818cf8'),
        ("3. AI ENGINES\n- Categorizer (8)\n- Need vs Want\n- Fraud Audit", 5.1, 3.2, 1.8, 1.4, '#1e293b', '#c084fc'),
        ("4. TELEMETRY\n- Burn Forecaster\n- Safe Spend\n- Wallet Breakdown", 7.4, 3.2, 1.8, 1.4, '#1e293b', '#34d399'),
    ]

    for text, x, y, w, h, bg, border in boxes:
        rect = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.1", ec=border, fc=bg, lw=2)
        ax.add_patch(rect)
        ax.text(x + w/2, y + h/2, text, color='#f8fafc', fontsize=9, fontweight='bold', ha='center', va='center')

    # Arrows
    for x_arr in [2.4, 4.7, 7.0]:
        ax.annotate('', xy=(x_arr + 0.35, 3.9), xytext=(x_arr - 0.05, 3.9),
                    arrowprops=dict(facecolor='#38bdf8', edgecolor='#38bdf8', shrink=0.05, width=2, headwidth=7))

    # Bottom components
    db_box = patches.FancyBboxPatch((1.5, 0.8), 3.0, 1.5, boxstyle="round,pad=0.1", ec='#f59e0b', fc='#1e293b', lw=2)
    ax.add_patch(db_box)
    ax.text(3.0, 1.55, "DUAL PERSISTENCE ENGINE\n- Python FastAPI + SQLite\n- Browser localStorage Fallback\n- Zero-Server Cloud Hosting", color='#f8fafc', fontsize=9, fontweight='bold', ha='center', va='center')

    dash_box = patches.FancyBboxPatch((5.5, 0.8), 3.0, 1.5, boxstyle="round,pad=0.1", ec='#10b981', fc='#1e293b', lw=2)
    ax.add_patch(dash_box)
    ax.text(7.0, 1.55, "REACTIVE DASHBOARD (UI)\n- Multi-Wallet Aggregation\n- Live Trajectory Graph\n- Budget Breaches & Alarms", color='#f8fafc', fontsize=9, fontweight='bold', ha='center', va='center')

    # Connecting arrows to persistence & dashboard
    ax.annotate('', xy=(3.0, 2.4), xytext=(3.7, 3.1), arrowprops=dict(facecolor='#f59e0b', edgecolor='#f59e0b', width=1.5, headwidth=6))
    ax.annotate('', xy=(7.0, 2.4), xytext=(6.3, 3.1), arrowprops=dict(facecolor='#10b981', edgecolor='#10b981', width=1.5, headwidth=6))
    ax.annotate('', xy=(5.4, 1.55), xytext=(4.6, 1.55), arrowprops=dict(facecolor='#94a3b8', edgecolor='#94a3b8', width=1.5, headwidth=6))

    out_file = os.path.join(assets_dir, "finai_overview.png")
    plt.tight_layout()
    plt.savefig(out_file, facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close()
    print("Created:", out_file)

def create_architecture_diagram():
    fig, ax = plt.subplots(figsize=(10, 6.5), dpi=300)
    ax.set_facecolor('#0b1120')
    fig.patch.set_facecolor('#0b1120')
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 7)
    ax.axis('off')

    ax.text(5, 6.6, "FINAI WALLET ANALYZER - MULTI-TIER SYSTEM ARCHITECTURE", color='#38bdf8', fontsize=15, fontweight='bold', ha='center')

    layers = [
        ("PRESENTATION LAYER (CLIENT UI)", 5.6, '#38bdf8', [
            ("React 18 SPA\n(Vite 5 / JSX)", 0.6, 4.8, 2.6, 0.7),
            ("Tailwind CSS\n(Dark Aesthetics)", 3.7, 4.8, 2.6, 0.7),
            ("Recharts & Lucide\n(SVG Trajectories)", 6.8, 4.8, 2.6, 0.7),
        ]),
        ("INTELLIGENT APPLICATION & API LAYER", 3.8, '#818cf8', [
            ("FastAPI Gateway\n(Python Async Router)", 0.6, 3.0, 2.6, 0.7),
            ("AI Categorizer & Fraud Scorer\n(NLP Heuristics)", 3.7, 3.0, 2.6, 0.7),
            ("Burn-Rate Forecaster\n(Mathematical Engine)", 6.8, 3.0, 2.6, 0.7),
        ]),
        ("DATA PERSISTENCE & RESILIENCY LAYER", 2.0, '#34d399', [
            ("SQLAlchemy ORM\n(Relational Schema)", 0.6, 1.2, 2.6, 0.7),
            ("SQLite Local Database\n(ACID Store)", 3.7, 1.2, 2.6, 0.7),
            ("clientEngine.js\n(LocalStorage Fallback)", 6.8, 1.2, 2.6, 0.7),
        ]),
    ]

    for title, y_title, col, items in layers:
        ax.text(5, y_title, title, color=col, fontsize=11, fontweight='bold', ha='center')
        for label, x, y, w, h in items:
            rect = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.08", ec=col, fc='#1e293b', lw=1.5)
            ax.add_patch(rect)
            ax.text(x + w/2, y + h/2, label, color='#f8fafc', fontsize=8.5, ha='center', va='center')

    # Draw Inter-layer connectors
    for x_c in [1.9, 5.0, 8.1]:
        ax.annotate('', xy=(x_c, 3.8), xytext=(x_c, 4.7), arrowprops=dict(facecolor='#38bdf8', edgecolor='#38bdf8', width=1.5, headwidth=5))
        ax.annotate('', xy=(x_c, 2.0), xytext=(x_c, 2.9), arrowprops=dict(facecolor='#818cf8', edgecolor='#818cf8', width=1.5, headwidth=5))

    out_file = os.path.join(assets_dir, "finai_architecture.png")
    plt.tight_layout()
    plt.savefig(out_file, facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close()
    print("Created:", out_file)

def create_workflow_diagram():
    fig, ax = plt.subplots(figsize=(10, 5.5), dpi=300)
    ax.set_facecolor('#0f172a')
    fig.patch.set_facecolor('#0f172a')
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 5)
    ax.axis('off')

    ax.text(5, 4.6, "FINAI TRANSACTION PROCESSING & TELEMETRY WORKFLOW", color='#38bdf8', fontsize=14, fontweight='bold', ha='center')

    steps = [
        ("Step 1: Input\nVoice / Text Form", 0.5, 2.2, 1.5, 1.2, '#38bdf8'),
        ("Step 2: ASR & NLP\nExtract Payee/₹", 2.4, 2.2, 1.5, 1.2, '#818cf8'),
        ("Step 3: Categorize\nMatch Brand/Need", 4.3, 2.2, 1.5, 1.2, '#c084fc'),
        ("Step 4: Audit Risk\nHour/Amount/Payee", 6.2, 2.2, 1.5, 1.2, '#f43f5e'),
        ("Step 5: Telemetry\nForecast & Quota", 8.1, 2.2, 1.5, 1.2, '#10b981'),
    ]

    for label, x, y, w, h, col in steps:
        rect = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.08", ec=col, fc='#1e293b', lw=1.8)
        ax.add_patch(rect)
        ax.text(x + w/2, y + h/2, label, color='#f8fafc', fontsize=8.5, fontweight='bold', ha='center', va='center')

    # Arrows
    for x_arr in [2.05, 3.95, 5.85, 7.75]:
        ax.annotate('', xy=(x_arr + 0.3, 2.8), xytext=(x_arr - 0.05, 2.8),
                    arrowprops=dict(facecolor='#38bdf8', edgecolor='#38bdf8', shrink=0.05, width=1.5, headwidth=6))

    # Bottom summary box
    rect_bot = patches.FancyBboxPatch((1.5, 0.4), 7.0, 1.1, boxstyle="round,pad=0.1", ec='#f59e0b', fc='#1e293b', lw=1.5)
    ax.add_patch(rect_bot)
    ax.text(5.0, 0.95, "Continuous Dashboard Telemetry:\nSafe Daily Spend Calculation | Month-End Burn Runway | Multi-Wallet Segregation",
            color='#fbbf24', fontsize=9, fontweight='bold', ha='center', va='center')

    out_file = os.path.join(assets_dir, "finai_workflow.png")
    plt.tight_layout()
    plt.savefig(out_file, facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close()
    print("Created:", out_file)

def create_dfd_diagram():
    fig, ax = plt.subplots(figsize=(10, 5.5), dpi=300)
    ax.set_facecolor('#0f172a')
    fig.patch.set_facecolor('#0f172a')
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 5.5)
    ax.axis('off')

    ax.text(5, 5.0, "DATA FLOW DIAGRAM (LEVEL 1 DFD) - FINAI WALLET ANALYZER", color='#38bdf8', fontsize=14, fontweight='bold', ha='center')

    # User Entity
    user = patches.Rectangle((0.5, 2.2), 1.6, 1.2, ec='#38bdf8', fc='#1e293b', lw=2)
    ax.add_patch(user)
    ax.text(1.3, 2.8, "USER / CLIENT\n(Web / Voice)", color='#f8fafc', fontsize=9, fontweight='bold', ha='center', va='center')

    # Processes
    p1 = patches.Circle((4.0, 3.8), 0.8, ec='#818cf8', fc='#1e293b', lw=2)
    ax.add_patch(p1)
    ax.text(4.0, 3.8, "1.0 Ingest &\nCategorize", color='#f8fafc', fontsize=8.5, fontweight='bold', ha='center', va='center')

    p2 = patches.Circle((4.0, 1.8), 0.8, ec='#f43f5e', fc='#1e293b', lw=2)
    ax.add_patch(p2)
    ax.text(4.0, 1.8, "2.0 Anomaly &\nFraud Scoring", color='#f8fafc', fontsize=8.5, fontweight='bold', ha='center', va='center')

    p3 = patches.Circle((7.2, 2.8), 0.8, ec='#10b981', fc='#1e293b', lw=2)
    ax.add_patch(p3)
    ax.text(7.2, 2.8, "3.0 Burn Rate &\nForecaster", color='#f8fafc', fontsize=8.5, fontweight='bold', ha='center', va='center')

    # Database Store
    db_top = patches.Rectangle((8.6, 1.5), 1.2, 0.1, ec='#f59e0b', fc='#f59e0b')
    db_bot = patches.Rectangle((8.6, 3.9), 1.2, 0.1, ec='#f59e0b', fc='#f59e0b')
    ax.add_patch(db_top)
    ax.add_patch(db_bot)
    ax.text(9.2, 2.7, "D1: SQLite /\nLocalStorage", color='#fbbf24', fontsize=8.5, fontweight='bold', ha='center', va='center')

    # Arrows
    ax.annotate('Voice/Text', xy=(3.2, 3.8), xytext=(2.2, 3.0), arrowprops=dict(facecolor='#38bdf8', edgecolor='#38bdf8', width=1.2, headwidth=5))
    ax.annotate('Amount/Time', xy=(3.2, 1.8), xytext=(2.2, 2.6), arrowprops=dict(facecolor='#38bdf8', edgecolor='#38bdf8', width=1.2, headwidth=5))
    ax.annotate('', xy=(6.4, 3.1), xytext=(4.8, 3.8), arrowprops=dict(facecolor='#818cf8', edgecolor='#818cf8', width=1.2, headwidth=5))
    ax.annotate('', xy=(6.4, 2.5), xytext=(4.8, 1.8), arrowprops=dict(facecolor='#f43f5e', edgecolor='#f43f5e', width=1.2, headwidth=5))
    ax.annotate('Save', xy=(8.5, 2.8), xytext=(8.0, 2.8), arrowprops=dict(facecolor='#10b981', edgecolor='#10b981', width=1.2, headwidth=5))

    out_file = os.path.join(assets_dir, "finai_dfd.png")
    plt.tight_layout()
    plt.savefig(out_file, facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close()
    print("Created:", out_file)

def create_erd_diagram():
    fig, ax = plt.subplots(figsize=(10, 5.5), dpi=300)
    ax.set_facecolor('#0f172a')
    fig.patch.set_facecolor('#0f172a')
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 5)
    ax.axis('off')

    ax.text(5, 4.6, "ENTITY RELATIONSHIP DIAGRAM (ERD) - FINAI WALLET ANALYZER", color='#38bdf8', fontsize=14, fontweight='bold', ha='center')

    # Entities
    entities = [
        ("USER\n- id (PK)\n- name\n- monthly_income", 0.6, 2.0, 2.0, 1.8, '#38bdf8'),
        ("TRANSACTION\n- id (PK)\n- user_id (FK)\n- merchant\n- amount\n- wallet_app\n- category\n- necessity\n- risk_score", 3.8, 1.0, 2.5, 2.8, '#818cf8'),
        ("BUDGET\n- id (PK)\n- category\n- monthly_limit\n- spent_amount", 7.4, 2.6, 2.1, 1.6, '#10b981'),
        ("BILL_REMINDER\n- id (PK)\n- billee_name\n- amount\n- due_date\n- is_paid", 7.4, 0.6, 2.1, 1.6, '#f59e0b'),
    ]

    for label, x, y, w, h, col in entities:
        rect = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.08", ec=col, fc='#1e293b', lw=1.8)
        ax.add_patch(rect)
        ax.text(x + w/2, y + h/2, label, color='#f8fafc', fontsize=8.5, fontweight='bold', ha='center', va='center')

    # Connector lines
    ax.annotate('1 : N (Submits)', xy=(3.7, 2.5), xytext=(2.7, 2.5), arrowprops=dict(facecolor='#38bdf8', edgecolor='#38bdf8', width=1.5, headwidth=6))
    ax.annotate('Tracks (N : 1)', xy=(7.3, 3.2), xytext=(6.4, 2.5), arrowprops=dict(facecolor='#10b981', edgecolor='#10b981', width=1.5, headwidth=6))
    ax.annotate('Schedules', xy=(7.3, 1.6), xytext=(6.4, 2.0), arrowprops=dict(facecolor='#f59e0b', edgecolor='#f59e0b', width=1.5, headwidth=6))

    out_file = os.path.join(assets_dir, "finai_erd.png")
    plt.tight_layout()
    plt.savefig(out_file, facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close()
    print("Created:", out_file)

if __name__ == "__main__":
    create_overview_diagram()
    create_architecture_diagram()
    create_workflow_diagram()
    create_dfd_diagram()
    create_erd_diagram()
