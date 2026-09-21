import pytest
from datetime import datetime
from fastapi.testclient import TestClient

from app.main import app
from app.database import init_db, get_db
from app.seed_data import populate_seed_data
from app.services.ai_categorizer import auto_segregate, normalize_wallet_app
from app.services.ai_fraud_detector import evaluate_fraud_risk
from app.services.voice_parser import parse_voice_command
from app.services.forecast_calculator import compute_month_end_forecast

@pytest.fixture(scope="session", autouse=True)
def setup_database():
    init_db()
    with get_db() as conn:
        populate_seed_data(conn)

def test_auto_segregation_categories():
    """Verify intelligent category & necessity classification."""
    r1 = auto_segregate("Swiggy Gourmet Delivery", "Late dinner", 420.0)
    assert r1["category"] == "Food & Dining"
    assert r1["necessity"] == "Want"

    r2 = auto_segregate("Blinkit Express", "Milk and bread", 180.0)
    assert r2["category"] == "Groceries & Supermarket"
    assert r2["necessity"] == "Need"

    r3 = auto_segregate("BESCOM Bangalore Electricity", "Monthly bill", 2150.0)
    assert r3["category"] == "Utilities & Bills"
    assert r3["necessity"] == "Need"

    r4 = auto_segregate("Uber Ride", "Office commute", 310.0)
    assert r4["category"] == "Travel & Commute"
    assert r4["necessity"] == "Need"

    r5 = auto_segregate("Netflix Monthly", "Family plan", 499.0)
    assert r5["category"] == "Entertainment & OTT"
    assert r5["necessity"] == "Want"

    r6 = auto_segregate("Landlord Apartment Rent", "House rent", 18000.0)
    assert r6["subcategory"] == "House Rent"
    assert r6["necessity"] == "Need"

def test_normalize_wallet_app():
    """Verify wallet app normalization."""
    assert normalize_wallet_app("gpay") == "Google Pay"
    assert normalize_wallet_app("phonepe") == "PhonePe"
    assert normalize_wallet_app("paytm") == "Paytm"
    assert normalize_wallet_app("amazon pay") == "Amazon Pay"
    assert normalize_wallet_app("applepay") == "Apple Pay"

def test_fraud_and_anomaly_detection():
    """Verify anomaly detection, risk scoring, and off-hours check."""
    # Routine small transaction in normal hours
    normal = evaluate_fraud_risk(250.0, "Starbucks", "14:30", "Food & Dining")
    assert normal["risk_level"] == "LOW"
    assert normal["risk_score"] < 30

    # High value spike in late night window (03:15 AM)
    suspicious = evaluate_fraud_risk(38000.0, "Overseas Crypto Node", "03:15", "Investments & Savings")
    assert suspicious["risk_level"] == "HIGH"
    assert suspicious["risk_score"] >= 60
    assert "Off-hours" in suspicious["risk_reason"]
    assert "crypto" in suspicious["risk_reason"].lower()

def test_voice_command_parser():
    """Verify spoken payment parsing and entity extraction."""
    cmd = "Paid 450 rupees for coffee at Starbucks using Google Pay"
    parsed = parse_voice_command(cmd, current_safe_spend=850.0, total_spent=15200.0)
    assert parsed["intent"] == "LOG_PAYMENT"
    assert parsed["success"] is True
    tx = parsed["parsed_transaction"]
    assert tx["amount"] == 450.0
    assert tx["app"] == "Google Pay"
    assert tx["category"] == "Food & Dining"
    assert "Starbucks" in tx["merchant"]

    # Test query intent
    query_cmd = "What is my safe spending limit today?"
    parsed_query = parse_voice_command(query_cmd, current_safe_spend=920.0, total_spent=14000.0)
    assert parsed_query["intent"] == "QUERY_SAFE_SPEND"
    assert "920" in parsed_query["speech_response"]

def test_forecast_calculation_and_what_if():
    """Verify burn rate projection and safe-to-spend calculation."""
    test_date = datetime(2026, 9, 10, 12, 0)
    transactions = [
        {"date": "2026-09-01", "amount": 2000.0, "type": "debit"},
        {"date": "2026-09-03", "amount": 3000.0, "type": "debit"},
        {"date": "2026-09-07", "amount": 2500.0, "type": "debit"},
        {"date": "2026-09-10", "amount": 2500.0, "type": "debit"}
    ]
    forecast = compute_month_end_forecast(
        transactions=transactions,
        monthly_budget=40000.0,
        savings_goal=10000.0,
        ref_date=test_date,
        simulated_additional_spending=2000.0
    )

    assert forecast["total_spent_so_far"] == 10000.0
    assert forecast["days_elapsed"] == 10
    assert forecast["daily_burn_rate"] == 1000.0
    assert forecast["projected_month_end_spend"] == 30000.0
    assert forecast["projected_balance"] == 10000.0
    assert forecast["safe_daily_spend_remaining"] == 1000.0
    assert forecast["simulated_impact"] is not None
    assert forecast["simulated_impact"]["additional_spend"] == 2000.0
    assert forecast["simulated_impact"]["new_safe_daily_spend"] == 900.0

def test_api_health_and_endpoints():
    """Verify live FastAPI router endpoints."""
    with TestClient(app) as client:
        # Health check
        res = client.get("/api/health")
        assert res.status_code == 200
        assert res.json()["status"] == "healthy"

        # Transactions list
        res = client.get("/api/transactions")
        assert res.status_code == 200
        data = res.json()
        assert isinstance(data, list)
        assert len(data) > 0

        # App segregation breakdown
        res = client.get("/api/analytics/by-app")
        assert res.status_code == 200
        app_data = res.json()
        assert "apps" in app_data
        assert len(app_data["apps"]) > 0

        # Month end forecasting
        res = client.get("/api/forecasting/month-end")
        assert res.status_code == 200
        fc = res.json()
        assert "safe_daily_spend_remaining" in fc
        assert "daily_burn_rate" in fc
