# Build stage - compile TA-Lib
FROM python:3.13 AS builder

RUN apt-get update && apt-get install -y \
    build-essential \
    wget \
    && wget http://prdownloads.sourceforge.net/ta-lib/ta-lib-0.4.0-src.tar.gz \
    && tar -xzf ta-lib-0.4.0-src.tar.gz \
    && cd ta-lib/ \
    && wget -O config.guess 'https://git.savannah.gnu.org/gitweb/?p=config.git;a=blob_plain;f=config.guess;hb=HEAD' \
    && wget -O config.sub 'https://git.savannah.gnu.org/gitweb/?p=config.git;a=blob_plain;f=config.sub;hb=HEAD' \
    && ./configure --prefix=/usr \
    && make \
    && make install

# Runtime stage
FROM python:3.13-slim

# Install uv and curl for healthcheck
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy TA-Lib from builder
COPY --from=builder /usr/lib/libta_lib.* /usr/lib/
COPY --from=builder /usr/include/ta-lib/ /usr/include/ta-lib/
RUN ldconfig

# Set working directory
WORKDIR /app

# Copy uv files
COPY pyproject.toml uv.lock ./

# Install Python dependencies with uv
RUN uv sync --frozen --no-dev

# Copy application code
COPY src/ ./src/

# Create data directory
RUN mkdir -p /app/data

# Expose port
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
      CMD curl -f http://localhost:3000/health || exit 1

CMD ["uv", "run", "uvicorn", "src.api.server:app", "--host", "0.0.0.0", "--port", "3000"]
