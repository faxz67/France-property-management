/**
 * Professional Logger Utility
 * 
 * Replaces console.log with a proper logging system
 * Features:
 * - Different log levels (error, warn, info, debug)
 * - Timestamp on all logs
 * - File output option
 * - Production-safe (no sensitive data)
 * - Structured logging
 */

const fs = require('fs');
const path = require('path');

// Log levels
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

class Logger {
  constructor() {
    this.level = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'INFO' : 'DEBUG');
    this.enableFileLogging = process.env.ENABLE_FILE_LOGGING === 'true';
    this.logDir = process.env.LOG_DIR || 'logs';
    
    if (this.enableFileLogging) {
      this.ensureLogDirectory();
    }
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  getTimestamp() {
    return new Date().toISOString();
  }

  shouldLog(level) {
    const currentLevel = LOG_LEVELS[this.level.toUpperCase()] || LOG_LEVELS.INFO;
    const messageLevel = LOG_LEVELS[level.toUpperCase()];
    return messageLevel <= currentLevel;
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = this.getTimestamp();
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level}] ${message}${metaStr}`;
  }

  writeToFile(level, message, meta) {
    if (!this.enableFileLogging) return;

    try {
      const logFile = path.join(this.logDir, `app-${new Date().toISOString().split('T')[0]}.log`);
      const formattedMessage = this.formatMessage(level, message, meta) + '\n';
      fs.appendFileSync(logFile, formattedMessage);
    } catch (error) {
      // Fallback to console if file writing fails
      console.error('Failed to write to log file:', error.message);
    }
  }

  sanitizeMeta(meta) {
    // Remove sensitive fields
    const sanitized = { ...meta };
    const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'creditCard'];
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }

  error(message, meta = {}) {
    if (!this.shouldLog('ERROR')) return;
    
    const sanitizedMeta = this.sanitizeMeta(meta);
    const formatted = this.formatMessage('ERROR', message, sanitizedMeta);
    
    console.error(formatted);
    this.writeToFile('ERROR', message, sanitizedMeta);
  }

  warn(message, meta = {}) {
    if (!this.shouldLog('WARN')) return;
    
    const sanitizedMeta = this.sanitizeMeta(meta);
    const formatted = this.formatMessage('WARN', message, sanitizedMeta);
    
    console.warn(formatted);
    this.writeToFile('WARN', message, sanitizedMeta);
  }

  info(message, meta = {}) {
    if (!this.shouldLog('INFO')) return;
    
    const sanitizedMeta = this.sanitizeMeta(meta);
    const formatted = this.formatMessage('INFO', message, sanitizedMeta);
    
    // In production, use console.log for info
    // In development, use console.info for clarity
    if (process.env.NODE_ENV === 'production') {
      console.log(formatted);
    } else {
      console.info(formatted);
    }
    
    this.writeToFile('INFO', message, sanitizedMeta);
  }

  debug(message, meta = {}) {
    if (!this.shouldLog('DEBUG')) return;
    
    const sanitizedMeta = this.sanitizeMeta(meta);
    const formatted = this.formatMessage('DEBUG', message, sanitizedMeta);
    
    if (process.env.NODE_ENV !== 'production') {
      console.debug(formatted);
    }
    
    this.writeToFile('DEBUG', message, sanitizedMeta);
  }

  // Specialized logging methods
  apiRequest(method, url, meta = {}) {
    this.debug(`API Request: ${method} ${url}`, meta);
  }

  apiResponse(method, url, status, duration, meta = {}) {
    this.info(`API Response: ${method} ${url} ${status} (${duration}ms)`, meta);
  }

  dbQuery(query, duration, meta = {}) {
    this.debug(`DB Query: ${query} (${duration}ms)`, meta);
  }

  security(message, meta = {}) {
    this.warn(`SECURITY: ${message}`, meta);
  }

  // Log errors with stack trace
  exception(error, meta = {}) {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      ...meta
    };
    this.error(`Exception: ${error.message}`, errorInfo);
  }
}

// Create singleton instance
const logger = new Logger();

module.exports = logger;

