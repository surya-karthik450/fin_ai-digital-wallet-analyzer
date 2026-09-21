from fastapi import APIRouter
from typing import Dict, Any, List
from datetime import datetime

from ..database import get_db
from ..services.insights_generator import generate_financial_insights

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("/overview")
def get_analytics_overview():
    now = datetime.now()
    current_month_prefix = f"{now.year:04d}-{now.month:02d}"

    with get_db() as conn:
        cursor = conn.cursor()
        
        # User settings
        cursor.execute("SELECT monthly_income, monthly_budget, savings_goal, currency, privacy_mode FROM user_settings WHERE id = 1")
        settings_row = cursor.fetchone()
        settings = dict(settings_row) if settings_row else {
            "monthly_income": 65000.0, "monthly_budget": 48000.0, "savings_goal": 17000.0, "currency": "₹", "privacy_mode": 0
        }

        # Fetch all transactions for this month
        cursor.execute("""
            SELECT * FROM transactions 
            WHERE date LIKE ? 
            ORDER BY date ASC, time ASC
        """, (f"{current_month_prefix}%",))
        tx_rows = [dict(r) for r in cursor.fetchall()]

        # Compute summary stats
        total_spent = sum(t["amount"] for t in tx_rows if t["type"] == "debit")
        total_credited = sum(t["amount"] for t in tx_rows if t["type"] == "credit")
        total_transactions = len(tx_rows)
        avg_transaction = round(total_spent / max(1, len([t for t in tx_rows if t['type'] == 'debit'])), 2)
        
        # High risk count
        high_risk_count = len([t for t in tx_rows if t["risk_level"] == "HIGH" and not t["is_dismissed"]])

        # Category Breakdown
        cat_map: Dict[str, float] = {}
        for t in tx_rows:
            if t["type"] == "debit":
                cat = t["category"]
                cat_map[cat] = cat_map.get(cat, 0.0) + t["amount"]

        category_breakdown = [
            {"category": k, "amount": round(v, 2), "percentage": round(v / max(1.0, total_spent) * 100, 1)}
            for k, v in sorted(cat_map.items(), key=lambda x: x[1], reverse=True)
        ]

        # App Breakdown
        app_map: Dict[str, Dict[str, Any]] = {}
        for t in tx_rows:
            if t["type"] == "debit":
                app = t["app"]
                if app not in app_map:
                    app_map[app] = {"app": app, "total": 0.0, "count": 0}
                app_map[app]["total"] += t["amount"]
                app_map[app]["count"] += 1

        app_breakdown = [
            {
                "app": k,
                "amount": round(v["total"], 2),
                "count": v["count"],
                "avg_amount": round(v["total"] / max(1, v["count"]), 2),
                "percentage": round(v["total"] / max(1.0, total_spent) * 100, 1)
            }
            for k, v in sorted(app_map.items(), key=lambda x: x[1]["total"], reverse=True)
        ]

        # Daily Spend Trend
        day_map: Dict[int, float] = {}
        for t in tx_rows:
            if t["type"] == "debit":
                day_num = int(t["date"].split("-")[2])
                day_map[day_num] = day_map.get(day_num, 0.0) + t["amount"]

        daily_trend = [
            {"day": d, "amount": round(day_map.get(d, 0.0), 2)}
            for d in range(1, now.day + 1)
        ]

        # Insights
        insights_data = generate_financial_insights(tx_rows, settings["monthly_budget"], settings["savings_goal"])

        return {
            "month_name": now.strftime("%B %Y"),
            "settings": settings,
            "total_spent": round(total_spent, 2),
            "total_credited": round(total_credited, 2),
            "total_transactions": total_transactions,
            "avg_transaction": avg_transaction,
            "high_risk_count": high_risk_count,
            "category_breakdown": category_breakdown,
            "app_breakdown": app_breakdown,
            "daily_trend": daily_trend,
            "insights": insights_data
        }

@router.get("/by-app")
def get_app_segregation_details():
    """
    Dedicated analytics for segregating payments based on digital wallet app
    (Google Pay, PhonePe, Paytm, Amazon Pay, Apple Pay, Cred, etc.)
    """
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM transactions WHERE type = 'debit' ORDER BY date DESC")
        tx_rows = [dict(r) for r in cursor.fetchall()]

    apps_data: Dict[str, Dict[str, Any]] = {}
    total_spend_all = sum(t["amount"] for t in tx_rows) or 1.0

    for t in tx_rows:
        app = t["app"]
        if app not in apps_data:
            apps_data[app] = {
                "app_name": app,
                "total_spend": 0.0,
                "transaction_count": 0,
                "categories": {},
                "top_merchant": None,
                "merchants": {},
                "recent_transactions": []
            }

        app_info = apps_data[app]
        amt = t["amount"]
        app_info["total_spend"] += amt
        app_info["transaction_count"] += 1

        cat = t["category"]
        app_info["categories"][cat] = app_info["categories"].get(cat, 0.0) + amt

        merch = t["merchant"]
        app_info["merchants"][merch] = app_info["merchants"].get(merch, 0.0) + amt

        if len(app_info["recent_transactions"]) < 5:
            app_info["recent_transactions"].append(t)

    # Compile result list with computed percentages and top merchants
    result = []
    for app_name, data in apps_data.items():
        top_merch = max(data["merchants"].items(), key=lambda x: x[1])[0] if data["merchants"] else "N/A"
        cat_list = [
            {"category": c, "amount": round(a, 2)}
            for c, a in sorted(data["categories"].items(), key=lambda x: x[1], reverse=True)
        ]
        result.append({
            "app_name": app_name,
            "total_spend": round(data["total_spend"], 2),
            "share_percentage": round((data["total_spend"] / total_spend_all) * 100, 1),
            "transaction_count": data["transaction_count"],
            "avg_transaction_size": round(data["total_spend"] / max(1, data["transaction_count"]), 2),
            "top_merchant": top_merch,
            "category_distribution": cat_list,
            "recent_transactions": data["recent_transactions"]
        })

    result.sort(key=lambda x: x["total_spend"], reverse=True)
    return {
        "total_wallet_spend": round(total_spend_all, 2),
        "total_apps_used": len(result),
        "apps": result
    }
