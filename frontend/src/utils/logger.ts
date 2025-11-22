/**
 * Professional Logger Utility
 * Provides structured logging with levels and environment-aware output
 * @author Senior Developer
 * @version 1.0.0
 */

enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  error?: Error;
}

class Logger {
  private static instance: Logger;
  private isDevelopment: boolean;
  private logLevel: LogLevel;

  private constructor() {
    this.isDevelopment = import.meta.env.DEV;
    this.logLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private formatMessage(entry: LogEntry): string {
    const levelName = LogLevel[entry.level];
    return `[${entry.timestamp}] ${levelName}: ${entry.message}`;
  }

  private getIcon(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return '🔍';
      case LogLevel.INFO:
        return 'ℹ️';
      case LogLevel.WARN:
        return '⚠️';
      case LogLevel.ERROR:
        return '❌';
      default:
        return '📝';
    }
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error,
    };

    const formattedMessage = `${this.getIcon(level)} ${this.formatMessage(entry)}`;

    switch (level) {
      case LogLevel.DEBUG:
      case LogLevel.INFO:
        console.log(formattedMessage, context || '');
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, context || '');
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage, context || '', error || '');
        break;
    }
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  /**
   * API-specific logging methods
   */
  apiRequest(method: string, url: string, context?: Record<string, any>): void {
    this.debug(`API Request: ${method.toUpperCase()} ${url}`, context);
  }

  apiResponse(method: string, url: string, duration: number, status?: number): void {
    this.debug(`API Response: ${method.toUpperCase()} ${url} - ${duration}ms (${status || 'N/A'})`);
  }

  apiError(method: string, url: string, error: Error, context?: Record<string, any>): void {
    this.error(`API Error: ${method.toUpperCase()} ${url}`, error, context);
  }

  /**
   * Performance logging
   */
  performance(operation: string, duration: number): void {
    if (duration > 1000) {
      this.warn(`Slow operation: ${operation} took ${duration}ms`);
    } else {
      this.debug(`Performance: ${operation} completed in ${duration}ms`);
    }
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Export convenience methods
export const { debug, info, warn, error, apiRequest, apiResponse, apiError, performance } = logger;

