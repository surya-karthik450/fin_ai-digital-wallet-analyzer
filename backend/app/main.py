from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .database import init_db, get_db
from .seed_data import populate_seed_data
from .routers import transactions, analytics, forecasting, voice, budgets_bills

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure database tables are created and seed data is present
    init_db()
    with get_db() as conn:
        populate_seed_data(conn)
    yield
    # Shutdown logic if any

app = FastAPI(
    title="AI-Assisted Digital Wallet Analyzer API",
    description="Intelligent financial analytics, auto-segregation, voice payment assistant, and predictive month-end spend forecaster.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(transactions.router)
app.include_router(analytics.router)
app.include_router(forecasting.router)
app.include_router(voice.router)
app.include_router(budgets_bills.router)

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "AI-Assisted Digital Wallet Analyzer API",
        "version": "1.0.0",
        "endpoints": {
            "transactions": "/api/transactions",
            "analytics": "/api/analytics/overview",
            "app_segregation": "/api/analytics/by-app",
            "forecasting": "/api/forecasting/month-end",
            "voice_ai": "/api/voice/process",
            "budgets": "/api/budgets-bills/budgets"
        }
    }

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}
