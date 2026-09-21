import re
from typing import Tuple, Dict

# Knowledge base of merchant keywords, brands, and categories
CATEGORY_RULES = {
    "Food & Dining": {
        "keywords": [
            "swiggy", "zomato", "mcdonald", "starbucks", "domino", "kfc", "burger", 
            "pizza", "cafe", "restaurant", "dining", "bar", "bistro", "bakery", 
            "subway", "chai", "coffee", "tea", "dhaba", "food", "kitchen", "biryani"
        ],
        "necessity": "Want",
        "default_subcat": "Dining Out"
    },
    "Groceries & Supermarket": {
        "keywords": [
            "blinkit", "zepto", "instamart", "bigbasket", "dmart", "spencer", 
            "supermarket", "grocery", "kirana", "provision", "vegetable", "fruits", 
            "milk", "dairy", "nature basket", "reliance fresh"
        ],
        "necessity": "Need",
        "default_subcat": "Household Provisions"
    },
    "Utilities & Bills": {
        "keywords": [
            "electricity", "bescom", "tneb", "torrent", "water", "gas", "cylinder", 
            "indane", "hp gas", "bharat gas", "wifi", "broadband", "airtel", "jio", 
            "vi", "vodafone", "recharge", "postpaid", "prepaid", "bill", "municipal",
            "dth", "tata play", "dish tv"
        ],
        "necessity": "Need",
        "default_subcat": "Utility Bill"
    },
    "Shopping & E-Commerce": {
        "keywords": [
            "amazon", "flipkart", "myntra", "meesho", "nykaa", "ajio", "zara", 
            "h&m", "uniqlo", "retail", "clothing", "apparel", "footwear", "electronics", 
            "croma", "reliance digital", "lifestyle", "mall"
        ],
        "necessity": "Want",
        "default_subcat": "Online Shopping"
    },
    "Travel & Commute": {
        "keywords": [
            "uber", "ola", "rapido", "irctc", "metro", "bus", "redbus", "makemytrip", 
            "goibibo", "flight", "indigo", "air india", "petrol", "fuel", "diesel", 
            "shell", "hpcl", "bpcl", "ioc", "toll", "fastag", "parking", "cab"
        ],
        "necessity": "Need",
        "default_subcat": "Daily Commute"
    },
    "Entertainment & OTT": {
        "keywords": [
            "netflix", "prime video", "hotstar", "spotify", "apple music", "youtube", 
            "bookmyshow", "pvr", "inox", "cinema", "theatre", "gaming", "steam", 
            "playstation", "pubg", "amusement", "concert"
        ],
        "necessity": "Want",
        "default_subcat": "Digital Subscriptions"
    },
    "Health & Fitness": {
        "keywords": [
            "pharmacy", "apollo", "medplus", "1mg", "pharmeasy", "doctor", "clinic", 
            "hospital", "dental", "gym", "cult.fit", "cult fit", "fitness", "yoga", 
            "diagnostic", "lab", "medicine"
        ],
        "necessity": "Need",
        "default_subcat": "Medical & Healthcare"
    },
    "Transfers & Personal": {
        "keywords": [
            "transfer", "sent to", "paid to", "friend", "family", "rent", "roommate", 
            "landlord", "upiqr", "upi transfer", "p2p", "reimbursement"
        ],
        "necessity": "Need",
        "default_subcat": "Peer Transfer"
    },
    "Investments & Savings": {
        "keywords": [
            "zerodha", "groww", "upstox", "angelone", "mutual fund", "sip", "coin", 
            "shares", "crypto", "binance", "wazirx", "gold", "deposit", "ppf", "nps"
        ],
        "necessity": "Investment",
        "default_subcat": "Wealth Accumulation"
    }
}

# Known digital wallet apps normalization
APP_KEYWORDS = {
    "google pay": "Google Pay",
    "gpay": "Google Pay",
    "phonepe": "PhonePe",
    "paytm": "Paytm",
    "amazon pay": "Amazon Pay",
    "amazonpay": "Amazon Pay",
    "apple pay": "Apple Pay",
    "applepay": "Apple Pay",
    "bhim": "BHIM UPI",
    "cred": "Cred",
    "samsung pay": "Samsung Pay",
    "whatsapp pay": "WhatsApp Pay"
}

def normalize_wallet_app(raw_app: str) -> str:
    """Normalizes app string to standard brand name."""
    if not raw_app:
        return "Google Pay"
    cleaned = raw_app.strip().lower()
    for pattern, official_name in APP_KEYWORDS.items():
        if pattern in cleaned:
            return official_name
    return raw_app.title()

def auto_segregate(merchant: str, notes: str = "", amount: float = 0.0) -> Dict[str, str]:
    """
    Intelligently segregates a transaction into Category, Subcategory, and Necessity (Need/Want/Investment)
    using semantic text matching, regex heuristics, and context.
    """
    combined_text = f"{merchant} {notes}".lower()
    
    # Check specific keyword matches
    for category, meta in CATEGORY_RULES.items():
        for keyword in meta["keywords"]:
            # Word boundary matching where applicable or substring match
            if re.search(r'\b' + re.escape(keyword) + r'\b', combined_text) or keyword in combined_text:
                # Custom nuance: If rent or landlord in notes, subcategory is Rent
                subcat = meta["default_subcat"]
                necessity = meta["necessity"]
                if "rent" in combined_text:
                    subcat = "House Rent"
                    necessity = "Need"
                elif "petrol" in combined_text or "fuel" in combined_text:
                    subcat = "Fuel & Gas"
                    necessity = "Need"
                elif "coffee" in combined_text or "tea" in combined_text:
                    subcat = "Beverages & Snacks"
                return {
                    "category": category,
                    "subcategory": subcat,
                    "necessity": necessity
                }
    
    # Heuristics based on amount or default fallback
    if amount > 15000:
        return {
            "category": "Transfers & Personal",
            "subcategory": "High-Value Transfer",
            "necessity": "Need"
        }
        
    return {
        "category": "Miscellaneous",
        "subcategory": "General Expense",
        "necessity": "Want"
    }
