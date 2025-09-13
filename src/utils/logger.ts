/**
 * Environment-Based Logging Utility
 * Provides clean console output based on environment
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  isDevelopment: boolean;
  minLevel: LogLevel;
  enableEmojis: boolean;
}

class Logger {
  private config: LoggerConfig;
  private readonly levelOrder: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };

  constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      isDevelopment: import.meta.env.DEV,
      minLevel: import.meta.env.DEV ? 'debug' : 'warn',
      enableEmojis: import.meta.env.DEV,
      ...config
    };
  }

  private shouldLog(level: LogLevel): boolean {
    return this.levelOrder[level] >= this.levelOrder[this.config.minLevel];
  }

  private formatMessage(level: LogLevel, message: string, emoji?: string): string {
    const timestamp = new Date().toISOString();
    const emojiPrefix = this.config.enableEmojis && emoji ? `${emoji} ` : '';
    
    if (this.config.isDevelopment) {
      return `${emojiPrefix}${message}`;
    }
    
    // Production format: cleaner, more professional
    return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  }

  debug(message: string, data?: any, emoji = '🔍'): void {
    if (!this.shouldLog('debug')) return;
    
    const formattedMessage = this.formatMessage('debug', message, emoji);
    if (data !== undefined) {
      console.debug(formattedMessage, data);
    } else {
      console.debug(formattedMessage);
    }
  }

  info(message: string, data?: any, emoji = '✅'): void {
    if (!this.shouldLog('info')) return;
    
    const formattedMessage = this.formatMessage('info', message, emoji);
    if (data !== undefined) {
      console.info(formattedMessage, data);
    } else {
      console.info(formattedMessage);
    }
  }

  warn(message: string, data?: any, emoji = '⚠️'): void {
    if (!this.shouldLog('warn')) return;
    
    const formattedMessage = this.formatMessage('warn', message, emoji);
    if (data !== undefined) {
      console.warn(formattedMessage, data);
    } else {
      console.warn(formattedMessage);
    }
  }

  error(message: string, error?: any, emoji = '❌'): void {
    if (!this.shouldLog('error')) return;
    
    const formattedMessage = this.formatMessage('error', message, emoji);
    if (error !== undefined) {
      console.error(formattedMessage, error);
    } else {
      console.error(formattedMessage);
    }
  }

  // Specialized methods for common use cases
  apiCall(method: string, url: string, data?: any): void {
    this.debug(`API ${method.toUpperCase()}: ${url}`, data, '📡');
  }

  apiResponse(status: number, url: string, data?: any): void {
    const emoji = status < 400 ? '✅' : '❌';
    const level = status < 400 ? 'debug' : 'error';
    this[level](`API Response [${status}]: ${url}`, data, emoji);
  }

  metrics(serviceName: string, data: any): void {
    this.debug(`Metrics update: ${serviceName}`, data, '📊');
  }

  health(serviceName: string, status: string, data?: any): void {
    const emoji = status === 'up' || status === 'healthy' ? '✅' : '❌';
    this.info(`${serviceName} health: ${status}`, data, emoji);
  }

  auth(action: string, data?: any): void {
    this.info(`Auth: ${action}`, data, '🔐');
  }

  performance(operation: string, duration: number): void {
    const emoji = duration < 1000 ? '⚡' : duration < 5000 ? '🐌' : '🐌💀';
    this.debug(`Performance: ${operation} took ${duration}ms`, undefined, emoji);
  }
}

// Create singleton logger instance
export const logger = new Logger();

// Export individual methods for convenience
export const logDebug = logger.debug.bind(logger);
export const logInfo = logger.info.bind(logger);
export const logWarn = logger.warn.bind(logger);
export const logError = logger.error.bind(logger);

// Specialized exports
export const logApiCall = logger.apiCall.bind(logger);
export const logApiResponse = logger.apiResponse.bind(logger);
export const logMetrics = logger.metrics.bind(logger);
export const logHealth = logger.health.bind(logger);
export const logAuth = logger.auth.bind(logger);
export const logPerformance = logger.performance.bind(logger);

export default logger;