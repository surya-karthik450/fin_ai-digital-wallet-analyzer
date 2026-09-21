from fastapi import APIRouter
from typing import Dict, Any, Optional
from datetime import datetime

from ..database import get_db
from ..models import MonthEndForecastRequest, MonthEndForecastResponse
from ..services.forecast_calculator import compute_month_end_forecast

router = APIRouter(prefix="/api/forecasting", tags=["Forecasting"])

@router.get("/month-end", response_model=MonthEndForecastResponse)
def get_month_end_projection():
    with get_db() as conn:
        cursor = conn.cursor()
        
        # User settings
        cursor.execute("SELECT monthly_budget, savings_goal FROM user_settings WHERE id = 1")
        settings_row = cursor.fetchone()
        budget = settings_row["monthly_budget"] if settings_row else 48000.0
        savings = settings_row["savings_goal"] if settings_row else 12000.0

        # Fetch current month transactions
        now = datetime.now()
        cursor.execute("SELECT * FROM transactions WHERE date LIKE ? AND type = 'debit'", (f"{now.year:04d}-{now.month:02d}%",))
        transactions = [dict(r) for r in cursor.fetchall()]

    forecast = compute_month_end_forecast(
        transactions=transactions,
        monthly_budget=budget,
        savings_goal=savings,
        ref_date=now,
        simulated_additional_spending=0.0
    )
    return forecast

@router.post("/simulate", response_model=MonthEndForecastResponse)
def simulate_forecast(request: MonthEndForecastRequest):
    now = datetime.now()
    
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT monthly_budget, savings_goal FROM user_settings WHERE id = 1")
        settings_row = cursor.fetchone()
        
        budget = request.monthly_budget if request.monthly_budget is not None else (settings_row["monthly_budget"] if settings_row else 48000.0)
        savings = request.savings_goal if request.savings_goal is not None else (settings_row["savings_goal"] if settings_row else 12000.0)

        cursor.execute("SELECT * FROM transactions WHERE date LIKE ? AND type = 'debit'", (f"{now.year:04d}-{now.month:02d}%",))
        transactions = [dict(r) for r in cursor.fetchall()]

    forecast = compute_month_end_forecast(
        transactions=transactions,
        monthly_budget=budget,
        savings_goal=savings,
        ref_date=now,
        simulated_additional_spending=request.simulated_additional_spending or 0.0
    )
    return forecast
