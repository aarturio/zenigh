-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create market data tables for different timeframes
CREATE TABLE market_data_1m (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    open DOUBLE PRECISION NOT NULL,
    high DOUBLE PRECISION NOT NULL,
    low DOUBLE PRECISION NOT NULL,
    close DOUBLE PRECISION NOT NULL,
    volume BIGINT NOT NULL,
    trade_count INTEGER,
    vwap NUMERIC(18,8)
);

CREATE TABLE market_data_5m (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    open DOUBLE PRECISION NOT NULL,
    high DOUBLE PRECISION NOT NULL,
    low DOUBLE PRECISION NOT NULL,
    close DOUBLE PRECISION NOT NULL,
    volume BIGINT NOT NULL,
    trade_count INTEGER,
    vwap NUMERIC(18,8)
);

CREATE TABLE market_data_1h (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    open DOUBLE PRECISION NOT NULL,
    high DOUBLE PRECISION NOT NULL,
    low DOUBLE PRECISION NOT NULL,
    close DOUBLE PRECISION NOT NULL,
    volume BIGINT NOT NULL,
    trade_count INTEGER,
    vwap NUMERIC(18,8)
);

CREATE TABLE market_data_1d (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    open DOUBLE PRECISION NOT NULL,
    high DOUBLE PRECISION NOT NULL,
    low DOUBLE PRECISION NOT NULL,
    close DOUBLE PRECISION NOT NULL,
    volume BIGINT NOT NULL,
    trade_count INTEGER,
    vwap NUMERIC(18,8)
);

-- Create indexes for performance on all tables
CREATE INDEX ix_market_data_1m_symbol ON market_data_1m(symbol);
CREATE INDEX ix_market_data_1m_timestamp ON market_data_1m(timestamp);
CREATE UNIQUE INDEX ix_market_data_1m_symbol_timestamp ON market_data_1m(symbol, timestamp);

CREATE INDEX ix_market_data_5m_symbol ON market_data_5m(symbol);
CREATE INDEX ix_market_data_5m_timestamp ON market_data_5m(timestamp);
CREATE UNIQUE INDEX ix_market_data_5m_symbol_timestamp ON market_data_5m(symbol, timestamp);

CREATE INDEX ix_market_data_1h_symbol ON market_data_1h(symbol);
CREATE INDEX ix_market_data_1h_timestamp ON market_data_1h(timestamp);
CREATE UNIQUE INDEX ix_market_data_1h_symbol_timestamp ON market_data_1h(symbol, timestamp);

CREATE INDEX ix_market_data_1d_symbol ON market_data_1d(symbol);
CREATE INDEX ix_market_data_1d_timestamp ON market_data_1d(timestamp);
CREATE UNIQUE INDEX ix_market_data_1d_symbol_timestamp ON market_data_1d(symbol, timestamp);

-- Create users table for authentication
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for users table
CREATE INDEX ix_users_email ON users(email);