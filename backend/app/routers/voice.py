from fastapi import APIRouter
from typing import Dict, Any
from datetime import datetime

from ..database import get_db
from ..models import VoiceCommandRequest, VoiceCommandResponse, TransactionCreate, TransactionResponse
from ..services.voice_parser import parse_voice_command
from ..services.forecast_calculator import compute_month_end_forecast
from .transactions import create_transaction

router = APIRouter(prefix="/api/voice", tags=["Voice AI"])

@router.post("/process", response_model=VoiceCommandResponse)
def process_voice_command(request: VoiceCommandRequest):
    now = datetime.now()

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT monthly_budget, savings_goal FROM user_settings WHERE id = 1")
        settings = cursor.fetchone()
        budget = settings["monthly_budget"] if settings else 48000.0
        savings = settings["savings_goal"] if settings else 12000.0

        cursor.execute("SELECT * FROM transactions WHERE date LIKE ? AND type = 'debit'", (f"{now.year:04d}-{now.month:02d}%",))
        transactions = [dict(r) for r in cursor.fetchall()]

        cursor.execute("SELECT COUNT(*) FROM transactions WHERE risk_level = 'HIGH' AND is_dismissed = 0")
        high_risk_count = cursor.fetchone()[0]

    forecast = compute_month_end_forecast(transactions, budget, savings, now)
    safe_spend = forecast["safe_daily_spend_remaining"]
    total_spent = forecast["total_spent_so_far"]

    result = parse_voice_command(
        transcript=request.command, 
        current_safe_spend=safe_spend, 
        total_spent=total_spent,
        monthly_budget=budget,
        high_risk_count=high_risk_count
    )
    return result

@router.post("/confirm-payment", response_model=TransactionResponse)
def confirm_voice_payment(tx_data: TransactionCreate):
    return create_transaction(tx_data)
