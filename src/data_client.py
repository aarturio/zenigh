"""
Generic HTTP client for market data providers.
Swap out the implementation for your specific provider.
"""
import logging
from datetime import datetime
from typing import Optional

import httpx

from src.config import SYMBOLS

logger = logging.getLogger(__name__)


class DataClient:
    """
    Generic market data client. Subclass or modify for your provider.

    Expected response format (adapt transform_response for your provider):
    {
        "AAPL": [
            {"t": "2024-01-01T09:30:00Z", "o": 150.0, "h": 151.0, "l": 149.0, "c": 150.5, "v": 1000000, "n": 5000, "vw": 150.25},
            ...
        ],
        "MSFT": [...],
    }
    """

    def __init__(
        self,
        base_url: str,
        headers: Optional[dict] = None,
        timeout: float = 30.0,
    ):
        self.base_url = base_url.rstrip("/")
        self.headers = headers or {}
        self.timeout = timeout
        self.symbols = SYMBOLS

    async def get_bars(
        self,
        start: str,
        end: str,
        timeframe: str,
        page_token: Optional[str] = None,
    ) -> dict:
        """
        Fetch a single page of bars from the provider.

        Args:
            start: Start date (ISO format)
            end: End date (ISO format)
            timeframe: Timeframe string (provider-specific)
            page_token: Pagination token if applicable

        Returns:
            Raw response dict from provider
        """
        params = {
            "symbols": ",".join(self.symbols),
            "start": start,
            "end": end,
            "timeframe": timeframe,
            "limit": 10000,
        }

        if page_token:
            params["page_token"] = page_token

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.get(
                f"{self.base_url}/bars",
                params=params,
                headers=self.headers,
            )
            response.raise_for_status()
            return response.json()

    async def get_all_bars(self, start: str, end: str, timeframe: str) -> dict[str, list]:
        """
        Fetch all bars with pagination handling.

        Returns:
            Dict mapping symbol -> list of bar dicts
        """
        all_bars: dict[str, list] = {}
        page_token = None
        page_count = 0

        while True:
            page = await self.get_bars(start, end, timeframe, page_token)

            # Merge bars - adapt this key based on your provider's response structure
            bars_data = page.get("bars", page)  # Some APIs nest under "bars", some don't

            for symbol, symbol_bars in bars_data.items():
                if symbol not in all_bars:
                    all_bars[symbol] = []
                all_bars[symbol].extend(symbol_bars)

            # Check for next page - adapt based on your provider
            page_token = page.get("next_page_token")
            page_count += 1

            if page_token:
                logger.info(f"Fetched page {page_count}, continuing...")
            else:
                logger.info(f"Completed: fetched {page_count} page(s)")
                break

        return all_bars

    def transform_bars(self, raw_bars: dict[str, list]) -> list[dict]:
        """
        Transform raw provider response to standard format for database.

        Adapt field mappings based on your provider's response format.

        Returns:
            List of dicts ready for save_market_data()
        """
        result = []

        for symbol, bars in raw_bars.items():
            for bar in bars:
                # Parse ISO timestamp to datetime
                ts = bar.get("t")
                if isinstance(ts, str):
                    # Handle ISO format with Z suffix
                    ts = datetime.fromisoformat(ts.replace("Z", "+00:00"))

                result.append({
                    "symbol": symbol,
                    "timestamp": ts,
                    "open": bar.get("o"),
                    "high": bar.get("h"),
                    "low": bar.get("l"),
                    "close": bar.get("c"),
                    "volume": bar.get("v"),
                    "trade_count": bar.get("n"),
                    "vwap": bar.get("vw"),
                })

        return result


# =============================================================================
# Example provider implementations
# =============================================================================

class AlpacaClient(DataClient):
    """Example: Alpaca Markets API client"""

    def __init__(self, api_key: str, secret_key: str):
        super().__init__(
            base_url="https://data.alpaca.markets/v2/stocks",
            headers={
                "APCA-API-KEY-ID": api_key,
                "APCA-API-SECRET-KEY": secret_key,
            },
        )

    async def get_bars(
        self,
        start: str,
        end: str,
        timeframe: str,
        page_token: Optional[str] = None,
    ) -> dict:
        params = {
            "symbols": ",".join(self.symbols),
            "start": start,
            "end": end,
            "timeframe": timeframe,
            "limit": 10000,
            "adjustment": "raw",
            "feed": "iex",
            "sort": "asc",
        }

        if page_token:
            params["page_token"] = page_token

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.get(
                f"{self.base_url}/bars",
                params=params,
                headers=self.headers,
            )
            response.raise_for_status()
            return response.json()


# Default client instance - replace with your provider
# data_client = AlpacaClient(api_key="...", secret_key="...")
data_client: Optional[DataClient] = None


def init_client(provider: str = "alpaca", **kwargs) -> DataClient:
    """
    Initialize the data client for a specific provider.

    Args:
        provider: Provider name ("alpaca", "polygon", "custom", etc.)
        **kwargs: Provider-specific arguments (api_key, secret_key, etc.)
    """
    global data_client

    if provider == "alpaca":
        data_client = AlpacaClient(
            api_key=kwargs.get("api_key", ""),
            secret_key=kwargs.get("secret_key", ""),
        )
    else:
        # Generic client for custom providers
        data_client = DataClient(
            base_url=kwargs.get("base_url", ""),
            headers=kwargs.get("headers", {}),
        )

    return data_client
