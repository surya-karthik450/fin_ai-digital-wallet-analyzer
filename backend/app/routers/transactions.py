from fastapi import APIRouter, HTTPException, Query, Response
from typing import Optional, List, Dict, Any
from datetime import datetime
import csv
import io

from ..database import get_db, init_db
from ..models import TransactionCreate, TransactionUpdate, TransactionResponse
from ..services.ai_categorizer import auto_segregate, normalize_wallet_app
from ..services.ai_fraud_detector import evaluate_fraud_risk
from ..seed_data import populate_seed_data

router = APIRouter(prefix="/api/transactions", tags=["Transactions"])

@router.get("", response_model=List[TransactionResponse])
def get_transactions(
    app: Optional[str] = None,
    category: Optional[str] = None,
    risk_level: Optional[str] = None,
    search: Optional[str] = None,
    necessity: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0)
):
    query = "SELECT * FROM transactions WHERE 1=1"
    params = []

    if app and app != "All":
        query += " AND app = ?"
        params.append(app)
    if category and category != "All":
        query += " AND category = ?"
        params.append(category)
    if risk_level and risk_level != "All":
        query += " AND risk_level = ?"
        params.append(risk_level)
    if necessity and necessity != "All":
        query += " AND necessity = ?"
        params.append(necessity)
    if search:
        query += " AND (merchant LIKE ? OR notes LIKE ? OR subcategory LIKE ?)"
        like_term = f"%{search}%"
        params.extend([like_term, like_term, like_term])

    query += " ORDER BY date DESC, time DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(query, params)
        rows = cursor.fetchall()
        return [dict(row) for row in rows]

@router.post("", response_model=TransactionResponse)
def create_transaction(tx_in: TransactionCreate):
    normalized_app = normalize_wallet_app(tx_in.app)
    
    # Auto-segregate if category or necessity is omitted
    auto_data = auto_segregate(tx_in.merchant, tx_in.notes or "", tx_in.amount)
    category = tx_in.category or auto_data["category"]
    subcategory = tx_in.subcategory or auto_data["subcategory"]
    necessity = tx_in.necessity or auto_data["necessity"]

    now = datetime.now()
    tx_date = tx_in.date or now.strftime("%Y-%m-%d")
    tx_time = tx_in.time or now.strftime("%H:%M")

    # Fetch recent transactions for velocity checking
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT merchant, amount, date, time FROM transactions ORDER BY id DESC LIMIT 5")
        recent = [dict(r) for r in cursor.fetchall()]

        # Evaluate risk
        risk = evaluate_fraud_risk(tx_in.amount, tx_in.merchant, tx_time, category, recent)
        status = "flagged" if risk["risk_level"] == "HIGH" else "completed"

        cursor.execute("""
            INSERT INTO transactions (
                amount, merchant, category, subcategory, app, date, time, 
                type, status, necessity, risk_score, risk_level, risk_reason, is_dismissed, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
        """, (
            tx_in.amount, tx_in.merchant, category, subcategory, normalized_app,
            tx_date, tx_time, tx_in.type or "debit", status, necessity,
            risk["risk_score"], risk["risk_level"], risk["risk_reason"], tx_in.notes or ""
        ))
        tx_id = cursor.lastrowid
        cursor.execute("SELECT * FROM transactions WHERE id = ?", (tx_id,))
        created = cursor.fetchone()
        return dict(created)

@router.put("/{tx_id}", response_model=TransactionResponse)
def update_transaction(tx_id: int, tx_update: TransactionUpdate):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM transactions WHERE id = ?", (tx_id,))
        existing = cursor.fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Transaction not found")

        updates = []
        params = []
        for field, value in tx_update.model_dump(exclude_unset=True).items():
            updates.append(f"{field} = ?")
            params.append(value)

        if not updates:
            return dict(existing)

        params.append(tx_id)
        cursor.execute(f"UPDATE transactions SET {', '.join(updates)} WHERE id = ?", params)
        cursor.execute("SELECT * FROM transactions WHERE id = ?", (tx_id,))
        return dict(cursor.fetchone())

@router.delete("/{tx_id}")
def delete_transaction(tx_id: int):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM transactions WHERE id = ?", (tx_id,))
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Transaction not found")
        return {"message": "Transaction deleted successfully"}

@router.post("/reset-seed")
def reset_seed_data():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM transactions")
        cursor.execute("DELETE FROM sqlite_sequence WHERE name = 'transactions'")
        populate_seed_data(conn)
        return {"message": "Seed data reset with rich transactions successfully"}

@router.get("/export")
def export_transactions_csv():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, date, time, merchant, category, subcategory, app, amount, type, necessity, risk_level, notes FROM transactions ORDER BY date DESC, time DESC")
        rows = cursor.fetchall()
        
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["ID", "Date", "Time", "Merchant", "Category", "Subcategory", "Digital Wallet App", "Amount (INR)", "Type", "Necessity", "Risk Level", "Notes"])
        for r in rows:
            writer.writerow(list(r))
            
        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=wallet_transactions_export.csv"}
        )
