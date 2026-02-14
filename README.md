# Zenigh

Market data and technical analysis service built with Python.

Fetches OHLCV bars from Alpaca Markets, stores them in DuckDB, and computes technical indicators (EMA, MACD) using TA-Lib. Includes a FastAPI backend and a Textual-based terminal UI for real-time visualization.

## Stack

- **FastAPI** — REST API for data ingestion, retrieval, and analysis
- **DuckDB** — Embedded analytics database for market data persistence
- **TA-Lib** — Technical indicator calculations
- **Textual** — Terminal UI for live market data display
- **UV** — Python package management
