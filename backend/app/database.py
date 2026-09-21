import sqlite3
import os
from pathlib import Path
from contextlib import contextmanager

DB_DIR = Path(__file__).resolve().parent.parent
DB_PATH = DB_DIR / "wallet_analyzer.db"

def get_connection():
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

@contextmanager
def get_db():
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def init_db():
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Transactions Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                amount REAL NOT NULL,
                merchant TEXT NOT NULL,
                category TEXT NOT NULL,
                subcategory TEXT DEFAULT '',
                app TEXT NOT NULL,
                date TEXT NOT NULL,
                time TEXT NOT NULL,
                type TEXT DEFAULT 'debit',
                status TEXT DEFAULT 'completed',
                necessity TEXT DEFAULT 'Need',
                risk_score INTEGER DEFAULT 0,
                risk_level TEXT DEFAULT 'LOW',
                risk_reason TEXT DEFAULT '',
                is_dismissed INTEGER DEFAULT 0,
                notes TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # Budgets Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS budgets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category TEXT UNIQUE NOT NULL,
                monthly_limit REAL NOT NULL,
                icon TEXT DEFAULT 'tag',
                color TEXT DEFAULT '#6366f1'
            );
        """)

        # Bills Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS bills (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                amount REAL NOT NULL,
                due_date TEXT NOT NULL,
                category TEXT NOT NULL,
                app TEXT NOT NULL,
                status TEXT DEFAULT 'unpaid',
                recurring TEXT DEFAULT 'monthly'
            );
        """)

        # User Settings / Profile Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_settings (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                monthly_income REAL DEFAULT 65000.0,
                monthly_budget REAL DEFAULT 48000.0,
                savings_goal REAL DEFAULT 17000.0,
                currency TEXT DEFAULT '₹',
                privacy_mode INTEGER DEFAULT 0
            );
        """)

        # Insert default settings if not exists
        cursor.execute("""
            INSERT OR IGNORE INTO user_settings (id, monthly_income, monthly_budget, savings_goal, currency, privacy_mode)
            VALUES (1, 65000.0, 48000.0, 17000.0, '₹', 0);
        """)

        # Indexes for fast querying and segregation
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_trans_app ON transactions(app);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_trans_cat ON transactions(category);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_trans_date ON transactions(date);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_trans_risk ON transactions(risk_level);")
