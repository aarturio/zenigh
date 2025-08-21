-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create market_data table
CREATE TABLE market_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    open DOUBLE PRECISION NOT NULL,
    high DOUBLE PRECISION NOT NULL,
    low DOUBLE PRECISION NOT NULL,
    close DOUBLE PRECISION NOT NULL,
    volume BIGINT NOT NULL,
    trade_count INTEGER,
    vwap DOUBLE PRECISION
);

-- Create indexes for performance
CREATE INDEX ix_market_data_symbol ON market_data(symbol);
CREATE INDEX ix_market_data_timestamp ON market_data(timestamp);
CREATE INDEX ix_market_data_symbol_timestamp ON market_data(symbol, timestamp);