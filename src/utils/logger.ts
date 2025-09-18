/**
 * Enterprise-Grade Logger Utility
 * SOLID Principles: Single Responsibility, Open/Closed, Dependency Inversion
 * DRY Principle: Centralized logging with consistent behavior
 *
 * Replaces console.log statements with structured, configurable logging
 * Supports multiple environments, levels, and output formats
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4,
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string | undefined;
  data?: unknown | undefined;
  source?: string | undefined;
  correlationId?: string | undefined;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableStorage: boolean;
  maxStorageEntries: number;
  contextPrefix?: string;
  includeStackTrace: boolean;
}

/**
 * Logger Interface - Interface Segregation Principle
 * Clean abstraction for different logger implementations
 */
export interface ILogger {
  debug(message: string, data?: unknown, context?: string): void;
  info(message: string, data?: unknown, context?: string): void;
  warn(message: string, data?: unknown, context?: string): void;
  error(message: string, data?: unknown, context?: string): void;
  critical(message: string, data?: unknown, context?: string): void;
  setLevel(level: LogLevel): void;
  getEntries(): LogEntry[];
  clearEntries(): void;
}

/**
 * Production Logger Implementation
 * Single Responsibility: Structured logging with storage and filtering
 * Open/Closed: Extensible for new output formats without modification
 */
export class Logger implements ILogger {
  private config: LoggerConfig;
  private entries: LogEntry[] = [];
  private correlationId: string;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: LogLevel.INFO,
      enableConsole: true,
      enableStorage: false,
      maxStorageEntries: 1000,
      includeStackTrace: false,
      ...config,
    };

    this.correlationId = this.generateCorrelationId();
  }

  /**
   * Debug level logging - Development insights
   */
  debug(message: string, data?: unknown, context?: string): void {
    this.log(LogLevel.DEBUG, message, data, context);
  }

  /**
   * Info level logging - General information
   */
  info(message: string, data?: unknown, context?: string): void {
    this.log(LogLevel.INFO, message, data, context);
  }

  /**
   * Warning level logging - Non-critical issues
   */
  warn(message: string, data?: unknown, context?: string): void {
    this.log(LogLevel.WARN, message, data, context);
  }

  /**
   * Error level logging - Errors that need attention
   */
  error(message: string, data?: unknown, context?: string): void {
    this.log(LogLevel.ERROR, message, data, context);
  }

  /**
   * Critical level logging - System-critical issues
   */
  critical(message: string, data?: unknown, context?: string): void {
    this.log(LogLevel.CRITICAL, message, data, context);
  }

  /**
   * Set minimum log level - Open/Closed principle
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * Get all stored log entries
   */
  getEntries(): LogEntry[] {
    return [...this.entries];
  }

  /**
   * Clear stored log entries
   */
  clearEntries(): void {
    this.entries = [];
  }

  /**
   * Core logging implementation - DRY principle
   */
  private log(
    level: LogLevel,
    message: string,
    data?: unknown,
    context?: string,
  ): void {
    // Filter by log level
    if (level < this.config.level) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message: this.formatMessage(message),
      context: this.formatContext(context),
      data: this.sanitizeData(data),
      source: this.getSource(),
      correlationId: this.correlationId,
    };

    // Store entry if enabled
    if (this.config.enableStorage) {
      this.storeEntry(entry);
    }

    // Console output if enabled
    if (this.config.enableConsole) {
      this.outputToConsole(entry);
    }
  }

  /**
   * Format message with context prefix
   */
  private formatMessage(message: string): string {
    const prefix = this.config.contextPrefix;
    return prefix ? `[${prefix}] ${message}` : message;
  }

  /**
   * Format context for display
   */
  private formatContext(context?: string): string | undefined {
    return context ? `[${context}]` : undefined;
  }

  /**
   * Sanitize data for logging - Security consideration
   */
  private sanitizeData(data: unknown): unknown {
    if (!data) return undefined;

    // Remove sensitive fields
    if (typeof data === "object" && data !== null) {
      const sensitiveFields = ["password", "token", "key", "secret", "auth"];
      const sanitized = { ...(data as Record<string, unknown>) };

      sensitiveFields.forEach((field) => {
        Object.keys(sanitized).forEach((key) => {
          if (key.toLowerCase().includes(field)) {
            sanitized[key] = "[REDACTED]";
          }
        });
      });

      return sanitized;
    }

    return data;
  }

  /**
   * Get source location if stack trace enabled
   */
  private getSource(): string | undefined {
    if (!this.config.includeStackTrace) return undefined;

    try {
      const stack = new Error().stack;
      const lines = stack?.split("\n") || [];
      // Find the first non-logger line
      const sourceLine = lines.find(
        (line) =>
          line.includes(".ts") &&
          !line.includes("logger.ts") &&
          !line.includes("Logger"),
      );

      return sourceLine
        ? sourceLine.trim().replace(/^\s*at\s+/, "")
        : undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Store log entry with rotation
   */
  private storeEntry(entry: LogEntry): void {
    this.entries.push(entry);

    // Rotate entries if over limit
    if (this.entries.length > this.config.maxStorageEntries) {
      this.entries = this.entries.slice(-this.config.maxStorageEntries);
    }
  }

  /**
   * Output to console with appropriate method
   */
  private outputToConsole(entry: LogEntry): void {
    const formattedMessage = this.formatConsoleMessage(entry);

    switch (entry.level) {
      case LogLevel.DEBUG:
        // eslint-disable-next-line no-console
        console.debug(formattedMessage, entry.data);
        break;
      case LogLevel.INFO:
        // eslint-disable-next-line no-console
        console.info(formattedMessage, entry.data);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, entry.data);
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage, entry.data);
        break;
      case LogLevel.CRITICAL:
        console.error(`🚨 CRITICAL: ${formattedMessage}`, entry.data);
        break;
    }
  }

  /**
   * Format message for console output
   */
  private formatConsoleMessage(entry: LogEntry): string {
    const parts = [
      `[${entry.timestamp}]`,
      `[${LogLevel[entry.level]}]`,
      entry.context || "",
      entry.message,
    ].filter(Boolean);

    return parts.join(" ");
  }

  /**
   * Generate unique correlation ID for request tracking
   */
  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}

/**
 * Development Logger - Simplified for development use
 * Dependency Inversion: Same interface, different implementation
 */
export class DevLogger implements ILogger {
  private level: LogLevel = LogLevel.DEBUG;

  debug(message: string, data?: unknown, context?: string): void {
    if (this.level <= LogLevel.DEBUG) {
      // eslint-disable-next-line no-console
      console.debug(
        `🐛 [DEBUG]${context ? ` [${context}]` : ""} ${message}`,
        data || "",
      );
    }
  }

  info(message: string, data?: unknown, context?: string): void {
    if (this.level <= LogLevel.INFO) {
      // eslint-disable-next-line no-console
      console.info(
        `ℹ️ [INFO]${context ? ` [${context}]` : ""} ${message}`,
        data || "",
      );
    }
  }

  warn(message: string, data?: unknown, context?: string): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(
        `⚠️ [WARN]${context ? ` [${context}]` : ""} ${message}`,
        data || "",
      );
    }
  }

  error(message: string, data?: unknown, context?: string): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(
        `❌ [ERROR]${context ? ` [${context}]` : ""} ${message}`,
        data || "",
      );
    }
  }

  critical(message: string, data?: unknown, context?: string): void {
    console.error(
      `🚨 [CRITICAL]${context ? ` [${context}]` : ""} ${message}`,
      data || "",
    );
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  getEntries(): LogEntry[] {
    return [];
  }

  clearEntries(): void {
    // No-op for dev logger
  }
}

/**
 * Logger Factory - Factory Pattern with Environment Detection
 * Single Responsibility: Creates appropriate logger for environment
 */
export class LoggerFactory {
  private static instance: ILogger | null = null;

  /**
   * Get singleton logger instance
   * Dependency Inversion: Returns interface, not concrete class
   */
  static getLogger(): ILogger {
    if (!this.instance) {
      this.instance = this.createLogger();
    }
    return this.instance;
  }

  /**
   * Create logger based on environment
   */
  private static createLogger(): ILogger {
    const isDevelopment = import.meta.env.DEV;
    const isTest = import.meta.env.MODE === "test";

    if (isDevelopment || isTest) {
      return new DevLogger();
    }

    return new Logger({
      level: LogLevel.INFO,
      enableConsole: true,
      enableStorage: true,
      maxStorageEntries: 1000,
      includeStackTrace: false,
    });
  }

  /**
   * Reset singleton instance - useful for testing
   */
  static reset(): void {
    this.instance = null;
  }
}

/**
 * Singleton Logger Instance - Convenience Export
 * Following DRY principle for consistent access
 */
export const logger = LoggerFactory.getLogger();

/**
 * Context Logger Creator - Dependency Injection Pattern
 * Creates logger with predefined context for modules
 */
export function createContextLogger(context: string): ILogger {
  const baseLogger = LoggerFactory.getLogger();

  return {
    debug: (message: string, data?: unknown) =>
      baseLogger.debug(message, data, context),
    info: (message: string, data?: unknown) =>
      baseLogger.info(message, data, context),
    warn: (message: string, data?: unknown) =>
      baseLogger.warn(message, data, context),
    error: (message: string, data?: unknown) =>
      baseLogger.error(message, data, context),
    critical: (message: string, data?: unknown) =>
      baseLogger.critical(message, data, context),
    setLevel: (level: LogLevel) => baseLogger.setLevel(level),
    getEntries: () => baseLogger.getEntries(),
    clearEntries: () => baseLogger.clearEntries(),
  };
}

/**
 * Specialized Logger Instances - Domain-Specific Loggers
 * Following Single Responsibility and Interface Segregation principles
 */
export const uiLogger = createContextLogger("UI");
export const apiLogger = createContextLogger("API");

/**
 * API Call Logger - Specialized utility for API logging
 * Single Responsibility: Logs API calls with structured data
 */
export function logApiCall(
  method: string,
  url: string,
  status?: number,
  duration?: number,
  error?: Error,
): void {
  const data = {
    method,
    url,
    status,
    duration: duration ? `${duration.toFixed(2)}ms` : undefined,
    error: error?.message,
  };

  if (error || (status && status >= 400)) {
    apiLogger.error(`API call failed: ${method} ${url}`, data);
  } else {
    apiLogger.info(`API call: ${method} ${url}`, data);
  }
}

/**
 * Performance Logger - Specialized for timing operations
 * Single Responsibility: Performance measurement logging
 */
export class PerformanceLogger {
  private static timers: Map<string, number> = new Map();
  private static logger = createContextLogger("Performance");

  /**
   * Start timing an operation
   */
  static startTimer(operation: string): void {
    this.timers.set(operation, performance.now());
    this.logger.debug(`Timer started: ${operation}`);
  }

  /**
   * End timing and log duration
   */
  static endTimer(operation: string): number {
    const startTime = this.timers.get(operation);
    if (!startTime) {
      this.logger.warn(`Timer not found for operation: ${operation}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.timers.delete(operation);

    this.logger.info(`${operation} completed`, {
      duration: `${duration.toFixed(2)}ms`,
    });
    return duration;
  }

  /**
   * Log slow operation warning
   */
  static checkSlowOperation(operation: string, threshold: number = 1000): void {
    const startTime = this.timers.get(operation);
    if (!startTime) return;

    const elapsed = performance.now() - startTime;
    if (elapsed > threshold) {
      this.logger.warn(`Slow operation detected: ${operation}`, {
        elapsed: `${elapsed.toFixed(2)}ms`,
        threshold: `${threshold}ms`,
      });
    }
  }
}

export default {
  Logger,
  DevLogger,
  LoggerFactory,
  logger,
  createContextLogger,
  uiLogger,
  apiLogger,
  logApiCall,
  PerformanceLogger,
  LogLevel,
};
