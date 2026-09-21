import calendar
from datetime import datetime
from typing import List, Dict, Any, Optional

def compute_month_end_forecast(
    transactions: List[Dict[str, Any]],
    monthly_budget: float = 48000.0,
    savings_goal: float = 12000.0,
    ref_date: Optional[datetime] = None,
    simulated_additional_spending: float = 0.0
) -> Dict[str, Any]:
    """
    Computes daily burn rate, projected month-end total spend, surplus/deficit, 
    and safe daily spending limit for the remaining days of the month based on 
    actual payments done on present and previous days.
    """
    now = ref_date or datetime.now()
    year = now.year
    month = now.month
    current_day = now.day

    # Days in current month
    _, total_days_in_month = calendar.monthrange(year, month)
    month_name = now.strftime("%B %Y")

    # Group actual debit spending by day of the current month
    daily_totals: Dict[int, float] = {d: 0.0 for d in range(1, total_days_in_month + 1)}
    
    current_month_str = f"{year:04d}-{month:02d}"
    total_spent_so_far = 0.0

    for tx in transactions:
        tx_date = tx.get("date", "")
        tx_type = tx.get("type", "debit")
        if tx_type != "debit":
            continue

        if tx_date.startswith(current_month_str):
            try:
                day_num = int(tx_date.split("-")[2])
                amt = float(tx.get("amount", 0.0))
                if 1 <= day_num <= total_days_in_month:
                    daily_totals[day_num] += amt
                    if day_num <= current_day:
                        total_spent_so_far += amt
            except (ValueError, IndexError):
                continue

    # Calculation of days elapsed and remaining
    days_elapsed = max(1, current_day)
    days_remaining = max(1, total_days_in_month - current_day)

    # Daily burn rate based on payments done on present and other days
    daily_burn_rate = total_spent_so_far / days_elapsed

    # Projected total spend at month end
    projected_month_end_spend = total_spent_so_far + (daily_burn_rate * days_remaining)
    projected_balance = monthly_budget - projected_month_end_spend

    # Safe daily spending limit for remaining days:
    # How much can be spent per day without exceeding (monthly_budget - savings_goal)
    disposable_budget = max(0.0, monthly_budget - savings_goal)
    remaining_disposable = disposable_budget - total_spent_so_far
    safe_daily_spend_remaining = max(0.0, remaining_disposable / days_remaining)

    # Health status evaluation
    if projected_month_end_spend > monthly_budget:
        health_status = "OVER_BUDGET"
        status_message = (
            f"At your current burn rate of ₹{daily_burn_rate:,.0f}/day, you are projected to exceed your "
            f"budget by ₹{(projected_month_end_spend - monthly_budget):,.0f} by month-end."
        )
    elif projected_month_end_spend > (monthly_budget * 0.88):
        health_status = "CAUTION"
        status_message = (
            f"Spending is high. You have ₹{remaining_disposable:,.0f} left for the remaining {days_remaining} days. "
            f"Cap spending to ₹{safe_daily_spend_remaining:,.0f}/day to meet your savings target."
        )
    else:
        health_status = "ON_TRACK"
        status_message = (
            f"Excellent pace! You are spending within limits. You can safely spend up to "
            f"₹{safe_daily_spend_remaining:,.0f}/day for the remaining {days_remaining} days of {now.strftime('%B')}."
        )

    # Daily breakdown for chart/calendar
    daily_breakdown = []
    for d in range(1, total_days_in_month + 1):
        d_str = f"{year:04d}-{month:02d}-{d:02d}"
        is_future = d > current_day
        daily_breakdown.append({
            "day": d,
            "date": d_str,
            "amount": round(daily_totals[d], 2),
            "is_future": is_future,
            "projected_safe": round(safe_daily_spend_remaining, 2) if is_future else None
        })

    # What-If Simulation
    simulated_impact = None
    if simulated_additional_spending > 0:
        sim_spent = total_spent_so_far + simulated_additional_spending
        sim_remaining_disposable = disposable_budget - sim_spent
        sim_safe_daily = max(0.0, sim_remaining_disposable / days_remaining)
        sim_projected_spend = projected_month_end_spend + simulated_additional_spending
        sim_projected_balance = monthly_budget - sim_projected_spend
        daily_reduction = safe_daily_spend_remaining - sim_safe_daily

        simulated_impact = {
            "additional_spend": simulated_additional_spending,
            "new_safe_daily_spend": round(sim_safe_daily, 2),
            "daily_safe_spend_reduction": round(daily_reduction, 2),
            "new_projected_spend": round(sim_projected_spend, 2),
            "new_projected_balance": round(sim_projected_balance, 2),
            "verdict": "Within Safe Limits" if sim_safe_daily > 200 else "Critical Impact: Will Drain Budget"
        }

    return {
        "month_name": month_name,
        "total_days": total_days_in_month,
        "days_elapsed": days_elapsed,
        "days_remaining": days_remaining,
        "monthly_budget": round(monthly_budget, 2),
        "savings_goal": round(savings_goal, 2),
        "total_spent_so_far": round(total_spent_so_far, 2),
        "daily_burn_rate": round(daily_burn_rate, 2),
        "projected_month_end_spend": round(projected_month_end_spend, 2),
        "projected_balance": round(projected_balance, 2),
        "safe_daily_spend_remaining": round(safe_daily_spend_remaining, 2),
        "health_status": health_status,
        "status_message": status_message,
        "daily_breakdown": daily_breakdown,
        "simulated_impact": simulated_impact
    }
