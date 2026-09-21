from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from datetime import datetime

from ..database import get_db
from ..models import BudgetCreate, BillCreate, UserSettingsModel

router = APIRouter(prefix="/api/budgets-bills", tags=["Budgets and Bills"])

@router.get("/budgets")
def get_budgets_with_progress():
    now = datetime.now()
    current_month_prefix = f"{now.year:04d}-{now.month:02d}"

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM budgets ORDER BY monthly_limit DESC")
        budgets = [dict(b) for b in cursor.fetchall()]

        cursor.execute("""
            SELECT category, SUM(amount) as spent 
            FROM transactions 
            WHERE date LIKE ? AND type = 'debit'
            GROUP BY category
        """, (f"{current_month_prefix}%",))
        spent_map = {row["category"]: row["spent"] for row in cursor.fetchall()}

    result = []
    for b in budgets:
        cat = b["category"]
        spent = spent_map.get(cat, 0.0)
        limit = b["monthly_limit"]
        pct = round((spent / max(1.0, limit)) * 100, 1)
        result.append({
            "id": b["id"],
            "category": cat,
            "monthly_limit": limit,
            "spent": round(spent, 2),
            "remaining": round(max(0.0, limit - spent), 2),
            "percentage": pct,
            "is_exceeded": spent > limit,
            "icon": b["icon"],
            "color": b["color"]
        })

    return result

@router.post("/budgets")
def set_budget(budget: BudgetCreate):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO budgets (category, monthly_limit, icon, color)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(category) DO UPDATE SET
                monthly_limit = excluded.monthly_limit,
                icon = excluded.icon,
                color = excluded.color
        """, (budget.category, budget.monthly_limit, budget.icon, budget.color))
        return {"message": f"Budget for {budget.category} saved successfully"}

@router.get("/bills")
def get_bills():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM bills ORDER BY due_date ASC")
        return [dict(r) for r in cursor.fetchall()]

@router.post("/bills")
def create_bill(bill: BillCreate):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO bills (title, amount, due_date, category, app, status, recurring)
            VALUES (?, ?, ?, ?, ?, 'unpaid', ?)
        """, (bill.title, bill.amount, bill.due_date, bill.category, bill.app, bill.recurring))
        return {"message": "Bill reminder created successfully", "id": cursor.lastrowid}

@router.put("/bills/{bill_id}/pay")
def pay_bill(bill_id: int):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM bills WHERE id = ?", (bill_id,))
        bill = cursor.fetchone()
        if not bill:
            raise HTTPException(status_code=404, detail="Bill not found")

        cursor.execute("UPDATE bills SET status = 'paid' WHERE id = ?", (bill_id,))
        
        # Also auto-record the payment in transactions table
        now = datetime.now()
        cursor.execute("""
            INSERT INTO transactions (
                amount, merchant, category, subcategory, app, date, time, 
                type, status, necessity, risk_score, risk_level, risk_reason, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'debit', 'completed', 'Need', 0, 'LOW', 'Scheduled bill payment cleared', ?)
        """, (
            bill["amount"], bill["title"], bill["category"], "Utility Bill", bill["app"],
            now.strftime("%Y-%m-%d"), now.strftime("%H:%M"), f"Paid via {bill['app']} bill reminder"
        ))

        return {"message": "Bill marked as paid and transaction recorded"}

@router.get("/settings")
def get_settings():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT monthly_income, monthly_budget, savings_goal, currency, privacy_mode FROM user_settings WHERE id = 1")
        row = cursor.fetchone()
        return dict(row) if row else {}

@router.put("/settings")
def update_settings(settings: UserSettingsModel):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE user_settings SET
                monthly_income = ?,
                monthly_budget = ?,
                savings_goal = ?,
                currency = ?,
                privacy_mode = ?
            WHERE id = 1
        """, (settings.monthly_income, settings.monthly_budget, settings.savings_goal, settings.currency, settings.privacy_mode))
        return {"message": "Settings updated successfully"}
