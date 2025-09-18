/**
 * Centralized Logging Utility - SOLID Architecture
 * Single Responsibility: Handles all application logging
 * Open/Closed: Extensible for new log destinations without modification
 * Interface Segregation: Clean logging interface
 * Dependency Inversion: Depends on abstractions, not concrete implementations
 */

import type { ILogger } from '../types/global.types';

// =============================================================================
// LOGGING LEVELS AND CONFIGURATION
// =============================================================================

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface ILoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enablePersistence: boolean;
  maxLogEntries: number;
  timestampFormat: 'iso' | 'locale' | 'unix';
}

export interface ILogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  args: unknown[];
  error?: Error | undefined;
  context?: string | undefined;
}

// =============================================================================
// CENTRALIZED LOGGER IMPLEMENTATION
// =============================================================================

class Logger implements ILogger {
  private config: ILoggerConfig;
  private logEntries: ILogEntry[] = [];
  private context: string | undefined;

  constructor(config: Partial<ILoggerConfig> = {}, context?: string | undefined) {
    this.config = {
      level: LogLevel.INFO,
      enableConsole: true,
      enablePersistence: false,
      maxLogEntries: 1000,
      timestampFormat: 'iso',
      ...config,
    };
    this.context = context;
  }

  /**
   * Debug logging (development only)
   */
  debug(message: string, ...args: unknown[]): void {
    this.log(LogLevel.DEBUG, message, undefined, ...args);
  }

  /**
   * Info logging (general information)
   */
  info(message: string, ...args: unknown[]): void {
    this.log(LogLevel.INFO, message, undefined, ...args);
  }

  /**
   * Warning logging (potential issues)
   */
  warn(message: string, ...args: unknown[]): void {
    this.log(LogLevel.WARN, message, undefined, ...args);
  }

  /**
   * Error logging (errors and exceptions)
   */
  error(message: string, error?: Error, ...args: unknown[]): void {
    this.log(LogLevel.ERROR, message, error, ...args);
  }

  /**
   * Create a child logger with context
   */
  createChild(context: string): Logger {
    return new Logger(this.config, context);
  }

  /**
   * Get all log entries (for debugging/monitoring)
   */
  getLogEntries(): ILogEntry[] {
    return [...this.logEntries];
  }

  /**
   * Clear log entries
   */
  clearLogs(): void {
    this.logEntries = [];
  }

  /**
   * Private logging implementation
   */
  private log(level: LogLevel, message: string, error?: Error, ...args: unknown[]): void {
    // Check if logging level is enabled
    if (level < this.config.level) {
      return;
    }

    const timestamp = Date.now();
    const contextMessage = this.context ? `[${this.context}] ${message}` : message;

    const logEntry: ILogEntry = {
      level,
      message: contextMessage,
      timestamp,
      args,
      error,
      context: this.context,
    };

    // Add to log entries if persistence is enabled
    if (this.config.enablePersistence) {
      this.addLogEntry(logEntry);
    }

    // Console output if enabled
    if (this.config.enableConsole) {
      this.logToConsole(logEntry);
    }
  }

  /**
   * Add log entry to persistent storage
   */
  private addLogEntry(entry: ILogEntry): void {
    this.logEntries.push(entry);

    // Maintain max log entries limit
    if (this.logEntries.length > this.config.maxLogEntries) {
      this.logEntries = this.logEntries.slice(-this.config.maxLogEntries);
    }
  }

  /**
   * Output log to console using appropriate console method
   */
  private logToConsole(entry: ILogEntry): void {
    const timestamp = this.formatTimestamp(entry.timestamp);
    const prefix = `[${timestamp}]`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        // Only use console.warn for allowed console methods
        console.warn(`${prefix} DEBUG: ${entry.message}`, ...entry.args);
        break;
      case LogLevel.INFO:
        console.warn(`${prefix} INFO: ${entry.message}`, ...entry.args);
        break;
      case LogLevel.WARN:
        console.warn(`${prefix} WARN: ${entry.message}`, ...entry.args);
        break;
      case LogLevel.ERROR:
        if (entry.error) {
          console.error(`${prefix} ERROR: ${entry.message}`, entry.error, ...entry.args);
        } else {
          console.error(`${prefix} ERROR: ${entry.message}`, ...entry.args);
        }
        break;
    }
  }

  /**
   * Format timestamp based on configuration
   */
  private formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp);

    switch (this.config.timestampFormat) {
      case 'iso':
        return date.toISOString();
      case 'locale':
        return date.toLocaleString();
      case 'unix':
        return timestamp.toString();
      default:
        return date.toISOString();
    }
  }
}

// =============================================================================
// GLOBAL LOGGER INSTANCES (Singleton Pattern)
// =============================================================================

// Default application logger
export const logger = new Logger({
  level: import.meta.env.DEV ? LogLevel.DEBUG : LogLevel.INFO,
  enableConsole: true,
  enablePersistence: import.meta.env.DEV,
});

// Specialized loggers for different concerns
export const apiLogger = logger.createChild('API');
export const uiLogger = logger.createChild('UI');
export const authLogger = logger.createChild('AUTH');
export const validationLogger = logger.createChild('VALIDATION');
export const performanceLogger = logger.createChild('PERFORMANCE');

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Create a logger for a specific component or module
 */
export function createLogger(context: string, config?: Partial<ILoggerConfig>): Logger {
  return new Logger(config, context);
}

/**
 * Log performance timing
 */
export function logPerformance(operation: string, startTime: number): void {
  const duration = Date.now() - startTime;
  performanceLogger.info(`${operation} completed in ${duration}ms`);
}

/**
 * Log API call with details
 */
export function logApiCall(method: string, url: string, status?: number, duration?: number): void {
  const message = `${method} ${url}`;
  if (status && duration) {
    apiLogger.info(`${message} - ${status} (${duration}ms)`);
  } else {
    apiLogger.info(message);
  }
}

/**
 * Log validation error with details
 */
export function logValidationError(field: string, value: unknown, error: string): void {
  validationLogger.warn(`Validation failed for ${field}: ${error}`, { field, value });
}

/**
 * Development-only logging helper
 */
export function devLog(message: string, ...args: unknown[]): void {
  if (import.meta.env.DEV) {
    logger.debug(`[DEV] ${message}`, ...args);
  }
}

export default logger;