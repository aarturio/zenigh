const parquet = require('parquetjs');
const fs = require('fs');
const path = require('path');

class ParquetOperations {
  static DATA_DIR = './data/parquet_files';

  // Initialize data directory
  static async initializeStorage() {
    if (!fs.existsSync(this.DATA_DIR)) {
      fs.mkdirSync(this.DATA_DIR, { recursive: true });
      console.log(`Created parquet storage directory: ${this.DATA_DIR}`);
    }
  }

  // Define parquet schema for market data
  static getMarketDataSchema() {
    return new parquet.ParquetSchema({
      symbol: { type: 'UTF8' },
      timestamp: { type: 'TIMESTAMP_MILLIS' },
      open: { type: 'DOUBLE' },
      high: { type: 'DOUBLE' },
      low: { type: 'DOUBLE' },
      close: { type: 'DOUBLE' },
      volume: { type: 'INT64' },
      trade_count: { type: 'INT32', optional: true },
      vwap: { type: 'DOUBLE', optional: true }
    });
  }

  // Save daily market data to parquet file
  static async saveDailyData(date, marketData) {
    await this.initializeStorage();
    
    const filename = `market_data_${date}.parquet`;
    const filepath = path.join(this.DATA_DIR, filename);
    
    const schema = this.getMarketDataSchema();
    const writer = await parquet.ParquetWriter.openFile(schema, filepath);
    
    try {
      // Convert data to parquet format
      for (const record of marketData) {
        const parquetRecord = {
          symbol: record.symbol,
          timestamp: new Date(record.timestamp),
          open: record.open,
          high: record.high,
          low: record.low,
          close: record.close,
          volume: record.volume,
          trade_count: record.trade_count || null,
          vwap: record.vwap || null
        };
        
        await writer.appendRow(parquetRecord);
      }
      
      await writer.close();
      console.log(`Saved ${marketData.length} records to ${filepath}`);
      return filepath;
    } catch (error) {
      await writer.close();
      throw error;
    }
  }

  // Load daily market data from parquet file
  static async loadDailyData(date) {
    const filename = `market_data_${date}.parquet`;
    const filepath = path.join(this.DATA_DIR, filename);
    
    if (!fs.existsSync(filepath)) {
      throw new Error(`Parquet file not found for date: ${date}`);
    }
    
    const reader = await parquet.ParquetReader.openFile(filepath);
    const cursor = reader.getCursor();
    
    const records = [];
    let record = null;
    
    while (record = await cursor.next()) {
      records.push({
        symbol: record.symbol,
        timestamp: record.timestamp,
        open: record.open,
        high: record.high,
        low: record.low,
        close: record.close,
        volume: Number(record.volume), // Convert BigInt to Number
        trade_count: record.trade_count,
        vwap: record.vwap
      });
    }
    
    await reader.close();
    console.log(`Loaded ${records.length} records from ${filepath}`);
    return records;
  }

  // Check if parquet file exists for a given date
  static hasDataForDate(date) {
    const filename = `market_data_${date}.parquet`;
    const filepath = path.join(this.DATA_DIR, filename);
    return fs.existsSync(filepath);
  }

  // List all available parquet files
  static getAvailableDates() {
    if (!fs.existsSync(this.DATA_DIR)) {
      return [];
    }
    
    return fs.readdirSync(this.DATA_DIR)
      .filter(file => file.endsWith('.parquet'))
      .map(file => file.replace('market_data_', '').replace('.parquet', ''))
      .sort();
  }

  // Get file info for a date
  static getFileInfo(date) {
    const filename = `market_data_${date}.parquet`;
    const filepath = path.join(this.DATA_DIR, filename);
    
    if (!fs.existsSync(filepath)) {
      return null;
    }
    
    const stats = fs.statSync(filepath);
    return {
      date,
      filename,
      filepath,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime
    };
  }

  // Generate date range for bulk operations
  static generateDateRange(startDate, endDate) {
    const dates = [];
    const current = new Date(startDate);
    const end = new Date(endDate);
    
    while (current <= end) {
      // Skip weekends (market closed)
      if (current.getDay() !== 0 && current.getDay() !== 6) {
        dates.push(current.toISOString().split('T')[0]);
      }
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  }
}

module.exports = ParquetOperations;