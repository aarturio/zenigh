#!/bin/bash

# Data Retention Script for Zenigh
# Calls Node.js script that uses Knex to cleanup old data
# Retention policy:
# - market_data_1m: 7 days
# - market_data_5m: 7 days
# - market_data_1h: 30 days
# - market_data_1d: 365 days (1 year)

LOG_FILE="/home/ubuntu/data-retention.log"

# Run data retention script inside backend container
docker exec zenigh-backend-1 node db/data-retention.js >> "$LOG_FILE" 2>&1

# Check exit code
if [ $? -eq 0 ]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Data retention script completed successfully" | tee -a "$LOG_FILE"
else
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ❌ Data retention script failed" | tee -a "$LOG_FILE"
  exit 1
fi
