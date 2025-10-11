#!/bin/bash

# Log file location
LOG_FILE="/home/ubuntu/ingest.log"

# Function to log with timestamp
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Calculate yesterday's date (market closes after hours)
START_DATE=$(date -d "yesterday" +%Y-%m-%d)
END_DATE=$(date -d "yesterday" +%Y-%m-%d)

log "Starting data ingest for $START_DATE to $END_DATE"

# Call ingest endpoint
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "http://localhost:3000/ingest/$START_DATE/$END_DATE")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  log "✅ Ingest completed successfully"
  log "Response: $BODY"
else
  log "❌ Ingest failed with HTTP code $HTTP_CODE"
  log "Response: $BODY"
  exit 1
fi