"""
Configuration constants
"""
import os
from pathlib import Path

# Database
DB_PATH = os.getenv("DB_PATH", str(Path(__file__).parent.parent / "data" / "zenigh.duckdb"))

SYMBOLS = ["SPY"]

TABLE_MAP = {
    "5T": "market_data_5m",
    "15T": "market_data_15m",
}

# Note: VWAP and volume come from bar data directly
INDICATORS = {
    "EMA9": {"function": "EMA", "dataType": "close", "params": {"period": 9}},
    "MACD": {"function": "MACD", "dataType": "close", "params": {"fast": 12, "slow": 26, "signal": 9}},
}
