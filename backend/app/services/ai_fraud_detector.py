from typing import Dict, Any, List, Optional
from datetime import datetime

def evaluate_fraud_risk(
    amount: float,
    merchant: str,
    time_str: str,
    category: str,
    recent_transactions: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Evaluates suspicious patterns, velocity anomalies, and financial risk score (0 - 100).
    Returns risk_score, risk_level ('LOW', 'MEDIUM', 'HIGH'), and human-readable risk_reason.
    """
    score = 0
    reasons = []

    # 1. Unusual Amount Check
    if amount >= 25000:
        score += 45
        reasons.append(f"High-value spike of ₹{amount:,.0f} requires verification")
    elif amount >= 10000:
        score += 20
        reasons.append(f"Substantial transaction amount (₹{amount:,.0f})")

    # 2. Time-based Anomaly (Off-hours / Late night between 01:00 AM and 05:00 AM)
    hour = 12
    if time_str:
        try:
            hour = int(time_str.split(":")[0])
        except Exception:
            hour = 12

    if 1 <= hour <= 4:
        if amount > 1500:
            score += 35
            reasons.append(f"Off-hours transaction recorded at {time_str} (unusual active window)")
        else:
            score += 15
            reasons.append(f"Late-night activity at {time_str}")

    # 3. Category & Merchant Specific Flags
    merchant_lower = merchant.lower()
    suspicious_keywords = ["crypto", "casino", "betting", "forex", "unknown", "overseas", "lottery"]
    for word in suspicious_keywords:
        if word in merchant_lower:
            score += 50
            reasons.append(f"Flagged merchant keyword detected: '{word}'")
            break

    # 4. Rapid Velocity Check (if recent transactions provided)
    if recent_transactions:
        # Check for rapid identical charges or high frequency within short window
        identical_charges = 0
        for tx in recent_transactions[:5]:
            if tx.get("merchant", "").lower() == merchant_lower and abs(tx.get("amount", 0) - amount) < 1.0:
                identical_charges += 1
        
        if identical_charges >= 2:
            score += 40
            reasons.append("Potential duplicate charge detected: multiple identical transactions")

    # Determine risk level
    score = min(100, score)
    if score >= 60:
        level = "HIGH"
    elif score >= 30:
        level = "MEDIUM"
    else:
        level = "LOW"

    reason_str = " • ".join(reasons) if reasons else "Normal transaction pattern"

    return {
        "risk_score": score,
        "risk_level": level,
        "risk_reason": reason_str
    }
