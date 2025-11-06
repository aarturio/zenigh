"""
TA-Lib Microservice - FastAPI wrapper for technical analysis indicators
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import talib
import numpy as np
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="TA-Lib Microservice",
    description="Technical Analysis Library HTTP API",
    version="1.0.0"
)

# CORS middleware (restrict in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# Request/Response Models
# ============================================================================

class OHLCVData(BaseModel):
    """Open, High, Low, Close, Volume data"""
    open: List[float] = Field(default_factory=list)
    high: List[float]
    low: List[float]
    close: List[float]
    volume: List[float] = Field(default_factory=list)

class IndicatorRequest(BaseModel):
    """Generic request for indicator calculation"""
    indicator: str = Field(..., description="Indicator name (RSI, MACD, etc.)")
    data: OHLCVData
    params: Optional[Dict[str, Any]] = Field(default_factory=dict)

class IndicatorResponse(BaseModel):
    """Generic response with calculation results"""
    success: bool
    indicator: str
    data: Dict[str, Any]
    metadata: Optional[Dict[str, Any]] = None

# ============================================================================
# Indicator Calculation Functions
# ============================================================================

def calculate_rsi(close: np.ndarray, period: int = 14) -> Dict[str, List]:
    """Calculate Relative Strength Index"""
    result = talib.RSI(close, timeperiod=period)
    return {"values": result.tolist()}

def calculate_macd(close: np.ndarray, fast: int = 12, slow: int = 26, signal: int = 9) -> Dict[str, List]:
    """Calculate MACD (Moving Average Convergence Divergence)"""
    macd, signal_line, histogram = talib.MACD(
        close,
        fastperiod=fast,
        slowperiod=slow,
        signalperiod=signal
    )
    return {
        "macd": macd.tolist(),
        "signal": signal_line.tolist(),
        "histogram": histogram.tolist()
    }

def calculate_bbands(close: np.ndarray, period: int = 20, stddev: float = 2.0) -> Dict[str, List]:
    """Calculate Bollinger Bands"""
    upper, middle, lower = talib.BBANDS(
        close,
        timeperiod=period,
        nbdevup=stddev,
        nbdevdn=stddev
    )
    return {
        "upper": upper.tolist(),
        "middle": middle.tolist(),
        "lower": lower.tolist()
    }

def calculate_stoch(high: np.ndarray, low: np.ndarray, close: np.ndarray,
                   k_period: int = 14, d_period: int = 3) -> Dict[str, List]:
    """Calculate Stochastic Oscillator"""
    slowk, slowd = talib.STOCH(
        high, low, close,
        fastk_period=k_period,
        slowk_period=3,
        slowd_period=d_period
    )
    return {
        "k": slowk.tolist(),
        "d": slowd.tolist()
    }

def calculate_atr(high: np.ndarray, low: np.ndarray, close: np.ndarray, period: int = 14) -> Dict[str, List]:
    """Calculate Average True Range"""
    result = talib.ATR(high, low, close, timeperiod=period)
    return {"values": result.tolist()}

def calculate_sma(close: np.ndarray, period: int = 20) -> Dict[str, List]:
    """Calculate Simple Moving Average"""
    result = talib.SMA(close, timeperiod=period)
    return {"values": result.tolist()}

def calculate_ema(close: np.ndarray, period: int = 20) -> Dict[str, List]:
    """Calculate Exponential Moving Average"""
    result = talib.EMA(close, timeperiod=period)
    return {"values": result.tolist()}

def calculate_adx(high: np.ndarray, low: np.ndarray, close: np.ndarray, period: int = 14) -> Dict[str, List]:
    """Calculate Average Directional Movement Index"""
    result = talib.ADX(high, low, close, timeperiod=period)
    return {"values": result.tolist()}

def calculate_cci(high: np.ndarray, low: np.ndarray, close: np.ndarray, period: int = 14) -> Dict[str, List]:
    """Calculate Commodity Channel Index"""
    result = talib.CCI(high, low, close, timeperiod=period)
    return {"values": result.tolist()}

def calculate_obv(close: np.ndarray, volume: np.ndarray) -> Dict[str, List]:
    """Calculate On Balance Volume"""
    result = talib.OBV(close, volume)
    return {"values": result.tolist()}

# Indicator function mapping
INDICATOR_FUNCTIONS = {
    "RSI": calculate_rsi,
    "MACD": calculate_macd,
    "BBANDS": calculate_bbands,
    "STOCH": calculate_stoch,
    "ATR": calculate_atr,
    "SMA": calculate_sma,
    "EMA": calculate_ema,
    "ADX": calculate_adx,
    "CCI": calculate_cci,
    "OBV": calculate_obv,
}

# ============================================================================
# API Endpoints
# ============================================================================

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "TA-Lib Microservice",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint for Docker"""
    return {"status": "healthy", "talib_version": talib.__version__}

@app.get("/indicators")
async def list_indicators():
    """List all available indicators"""
    return {
        "available": list(INDICATOR_FUNCTIONS.keys()),
        "total": len(INDICATOR_FUNCTIONS)
    }

@app.post("/calculate", response_model=IndicatorResponse)
async def calculate_indicator(request: IndicatorRequest):
    """
    Calculate technical indicator

    Example request:
    ```json
    {
      "indicator": "RSI",
      "data": {
        "close": [100, 102, 101, 103, 105, ...],
        "high": [101, 103, 102, 104, 106, ...],
        "low": [99, 101, 100, 102, 104, ...]
      },
      "params": {"period": 14}
    }
    ```
    """
    try:
        indicator = request.indicator.upper()

        if indicator not in INDICATOR_FUNCTIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown indicator: {indicator}. Available: {list(INDICATOR_FUNCTIONS.keys())}"
            )

        # Convert data to numpy arrays
        close = np.array(request.data.close, dtype=np.float64)
        high = np.array(request.data.high, dtype=np.float64)
        low = np.array(request.data.low, dtype=np.float64)
        volume = np.array(request.data.volume, dtype=np.float64) if request.data.volume else None

        # Validate data
        if len(close) == 0:
            raise HTTPException(status_code=400, detail="Empty close price data")

        # Get the calculation function
        calc_func = INDICATOR_FUNCTIONS[indicator]

        # Prepare arguments based on indicator requirements
        if indicator in ["RSI", "SMA", "EMA"]:
            result_data = calc_func(close, **request.params)
        elif indicator == "MACD":
            result_data = calc_func(close, **request.params)
        elif indicator in ["BBANDS"]:
            result_data = calc_func(close, **request.params)
        elif indicator in ["STOCH", "ATR", "ADX", "CCI"]:
            result_data = calc_func(high, low, close, **request.params)
        elif indicator == "OBV":
            if volume is None or len(volume) == 0:
                raise HTTPException(status_code=400, detail="OBV requires volume data")
            result_data = calc_func(close, volume)
        else:
            result_data = calc_func(close, **request.params)

        logger.info(f"Successfully calculated {indicator}")

        return IndicatorResponse(
            success=True,
            indicator=indicator,
            data=result_data,
            metadata={
                "data_points": len(close),
                "params": request.params
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error calculating {request.indicator}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Calculation error: {str(e)}")

# ============================================================================
# Batch Calculation Endpoint (for multiple indicators at once)
# ============================================================================

class BatchIndicatorRequest(BaseModel):
    """Request for calculating multiple indicators at once"""
    indicators: List[str]
    data: OHLCVData
    params: Optional[Dict[str, Dict[str, Any]]] = Field(default_factory=dict)

@app.post("/calculate/batch")
async def calculate_batch_indicators(request: BatchIndicatorRequest):
    """
    Calculate multiple indicators in one request for efficiency

    Example:
    ```json
    {
      "indicators": ["RSI", "MACD", "BBANDS"],
      "data": { ... },
      "params": {
        "RSI": {"period": 14},
        "MACD": {"fast": 12, "slow": 26, "signal": 9}
      }
    }
    ```
    """
    results = {}
    errors = {}

    for indicator in request.indicators:
        try:
            indicator_params = request.params.get(indicator, {})
            req = IndicatorRequest(
                indicator=indicator,
                data=request.data,
                params=indicator_params
            )
            response = await calculate_indicator(req)
            results[indicator] = response.data
        except Exception as e:
            errors[indicator] = str(e)
            logger.error(f"Batch calculation failed for {indicator}: {str(e)}")

    return {
        "success": len(errors) == 0,
        "results": results,
        "errors": errors if errors else None
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)