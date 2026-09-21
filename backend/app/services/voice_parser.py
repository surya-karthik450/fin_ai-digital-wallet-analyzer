import re
from datetime import datetime
from typing import Dict, Any, Optional, List
from .ai_categorizer import auto_segregate, normalize_wallet_app
from .ai_fraud_detector import evaluate_fraud_risk

# Spoken number words mapping
UNITS = {
    "zero": 0, "one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, 
    "seven": 7, "eight": 8, "nine": 9, "ten": 10, "eleven": 11, "twelve": 12, 
    "thirteen": 13, "fourteen": 14, "fifteen": 15, "sixteen": 16, "seventeen": 17, 
    "eighteen": 18, "nineteen": 19
}

TENS = {
    "twenty": 20, "thirty": 30, "forty": 40, "fifty": 50, 
    "sixty": 60, "seventy": 70, "eighty": 80, "ninety": 90
}

MULTIPLIERS = {
    "hundred": 100, 
    "thousand": 1000, 
    "k": 1000,
    "lakh": 100000, 
    "lac": 100000, 
    "crore": 10000000
}

KNOWN_MERCHANTS = [
    "Starbucks", "Swiggy", "Zomato", "Domino's", "McDonald's", "KFC", "Burger King", 
    "Blinkit", "Zepto", "BigBasket", "Instamart", "DMart", "Nature's Basket",
    "Uber", "Ola", "Rapido", "IRCTC", "Metro", "Shell", "HPCL", "BPCL",
    "BESCOM", "Airtel", "Jio", "Vodafone", "Vi", "Indane", "Tata Play", "Dish TV",
    "Amazon", "Flipkart", "Myntra", "Meesho", "Nykaa", "Ajio", "Zara", "Croma",
    "Netflix", "Spotify", "Prime Video", "Hotstar", "YouTube", "BookMyShow", "PVR",
    "Apollo Pharmacy", "1mg", "Medplus", "Cult.fit", "Gym", "Landlord", "Rent"
]

def parse_words_to_number(phrase: str) -> Optional[float]:
    """Converts spoken word sequences like 'four hundred and fifty' into 450.0."""
    tokens = phrase.replace("-", " ").replace(" and ", " ").split()
    if not tokens:
        return None

    total = 0.0
    current = 0.0
    has_number = False

    for token in tokens:
        if token in UNITS:
            current += UNITS[token]
            has_number = True
        elif token in TENS:
            current += TENS[token]
            has_number = True
        elif token == "hundred":
            current = (current if current != 0 else 1) * 100
            has_number = True
        elif token in ["thousand", "k"]:
            current = (current if current != 0 else 1) * 1000
            total += current
            current = 0
            has_number = True
        elif token in ["lakh", "lac"]:
            current = (current if current != 0 else 1) * 100000
            total += current
            current = 0
            has_number = True
        elif token == "crore":
            current = (current if current != 0 else 1) * 10000000
            total += current
            current = 0
            has_number = True
        elif token.isdigit():
            current += float(token)
            has_number = True

    total += current
    return total if has_number and total > 0 else None

def parse_spoken_number(text: str) -> Optional[float]:
    """Tries multiple methods to extract numbers/amounts from text."""
    # 1. Regex check for '5k' or '2.5k'
    k_match = re.search(r'([0-9]+(?:\.[0-9]+)?)\s*k\b', text, re.IGNORECASE)
    if k_match:
        try:
            return float(k_match.group(1)) * 1000.0
        except ValueError:
            pass

    # 2. Regex check for digits like 450, 1,200.50, ₹500, Rs 300
    digits_match = re.search(r'(?:(?:rs\.?|inr|₹|rupees?|bucks)\s*)?([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)', text, re.IGNORECASE)
    if digits_match:
        val_str = digits_match.group(1).replace(",", "")
        try:
            num = float(val_str)
            if num > 0:
                return num
        except ValueError:
            pass

    # 3. Spoken words sequence check
    # Extract contiguous number words
    clean_text = text.lower()
    for symbol in ["₹", "rs.", "rs", "inr", "rupees", "rupee", "bucks"]:
        clean_text = clean_text.replace(symbol, " ")

    words = clean_text.split()
    number_words_pool = set(UNITS.keys()) | set(TENS.keys()) | set(MULTIPLIERS.keys()) | {"and"}

    # Find longest chunk of number words
    current_chunk = []
    best_chunk = []
    for w in words:
        if w in number_words_pool or w.isdigit():
            current_chunk.append(w)
        else:
            if len(current_chunk) > len(best_chunk):
                best_chunk = current_chunk
            current_chunk = []
    if len(current_chunk) > len(best_chunk):
        best_chunk = current_chunk

    if best_chunk:
        num = parse_words_to_number(" ".join(best_chunk))
        if num and num > 0:
            return num

    return None

def extract_merchant(text: str, detected_app: str) -> str:
    """Extracts merchant or payee with prioritised known merchant recognition."""
    text_lower = text.lower()

    # 1. Check known merchants first
    for known in KNOWN_MERCHANTS:
        pattern = r'\b' + re.escape(known.lower().replace("'", "")) + r'\b'
        if re.search(pattern, text_lower.replace("'", "")):
            return known

    # 2. Heuristic extraction
    filtered = text_lower
    # Remove app name
    for app_word in ["google pay", "gpay", "phonepe", "phone pe", "paytm", "amazon pay", "apple pay", "cred", "bhim upi", "bhim"]:
        filtered = filtered.replace(app_word, " ")

    # Remove amount patterns and currency words
    filtered = re.sub(r'(?:(?:rs\.?|inr|₹|rupees?|bucks)\s*)?([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)', ' ', filtered)
    
    # Remove common conversational verbs and filler prepositions
    filler_words = {
        "i", "me", "my", "we", "us", "please", "can", "you", "add", "log", "record", "enter", 
        "paid", "pay", "sent", "spend", "spent", "transfer", "transferred", "bought", "buy", 
        "order", "ordered", "recharge", "bill", "transaction", "debit", "money", "payment", 
        "amount", "rupees", "rupee", "bucks", "using", "via", "through", "on", "for", "at", 
        "to", "a", "an", "the", "in", "of", "with", "from", "just"
    }

    tokens = [t.capitalize() for t in re.findall(r'\b[a-zA-Z]{2,}\b', filtered) if t.lower() not in filler_words]

    if tokens:
        return " ".join(tokens[:3])

    return "General Expense"

def parse_voice_command(
    transcript: str, 
    current_safe_spend: float = 0.0, 
    total_spent: float = 0.0,
    monthly_budget: float = 48000.0,
    high_risk_count: int = 0
) -> Dict[str, Any]:
    """
    Parses conversational voice transcripts into structured financial actions or queries.
    """
    raw = transcript.strip()
    lower = raw.lower()

    # Intent 1: Check safe spend / daily limit
    if any(q in lower for q in ["safe spend", "how much can i spend", "spending limit", "can i spend today", "daily limit", "daily allowance", "safe limit"]):
        return {
            "intent": "QUERY_SAFE_SPEND",
            "parsed_transaction": None,
            "speech_response": f"Your safe daily spending limit is ₹{current_safe_spend:,.0f} for today. Spending within this amount ensures you hit your monthly savings goal.",
            "success": True,
            "suggestions": ["Log a payment", "Show app breakdown", "Show month-end forecast"]
        }

    # Intent 2: Check total spending this month
    if any(q in lower for q in ["total spend", "how much did i spend", "how much have i spent", "month spend", "total expenses", "how much spent"]):
        return {
            "intent": "QUERY_TOTAL_SPEND",
            "parsed_transaction": None,
            "speech_response": f"You have spent ₹{total_spent:,.0f} this month across all your digital wallets.",
            "success": True,
            "suggestions": ["Check safe spend", "View category breakdown"]
        }

    # Intent 3: Budget check
    if any(q in lower for q in ["check budget", "how much budget", "remaining budget", "budget left"]):
        remaining = max(0.0, monthly_budget - total_spent)
        return {
            "intent": "QUERY_BUDGET",
            "parsed_transaction": None,
            "speech_response": f"Your monthly budget is ₹{monthly_budget:,.0f}. You have ₹{remaining:,.0f} remaining for this month.",
            "success": True,
            "suggestions": ["What is my safe daily limit?", "Show app breakdown"]
        }

    # Intent 4: Fraud / security check
    if any(q in lower for q in ["any fraud", "suspicious", "fraud alert", "security alert", "is my wallet safe"]):
        if high_risk_count > 0:
            speech = f"Attention: You have {high_risk_count} suspicious transaction alerts that require your review in the Fraud Center."
        else:
            speech = "All clear! No suspicious or high-risk transactions detected on your digital wallets."
        return {
            "intent": "QUERY_FRAUD",
            "parsed_transaction": None,
            "speech_response": speech,
            "success": True,
            "suggestions": ["Open Fraud Monitor", "What is my safe daily limit?"]
        }

    # Intent 5: Payment recording / logging
    amount = parse_spoken_number(lower)
    is_payment = (amount is not None and amount > 0) or any(kw in lower for kw in [
        "paid", "pay", "sent", "spend", "spent", "transfer", "bought", "recharge", "bill", "ordered", "add", "log"
    ])

    if is_payment:
        if not amount or amount <= 0:
            return {
                "intent": "LOG_PAYMENT_ERROR",
                "parsed_transaction": None,
                "speech_response": "I heard you mention a payment, but couldn't detect the amount. Please say for example: 'Paid 350 for coffee on Google Pay'.",
                "success": False,
                "suggestions": ["Paid 250 for lunch on PhonePe", "Paid 1200 for electricity on Google Pay"]
            }

        # Detect digital wallet app
        detected_app = "Google Pay" # default
        for app_key, official_name in [
            ("google pay", "Google Pay"), ("gpay", "Google Pay"), 
            ("phonepe", "PhonePe"), ("phone pe", "PhonePe"),
            ("paytm", "Paytm"), 
            ("amazon pay", "Amazon Pay"), ("amazonpay", "Amazon Pay"),
            ("apple pay", "Apple Pay"), ("applepay", "Apple Pay"),
            ("cred", "Cred"),
            ("bhim upi", "BHIM UPI"), ("bhim", "BHIM UPI"),
            ("whatsapp pay", "WhatsApp Pay"), ("samsung pay", "Samsung Pay")
        ]:
            if app_key in lower:
                detected_app = official_name
                break

        merchant = extract_merchant(raw, detected_app)
        now = datetime.now()
        date_str = now.strftime("%Y-%m-%d")
        time_str = now.strftime("%H:%M")

        # Auto-segregate category & necessity
        segregated = auto_segregate(merchant, raw, amount)
        risk = evaluate_fraud_risk(amount, merchant, time_str, segregated["category"])

        parsed_tx = {
            "amount": amount,
            "merchant": merchant,
            "category": segregated["category"],
            "subcategory": segregated["subcategory"],
            "necessity": segregated["necessity"],
            "app": detected_app,
            "date": date_str,
            "time": time_str,
            "type": "debit",
            "risk_score": risk["risk_score"],
            "risk_level": risk["risk_level"],
            "risk_reason": risk["risk_reason"],
            "notes": f"Voice logged: \"{raw}\""
        }

        speech = (
            f"Logged payment of ₹{amount:,.0f} to {merchant} via {detected_app}. "
            f"Categorized under {segregated['category']} as a {segregated['necessity']}."
        )

        return {
            "intent": "LOG_PAYMENT",
            "parsed_transaction": parsed_tx,
            "speech_response": speech,
            "success": True,
            "suggestions": ["Confirm and Save", "Modify details", "Cancel"]
        }

    return {
        "intent": "UNKNOWN",
        "parsed_transaction": None,
        "speech_response": "I didn't quite catch that. You can speak payments like 'Paid 350 for coffee at Starbucks on Google Pay' or ask 'How much can I spend today?'.",
        "success": False,
        "suggestions": [
            "Paid 350 for coffee at Starbucks on Google Pay",
            "Paid 1200 for electricity bill on PhonePe",
            "What is my safe spending limit today?",
            "How much have I spent this month?"
        ]
    }
