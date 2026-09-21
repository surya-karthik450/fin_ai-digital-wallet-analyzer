from typing import List, Dict, Any

def generate_financial_insights(
    transactions: List[Dict[str, Any]],
    monthly_budget: float = 48000.0,
    savings_goal: float = 12000.0
) -> Dict[str, Any]:
    """
    Generates personalized AI financial recommendations and habit insights.
    """
    if not transactions:
        return {
            "insights": ["Start adding digital wallet payments to unlock AI recommendations."],
            "needs_ratio": 50,
            "wants_ratio": 30,
            "investments_ratio": 20,
            "subscription_count": 0,
            "subscription_total": 0.0,
            "top_category": "None",
            "top_wallet_app": "None"
        }

    total_debit = 0.0
    category_totals: Dict[str, float] = {}
    app_totals: Dict[str, float] = {}
    necessity_totals = {"Need": 0.0, "Want": 0.0, "Investment": 0.0}
    subscriptions = []

    for tx in transactions:
        if tx.get("type", "debit") != "debit":
            continue
        amt = float(tx.get("amount", 0))
        total_debit += amt

        cat = tx.get("category", "Miscellaneous")
        category_totals[cat] = category_totals.get(cat, 0.0) + amt

        app = tx.get("app", "Google Pay")
        app_totals[app] = app_totals.get(app, 0.0) + amt

        nec = tx.get("necessity", "Need")
        if nec in necessity_totals:
            necessity_totals[nec] += amt
        else:
            necessity_totals["Want"] += amt

        # Detect subscriptions
        if cat in ["Entertainment & OTT", "Utilities & Bills"] and tx.get("subcategory") == "Digital Subscriptions":
            subscriptions.append(tx)

    # Ratios
    needs_pct = round((necessity_totals["Need"] / total_debit * 100), 1) if total_debit > 0 else 50.0
    wants_pct = round((necessity_totals["Want"] / total_debit * 100), 1) if total_debit > 0 else 30.0
    inv_pct = round((necessity_totals["Investment"] / total_debit * 100), 1) if total_debit > 0 else 20.0

    top_cat = max(category_totals.items(), key=lambda x: x[1])[0] if category_totals else "None"
    top_app = max(app_totals.items(), key=lambda x: x[1])[0] if app_totals else "None"

    # Actionable AI insights list
    insights = []

    # 50-30-20 rule check
    if wants_pct > 35:
        insights.append(
            f"⚠️ Discretionary Spending Alert: {wants_pct}% of your wallet payments are on 'Wants' (recommended limit is 30%). Reducing dining and online impulse shopping could save ₹{(necessity_totals['Want'] - (total_debit * 0.30)):,.0f} this month."
        )
    else:
        insights.append(
            f"✅ Great balance! Your discretionary spend is healthy at {wants_pct}%, adhering well to the 50-30-20 rule."
        )

    # Top App concentration
    if top_app and total_debit > 0:
        top_app_share = round(app_totals[top_app] / total_debit * 100, 1)
        insights.append(
            f"📱 Wallet Preference: You spend {top_app_share}% of all money through {top_app}. Consider checking {top_app} rewards, UPI cashback, and transaction statements."
        )

    # Subscriptions audit
    sub_total = sum(s.get("amount", 0) for s in subscriptions)
    if sub_total > 1000:
        insights.append(
            f"🔄 Subscription Audit: You have recurring digital subscriptions totaling ₹{sub_total:,.0f}/month. Review unused OTT/music accounts to unlock quick savings."
        )

    # Top Category insight
    if top_cat != "None" and category_totals[top_cat] > (total_debit * 0.30):
        insights.append(
            f"📊 Spending Concentration: '{top_cat}' is your highest expense area, accounting for ₹{category_totals[top_cat]:,.0f} ({round(category_totals[top_cat]/total_debit*100, 1)}% of total spend)."
        )

    return {
        "insights": insights,
        "needs_ratio": needs_pct,
        "wants_ratio": wants_pct,
        "investments_ratio": inv_pct,
        "subscription_count": len(subscriptions),
        "subscription_total": round(sub_total, 2),
        "top_category": top_cat,
        "top_wallet_app": top_app,
        "total_spend": round(total_debit, 2)
    }
