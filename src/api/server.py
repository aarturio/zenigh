"""
Market Data Service - FastAPI backend
"""

import os
from contextlib import asynccontextmanager
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import talib
import numpy as np
import logging

from src.config import SYMBOLS, TABLE_MAP, INDICATORS
from src import db
from src.data_client import init_client

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize resources on startup"""
    logger.info("Initializing database...")
    db.init_db()

    api_key = os.getenv("ALPACA_API_KEY")
    secret_key = os.getenv("ALPACA_SECRET_KEY")
    if api_key and secret_key:
        init_client("alpaca", api_key=api_key, secret_key=secret_key)
        logger.info("Data client initialized")

    yield
    logger.info("Shutting down...")


app = FastAPI(
    title="Market Data Service",
    description="Market data and technical analysis API",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Models
class OHLCVData(BaseModel):
    open: List[float] = Field(default_factory=list)
    high: List[float]
    low: List[float]
    close: List[float]
    volume: List[float] = Field(default_factory=list)


class BatchIndicatorRequest(BaseModel):
    data: OHLCVData
    params: Optional[Dict[str, Dict[str, Any]]] = Field(default_factory=dict)


# Helpers
def clean_nan(arr: np.ndarray) -> List:
    """Convert NaN values to None for JSON serialization"""
    return [None if (isinstance(x, float) and np.isnan(x)) else x for x in arr.tolist()]


# Indicator calculations
def calculate_ema(close: np.ndarray, period: int = 9) -> Dict[str, List]:
    result = talib.EMA(close, timeperiod=period)
    return {"values": clean_nan(result)}


def calculate_macd(
    close: np.ndarray, fast: int = 12, slow: int = 26, signal: int = 9
) -> Dict[str, List]:
    macd, signal_line, histogram = talib.MACD(
        close, fastperiod=fast, slowperiod=slow, signalperiod=signal
    )
    return {
        "macd": clean_nan(macd),
        "signal": clean_nan(signal_line),
        "histogram": clean_nan(histogram),
    }


INDICATOR_FUNCTIONS = {
    "EMA": calculate_ema,
    "MACD": calculate_macd,
}


# Endpoints
@app.get("/")
def root():
    return {"service": "Market Data Service", "status": "running"}


@app.get("/health")
def health_check():
    return {"status": "healthy", "talib_version": talib.__version__}


@app.get("/symbols")
def get_symbols():
    return {"symbols": SYMBOLS}


@app.get("/timeframes")
def get_timeframes():
    return {"timeframes": list(TABLE_MAP.keys())}


@app.get("/db-size")
def get_db_size():
    try:
        size_info = db.get_db_size()
        return {"database": size_info}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/ingest/{start_date}/{end_date}")
async def ingest_all_timeframes(start_date: str, end_date: str):
    """Ingest market data for all timeframes"""
    from src.data_client import data_client

    if not data_client:
        raise HTTPException(status_code=500, detail="Data client not initialized")

    results = {"success": [], "failed": []}

    for timeframe, table_name in TABLE_MAP.items():
        try:
            raw_bars = await data_client.get_all_bars(start_date, end_date, timeframe)
            formatted_data = data_client.transform_bars(raw_bars)

            if formatted_data:
                logger.info(f"Inserting {len(formatted_data)} records into {table_name}")
                db.save_market_data(formatted_data, timeframe)
                results["success"].append({"timeframe": timeframe, "count": len(formatted_data)})
            else:
                results["success"].append({"timeframe": timeframe, "count": 0})

        except Exception as e:
            logger.error(f"Failed to ingest {timeframe}: {e}")
            results["failed"].append({"timeframe": timeframe, "error": str(e)})

    return {"message": "Data ingestion completed", "results": results}


@app.get("/ingest/{start_date}/{end_date}/{timeframe}")
async def ingest_timeframe(start_date: str, end_date: str, timeframe: str):
    """Ingest market data for a specific timeframe"""
    from src.data_client import data_client

    if not data_client:
        raise HTTPException(status_code=500, detail="Data client not initialized")

    if timeframe not in TABLE_MAP:
        raise HTTPException(status_code=400, detail=f"Invalid timeframe: {timeframe}")

    try:
        raw_bars = await data_client.get_all_bars(start_date, end_date, timeframe)
        formatted_data = data_client.transform_bars(raw_bars)

        if formatted_data:
            db.save_market_data(formatted_data, timeframe)

        return {"message": "Data ingested!", "count": len(formatted_data)}

    except Exception as e:
        logger.error(f"Failed to ingest {timeframe}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/data/{symbol}/{timeframe}")
def get_market_data(symbol: str, timeframe: str):
    """Get market data with indicators for a symbol"""
    if timeframe not in TABLE_MAP:
        raise HTTPException(status_code=400, detail=f"Invalid timeframe: {timeframe}")

    try:
        bars = db.get_market_data(symbol, timeframe)
        ta_data = db.get_technical_analysis(symbol, timeframe)

        formatted_bars = [
            {
                "time": int(bar["timestamp"].timestamp()),
                "open": bar["open"],
                "high": bar["high"],
                "low": bar["low"],
                "close": bar["close"],
                "volume": bar["volume"],
                "vwap": bar["vwap"],
            }
            for bar in bars
        ]

        indicators = {}
        if ta_data:
            for record in ta_data:
                if record["indicators"]:
                    for key, value in record["indicators"].items():
                        if key not in indicators:
                            indicators[key] = []
                        indicators[key].append(value)

        return {"bars": formatted_bars, "indicators": indicators}

    except Exception as e:
        logger.error(f"Failed to fetch market data: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/ta/{symbol}/{timeframe}")
def get_ta_data(symbol: str, timeframe: str):
    """Get technical analysis data for a symbol"""
    try:
        data = db.get_technical_analysis(symbol, timeframe)
        return {"data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/ta/calculate")
def calculate_all_indicators():
    """Calculate indicators for all symbols and timeframes"""
    logger.info("Starting indicator calculations...")
    results = {"success": [], "failed": []}

    for symbol in SYMBOLS:
        for timeframe in TABLE_MAP.keys():
            try:
                bars = db.get_market_data(symbol, timeframe)

                if not bars:
                    logger.warning(f"No data for {symbol} ({timeframe})")
                    continue

                close = np.array([b["close"] for b in bars], dtype=np.float64)

                # Calculate indicators
                indicator_results = {}
                for ind_key, ind_config in INDICATORS.items():
                    func_name = ind_config["function"]
                    params = ind_config["params"]
                    calc_func = INDICATOR_FUNCTIONS[func_name]
                    indicator_results[ind_key] = calc_func(close, **params)

                # Structure results per bar
                ta_records = []
                for i, bar in enumerate(bars):
                    bar_indicators = {}
                    for ind_key, ind_data in indicator_results.items():
                        if "values" in ind_data:
                            bar_indicators[ind_key] = ind_data["values"][i]
                        else:
                            bar_indicators[ind_key] = {k: v[i] for k, v in ind_data.items()}

                    ta_records.append(
                        {
                            "symbol": symbol,
                            "timeframe": timeframe,
                            "timestamp": bar["timestamp"],
                            "indicators": bar_indicators,
                            "signals": None,
                            "data_points_used": len(bars),
                        }
                    )

                db.save_technical_analysis(ta_records)
                results["success"].append({"symbol": symbol, "timeframe": timeframe})
                logger.info(f"Calculated indicators for {symbol} ({timeframe})")

            except Exception as e:
                logger.error(f"Failed for {symbol} ({timeframe}): {e}")
                results["failed"].append(
                    {"symbol": symbol, "timeframe": timeframe, "error": str(e)}
                )

    return {"message": "Indicator calculations completed", "results": results}


@app.post("/calculate")
def calculate_indicators(request: BatchIndicatorRequest):
    """Calculate indicators on provided data"""
    results = {}
    errors = {}

    close = np.array(request.data.close, dtype=np.float64)

    for indicator_key, indicator_config in request.params.items():
        try:
            func_name = indicator_config.get("function", indicator_key)
            params = indicator_config.get("params", {})

            if func_name not in INDICATOR_FUNCTIONS:
                errors[indicator_key] = f"Unknown indicator: {func_name}"
                continue

            calc_func = INDICATOR_FUNCTIONS[func_name]
            results[indicator_key] = calc_func(close, **params)

        except Exception as e:
            errors[indicator_key] = str(e)

    return {"success": len(errors) == 0, "results": results, "errors": errors if errors else None}
