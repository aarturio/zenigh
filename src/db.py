"""
Database operations using DuckDB
"""

import json
import logging
from pathlib import Path

import duckdb

from src.config import DB_PATH

logger = logging.getLogger(__name__)

_conn: duckdb.DuckDBPyConnection | None = None


def get_conn() -> duckdb.DuckDBPyConnection:
    """Get or create DuckDB connection"""
    global _conn
    if _conn is None:
        Path(DB_PATH).parent.mkdir(parents=True, exist_ok=True)
        _conn = duckdb.connect(DB_PATH)
    return _conn


def init_db():
    """Initialize database tables"""
    conn = get_conn()

    conn.execute("""
        CREATE TABLE IF NOT EXISTS market_data_5m (
            symbol VARCHAR,
            timestamp TIMESTAMPTZ,
            open DOUBLE,
            high DOUBLE,
            low DOUBLE,
            close DOUBLE,
            volume BIGINT,
            trade_count INTEGER,
            vwap DOUBLE,
            PRIMARY KEY (symbol, timestamp)
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS market_data_15m (
            symbol VARCHAR,
            timestamp TIMESTAMPTZ,
            open DOUBLE,
            high DOUBLE,
            low DOUBLE,
            close DOUBLE,
            volume BIGINT,
            trade_count INTEGER,
            vwap DOUBLE,
            PRIMARY KEY (symbol, timestamp)
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS technical_analysis (
            symbol VARCHAR,
            timeframe VARCHAR,
            timestamp TIMESTAMPTZ,
            indicators JSON,
            signals JSON,
            data_points_used INTEGER,
            PRIMARY KEY (symbol, timeframe, timestamp)
        )
    """)

    logger.info("Database tables initialized")


TABLE_MAP = {
    "5T": "market_data_5m",
    "15T": "market_data_15m",
}


def save_market_data(data: list[dict], timeframe: str) -> int:
    """Save market data, ignoring conflicts."""
    table_name = TABLE_MAP.get(timeframe)
    if not table_name:
        raise ValueError(f"Invalid timeframe: {timeframe}")

    conn = get_conn()

    for row in data:
        conn.execute(
            f"""
            INSERT OR REPLACE INTO {table_name}
            (symbol, timestamp, open, high, low, close, volume, trade_count, vwap)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
            [
                row["symbol"],
                row["timestamp"],
                row["open"],
                row["high"],
                row["low"],
                row["close"],
                row["volume"],
                row["trade_count"],
                row["vwap"],
            ],
        )

    logger.info(f"Saved {len(data)} records to {table_name}")
    return len(data)


def get_market_data(symbol: str, timeframe: str) -> list[dict]:
    """Get market data for a symbol and timeframe."""
    table_name = TABLE_MAP.get(timeframe)
    if not table_name:
        raise ValueError(f"Invalid timeframe: {timeframe}")

    conn = get_conn()
    result = conn.execute(
        f"""
        SELECT symbol, timestamp, open, high, low, close, volume, trade_count, vwap
        FROM {table_name}
        WHERE symbol = ?
        ORDER BY timestamp ASC
    """,
        [symbol],
    ).fetchall()

    return [
        {
            "symbol": row[0],
            "timestamp": row[1],
            "open": row[2],
            "high": row[3],
            "low": row[4],
            "close": row[5],
            "volume": row[6],
            "trade_count": row[7],
            "vwap": row[8],
        }
        for row in result
    ]


def save_technical_analysis(data: list[dict]) -> int:
    """Save technical analysis results."""
    conn = get_conn()

    for row in data:
        conn.execute(
            """
            INSERT OR REPLACE INTO technical_analysis
            (symbol, timeframe, timestamp, indicators, signals, data_points_used)
            VALUES (?, ?, ?, ?, ?, ?)
        """,
            [
                row["symbol"],
                row["timeframe"],
                row["timestamp"],
                json.dumps(row.get("indicators")),
                json.dumps(row.get("signals")) if row.get("signals") else None,
                row.get("data_points_used"),
            ],
        )

    logger.info(f"Saved {len(data)} technical analysis records")
    return len(data)


def get_technical_analysis(symbol: str, timeframe: str) -> list[dict]:
    """Get technical analysis data for a symbol and timeframe."""
    conn = get_conn()
    result = conn.execute(
        """
        SELECT symbol, timeframe, timestamp, indicators, signals, data_points_used
        FROM technical_analysis
        WHERE symbol = ? AND timeframe = ?
        ORDER BY timestamp ASC
    """,
        [symbol, timeframe],
    ).fetchall()

    return [
        {
            "symbol": row[0],
            "timeframe": row[1],
            "timestamp": row[2],
            "indicators": json.loads(row[3]) if row[3] else None,
            "signals": json.loads(row[4]) if row[4] else None,
            "data_points_used": row[5],
        }
        for row in result
    ]


def get_db_size() -> dict:
    """Get database size info"""
    path = Path(DB_PATH)
    if path.exists():
        size_bytes = path.stat().st_size
        if size_bytes < 1024:
            total_size = f"{size_bytes} B"
        elif size_bytes < 1024 * 1024:
            total_size = f"{size_bytes / 1024:.1f} KB"
        else:
            total_size = f"{size_bytes / (1024 * 1024):.1f} MB"
    else:
        size_bytes = 0
        total_size = "0 B"

    return {"total_size": total_size, "size_bytes": size_bytes}
