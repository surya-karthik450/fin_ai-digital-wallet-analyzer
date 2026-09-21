from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class TransactionBase(BaseModel):
    amount: float = Field(..., gt=0, description="Transaction amount in currency")
    merchant: str = Field(..., min_length=1, description="Merchant or payee name")
    category: Optional[str] = Field(None, description="Category (auto-segregated if omitted)")
    subcategory: Optional[str] = Field("", description="Specific item or subcategory")
    app: str = Field(..., description="Digital wallet app (e.g. Google Pay, PhonePe, Paytm)")
    date: Optional[str] = Field(None, description="Date in YYYY-MM-DD format")
    time: Optional[str] = Field(None, description="Time in HH:MM format")
    type: Optional[str] = Field("debit", description="debit or credit")
    necessity: Optional[str] = Field(None, description="Need, Want, or Investment")
    notes: Optional[str] = Field("", description="Optional user note or description")

class TransactionCreate(TransactionBase):
    pass

class TransactionUpdate(BaseModel):
    amount: Optional[float] = None
    merchant: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    app: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    type: Optional[str] = None
    necessity: Optional[str] = None
    notes: Optional[str] = None
    is_dismissed: Optional[int] = None

class TransactionResponse(TransactionBase):
    id: int
    status: str
    risk_score: int
    risk_level: str
    risk_reason: str
    is_dismissed: int
    created_at: str

class VoiceCommandRequest(BaseModel):
    command: str = Field(..., min_length=1, description="Raw speech text transcribed from voice input")

class VoiceCommandResponse(BaseModel):
    intent: str
    parsed_transaction: Optional[Dict[str, Any]] = None
    speech_response: str
    success: bool
    suggestions: List[str] = []

class MonthEndForecastRequest(BaseModel):
    monthly_budget: Optional[float] = None
    savings_goal: Optional[float] = None
    current_day: Optional[int] = None
    simulated_additional_spending: Optional[float] = 0.0

class DaySpend(BaseModel):
    day: int
    date: str
    amount: float
    is_future: bool

class MonthEndForecastResponse(BaseModel):
    month_name: str
    total_days: int
    days_elapsed: int
    days_remaining: int
    monthly_budget: float
    savings_goal: float
    total_spent_so_far: float
    daily_burn_rate: float
    projected_month_end_spend: float
    projected_balance: float
    safe_daily_spend_remaining: float
    health_status: str # "ON_TRACK", "CAUTION", "OVER_BUDGET"
    status_message: str
    daily_breakdown: List[DaySpend]
    simulated_impact: Optional[Dict[str, Any]] = None

class UserSettingsModel(BaseModel):
    monthly_income: float
    monthly_budget: float
    savings_goal: float
    currency: str
    privacy_mode: int

class BudgetCreate(BaseModel):
    category: str
    monthly_limit: float
    icon: Optional[str] = "tag"
    color: Optional[str] = "#6366f1"

class BillCreate(BaseModel):
    title: str
    amount: float
    due_date: str
    category: str
    app: str
    recurring: Optional[str] = "monthly"
