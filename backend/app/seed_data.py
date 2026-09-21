from datetime import datetime, timedelta
import random

def populate_seed_data(conn):
    cursor = conn.cursor()

    # Check if transactions already exist
    cursor.execute("SELECT COUNT(*) FROM transactions")
    if cursor.fetchone()[0] > 0:
        return

    now = datetime.now()
    today_day = now.day

    # Raw seed templates: (merchant, category, subcat, app, amt_range, nec, time_range)
    sample_templates = [
        # Groceries
        ("Blinkit Quick Commerce", "Groceries & Supermarket", "Household Provisions", "Google Pay", (250, 850), "Need", "09:30"),
        ("Zepto Delivery", "Groceries & Supermarket", "Household Provisions", "PhonePe", (180, 620), "Need", "18:45"),
        ("BigBasket Supermarket", "Groceries & Supermarket", "Household Provisions", "Paytm", (1200, 2800), "Need", "11:15"),
        ("Nature's Basket Organic", "Groceries & Supermarket", "Household Provisions", "Amazon Pay", (650, 1400), "Need", "17:20"),
        
        # Food & Dining
        ("Swiggy Gourmet", "Food & Dining", "Dining Out", "Google Pay", (320, 780), "Want", "13:30"),
        ("Zomato Online", "Food & Dining", "Dining Out", "PhonePe", (280, 950), "Want", "20:45"),
        ("Starbucks Coffee", "Food & Dining", "Beverages & Snacks", "Apple Pay", (350, 650), "Want", "16:00"),
        ("Domino's Pizza", "Food & Dining", "Dining Out", "Paytm", (450, 1100), "Want", "21:15"),
        ("Third Wave Coffee Roasters", "Food & Dining", "Beverages & Snacks", "Google Pay", (290, 580), "Want", "10:15"),
        ("Biryani By Kilo", "Food & Dining", "Dining Out", "PhonePe", (750, 1450), "Want", "20:10"),

        # Travel & Commute
        ("Uber Premier", "Travel & Commute", "Daily Commute", "Google Pay", (180, 480), "Need", "08:45"),
        ("Ola Cabs", "Travel & Commute", "Daily Commute", "Paytm", (150, 390), "Need", "19:00"),
        ("HPCL Fuel Station", "Travel & Commute", "Fuel & Gas", "PhonePe", (1500, 2500), "Need", "12:30"),
        ("Metro Smart Card Recharge", "Travel & Commute", "Daily Commute", "Paytm", (200, 500), "Need", "08:15"),
        ("Shell Petrol Pump", "Travel & Commute", "Fuel & Gas", "Google Pay", (1800, 3000), "Need", "17:40"),

        # Utilities & Bills
        ("BESCOM Electricity Board", "Utilities & Bills", "Utility Bill", "PhonePe", (1850, 2400), "Need", "14:10"),
        ("Airtel Fiber Broadband", "Utilities & Bills", "Utility Bill", "Google Pay", (999, 1199), "Need", "11:00"),
        ("Indane LPG Gas Refill", "Utilities & Bills", "Utility Bill", "Paytm", (880, 950), "Need", "15:20"),
        ("Jio 5G Postpaid", "Utilities & Bills", "Utility Bill", "Amazon Pay", (599, 799), "Need", "10:00"),

        # Shopping & E-commerce
        ("Amazon India Marketplace", "Shopping & E-Commerce", "Online Shopping", "Amazon Pay", (650, 2400), "Want", "14:30"),
        ("Myntra Fashion", "Shopping & E-Commerce", "Online Shopping", "Google Pay", (1200, 3200), "Want", "21:00"),
        ("Zara Retail Store", "Shopping & E-Commerce", "Apparel", "Apple Pay", (2990, 5500), "Want", "18:15"),
        ("Croma Electronics", "Shopping & E-Commerce", "Electronics", "Cred", (1800, 4500), "Want", "19:40"),

        # Entertainment & Subscriptions
        ("Netflix Monthly Standard", "Entertainment & OTT", "Digital Subscriptions", "Google Pay", (499, 499), "Want", "00:05"),
        ("Spotify Premium Family", "Entertainment & OTT", "Digital Subscriptions", "PhonePe", (179, 179), "Want", "00:10"),
        ("BookMyShow Movie Tickets", "Entertainment & OTT", "Cinema", "Paytm", (600, 1200), "Want", "19:20"),
        ("YouTube Premium", "Entertainment & OTT", "Digital Subscriptions", "Google Pay", (149, 149), "Want", "02:00"),

        # Health & Wellness
        ("Apollo Pharmacy", "Health & Fitness", "Medical & Healthcare", "PhonePe", (350, 980), "Need", "12:00"),
        ("Cult.fit Gym Center", "Health & Fitness", "Gym & Fitness", "Cred", (2500, 3000), "Need", "07:30"),

        # Transfers
        ("Rent Transfer to Landlord", "Transfers & Personal", "House Rent", "Google Pay", (18000, 18000), "Need", "10:00"),
        ("UPI Transfer to Mom", "Transfers & Personal", "Family Support", "PhonePe", (5000, 5000), "Need", "11:30"),
        ("Split Bill to Vikram", "Transfers & Personal", "Peer Transfer", "Paytm", (450, 950), "Need", "22:00")
    ]

    # Generate daily distributed transactions from day 1 up to today_day
    random.seed(42)
    tx_list = []

    for d in range(1, today_day + 1):
        # 1 to 3 transactions per day
        day_date = now.replace(day=d).strftime("%Y-%m-%d")
        daily_count = random.choice([1, 2, 3])
        if d == 1:
            # First day has rent
            rent_tpl = sample_templates[-3]
            tx_list.append((
                rent_tpl[4][0], rent_tpl[0], rent_tpl[1], rent_tpl[2], rent_tpl[3],
                day_date, "10:00", "debit", "completed", rent_tpl[5], 0, "LOW", "Routine rent payment", 0, "Monthly apartment rent"
            ))
            daily_count = 1

        for _ in range(daily_count):
            tpl = random.choice(sample_templates[:20]) # typical daily spends
            amt = round(random.uniform(tpl[4][0], tpl[4][1]), 2)
            tx_list.append((
                amt, tpl[0], tpl[1], tpl[2], tpl[3],
                day_date, tpl[6], "debit", "completed", tpl[5], 0, "LOW", "Normal transaction pattern", 0, f"Paid using {tpl[3]}"
            ))

    # Add 2 deliberate Suspicious / Anomaly transactions for AI fraud detection demo!
    yesterday_date = (now - timedelta(days=1)).strftime("%Y-%m-%d")
    tx_list.append((
        36500.0, "CryptoEx Oversea Trade", "Investments & Savings", "Wealth Accumulation", "Paytm",
        yesterday_date, "03:42", "debit", "flagged", "Want", 85, "HIGH",
        "High-value spike of ₹36,500 requires verification • Off-hours transaction recorded at 03:42 • Flagged merchant keyword detected: 'crypto'",
        0, "Unrecognized foreign crypto wallet debit"
    ))

    two_days_ago = (now - timedelta(days=2)).strftime("%Y-%m-%d")
    tx_list.append((
        1450.0, "Swiggy Gourmet", "Food & Dining", "Dining Out", "Google Pay",
        two_days_ago, "13:31", "debit", "flagged", "Want", 40, "MEDIUM",
        "Potential duplicate charge detected: multiple identical transactions within 2 minutes",
        0, "Duplicate charge flagged by AI engine"
    ))

    cursor.executemany("""
        INSERT INTO transactions (
            amount, merchant, category, subcategory, app, date, time, 
            type, status, necessity, risk_score, risk_level, risk_reason, is_dismissed, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, tx_list)

    # Budgets
    default_budgets = [
        ("Food & Dining", 9000.0, "utensils", "#f59e0b"),
        ("Groceries & Supermarket", 7500.0, "shopping-bag", "#10b981"),
        ("Utilities & Bills", 6000.0, "zap", "#3b82f6"),
        ("Shopping & E-Commerce", 7000.0, "shopping-cart", "#ec4899"),
        ("Travel & Commute", 5000.0, "car", "#8b5cf6"),
        ("Entertainment & OTT", 2500.0, "tv", "#06b6d4"),
        ("Health & Fitness", 4000.0, "heart-pulse", "#ef4444"),
        ("Transfers & Personal", 22000.0, "arrow-left-right", "#64748b")
    ]
    cursor.executemany("""
        INSERT OR IGNORE INTO budgets (category, monthly_limit, icon, color)
        VALUES (?, ?, ?, ?)
    """, default_budgets)

    # Upcoming Bills
    next_week = (now + timedelta(days=5)).strftime("%Y-%m-%d")
    ten_days = (now + timedelta(days=10)).strftime("%Y-%m-%d")
    two_weeks = (now + timedelta(days=14)).strftime("%Y-%m-%d")
    default_bills = [
        ("BESCOM Electricity", 1950.0, next_week, "Utilities & Bills", "PhonePe", "unpaid", "monthly"),
        ("Airtel Xstream Fiber", 1179.0, ten_days, "Utilities & Bills", "Google Pay", "unpaid", "monthly"),
        ("HDFC Credit Card Auto-Debit", 8450.0, two_weeks, "Utilities & Bills", "Cred", "unpaid", "monthly")
    ]
    cursor.executemany("""
        INSERT OR IGNORE INTO bills (title, amount, due_date, category, app, status, recurring)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, default_bills)

    conn.commit()
