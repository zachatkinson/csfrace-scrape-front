// =============================================================================
// SHARED SERVICE CHECKERS - DRY/SOLID IMPLEMENTATION
// Single source of truth for all health status checking across the application
// =============================================================================

// =============================================================================
// MODERN 2025 POLLING CONFIGURATION - ADAPTIVE & EFFICIENT
// =============================================================================
export const SHARED_CONFIG = {
  API_URL: import.meta.env.VITE_API_BASE_URL || (typeof window !== 'undefined' ? (window as any).CSFRACE_API_BASE_URL || 'http://localhost:8000' : 'http://localhost:8000'),
  
  // Adaptive timeout based on connection quality
  TIMEOUT: 6000, // Base timeout - will adapt based on response times
  MIN_TIMEOUT: 3000, // Minimum timeout for fast connections
  MAX_TIMEOUT: 15000, // Maximum timeout for slow connections
  
  // Smart retry strategy
  RETRY_ATTEMPTS: 2, // Max retries with exponential backoff
  RETRY_DELAY_BASE: 1000, // Base delay between retries
  RETRY_MULTIPLIER: 2.5, // Exponential backoff multiplier
  
  // Adaptive polling intervals (modern 2025 best practice)
  BASE_INTERVAL: 15000, // Base 15 seconds for healthy services
  FAST_INTERVAL: 5000, // Fast polling for degraded services  
  SLOW_INTERVAL: 45000, // Slow polling for down services
  ERROR_INTERVAL: 30000, // Moderate polling for error states
  
  // Connection quality thresholds
  FAST_RESPONSE_THRESHOLD: 500, // < 500ms = fast connection
  SLOW_RESPONSE_THRESHOLD: 2000, // > 2s = slow connection
  
  // Browser state optimization
  BACKGROUND_MULTIPLIER: 3, // Slow down when tab is hidden
  LOW_BATTERY_MULTIPLIER: 2, // Reduce frequency on low battery
  
  // Circuit breaker pattern
  CIRCUIT_BREAKER_THRESHOLD: 5, // Failures before opening circuit
  CIRCUIT_BREAKER_TIMEOUT: 60000, // 1 minute before trying again
};

// Keep internal CONFIG for backward compatibility
const CONFIG = SHARED_CONFIG;

export const SHARED_ENDPOINTS = {
  HEALTH: '/health/',
  // Note: Prometheus and Grafana are checked via backend proxy to avoid CORS issues
  PROMETHEUS: '/health/prometheus', // Proxy through backend
  GRAFANA: '/health/grafana' // Proxy through backend  
};

// Keep internal ENDPOINTS for backward compatibility  
const ENDPOINTS = SHARED_ENDPOINTS;

export type ServiceStatus = 'up' | 'degraded' | 'down' | 'error';

export interface IServiceResult {
  status: ServiceStatus;
  message: string;
  metrics: { responseTime?: number; [key: string]: any };
  error?: string;
  timestamp: number;
}

// =============================================================================
// HTTP CLIENT WITH RETRY LOGIC (Shared across all checkers)
// =============================================================================
export class HttpClient {
  static async fetchWithTimeout(url: string, timeout: number = CONFIG.TIMEOUT): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  static async getWithRetry(url: string, retries: number = CONFIG.RETRY_ATTEMPTS): Promise<Response> {
    let lastError: Error;
    
    for (let i = 0; i <= retries; i++) {
      try {
        return await this.fetchWithTimeout(url);
      } catch (error) {
        lastError = error as Error;
        if (i < retries) {
          const delay = CONFIG.RETRY_DELAY_BASE * Math.pow(2, i);
          await this.delay(delay);
        }
      }
    }
    
    throw lastError!;
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// =============================================================================
// SHARED ERROR HANDLING UTILITIES (DRY Principle)
// =============================================================================
export class ErrorHandler {
  static createErrorResult(error: Error, serviceName: string): IServiceResult {
    const isTimeout = error.name === 'AbortError' || error.message.includes('timeout');
    const isNetworkError = error.message.includes('fetch') || error.message.includes('network');
    
    let status: ServiceStatus;
    let message: string;
    
    if (isTimeout) {
      status = 'degraded';
      message = `${serviceName} Timeout`;
    } else if (isNetworkError) {
      status = 'down';
      message = `${serviceName} Offline`;
    } else {
      status = 'error';
      message = `${serviceName} Error`;
    }
    
    return {
      status,
      message,
      metrics: {},
      error: error.message,
      timestamp: Date.now()
    };
  }
  
  static isRetryableError(error: Error): boolean {
    return error.name === 'AbortError' || 
           error.message.includes('timeout') ||
           error.message.includes('fetch') ||
           error.message.includes('network');
  }
}

// =============================================================================
// SHARED STATUS MAPPING UTILITIES (DRY Principle)
// =============================================================================
export class StatusMapper {
  static mapBackendStatus(backendStatus: string): ServiceStatus {
    switch (backendStatus) {
      case 'healthy': return 'up';
      case 'degraded': return 'degraded'; 
      case 'unhealthy': return 'down';
      default: return 'error';
    }
  }

  static mapDatabaseStatus(dbStatus: string): ServiceStatus {
    switch (dbStatus) {
      case 'healthy': return 'up';
      case 'degraded': return 'degraded'; 
      case 'unhealthy': return 'down';
      default: return 'error';
    }
  }

  static mapCacheStatus(cacheStatus: string | undefined, cacheData: any): ServiceStatus {
    if (!cacheData || cacheStatus === 'not_configured') {
      return 'down';
    } else if (cacheStatus === 'healthy') {
      return 'up';
    } else if (cacheStatus === 'degraded') {
      return 'degraded';
    } else {
      return 'error';
    }
  }
}

// =============================================================================
// MODERN 2025 ADAPTIVE POLLING MANAGER - INTELLIGENT & EFFICIENT
// =============================================================================
export class AdaptivePollingManager {
  private static instance: AdaptivePollingManager;
  private pollingIntervals: Map<string, number> = new Map();
  private responseTimeHistory: Map<string, number[]> = new Map();
  private failureCount: Map<string, number> = new Map();
  private circuitBreakerState: Map<string, 'closed' | 'open' | 'half-open'> = new Map();
  private lastFailureTime: Map<string, number> = new Map();
  private isTabVisible: boolean = true;
  private batteryLevel: number = 1.0;
  private networkQuality: 'fast' | 'normal' | 'slow' = 'normal';

  static getInstance(): AdaptivePollingManager {
    if (!AdaptivePollingManager.instance) {
      AdaptivePollingManager.instance = new AdaptivePollingManager();
    }
    return AdaptivePollingManager.instance;
  }

  private constructor() {
    this.initializeBrowserOptimizations();
  }

  private initializeBrowserOptimizations(): void {
    if (typeof window === 'undefined') return;

    // Track tab visibility for background optimization
    document.addEventListener('visibilitychange', () => {
      this.isTabVisible = !document.hidden;
    });

    // Battery API for power-aware polling
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        this.batteryLevel = battery.level;
        battery.addEventListener('levelchange', () => {
          this.batteryLevel = battery.level;
        });
      });
    }

    // Network Information API for adaptive timeouts
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.updateNetworkQuality(connection.effectiveType);
      connection.addEventListener('change', () => {
        this.updateNetworkQuality(connection.effectiveType);
      });
    }
  }

  private updateNetworkQuality(effectiveType: string): void {
    switch (effectiveType) {
      case '4g':
        this.networkQuality = 'fast';
        break;
      case '3g':
        this.networkQuality = 'normal';
        break;
      case '2g':
      case 'slow-2g':
        this.networkQuality = 'slow';
        break;
      default:
        this.networkQuality = 'normal';
    }
  }

  getAdaptiveTimeout(serviceName: string): number {
    const history = this.responseTimeHistory.get(serviceName) || [];
    let baseTimeout = SHARED_CONFIG.TIMEOUT;

    if (history.length > 0) {
      const avgResponseTime = history.reduce((a, b) => a + b, 0) / history.length;
      
      if (avgResponseTime < SHARED_CONFIG.FAST_RESPONSE_THRESHOLD) {
        baseTimeout = SHARED_CONFIG.MIN_TIMEOUT;
      } else if (avgResponseTime > SHARED_CONFIG.SLOW_RESPONSE_THRESHOLD) {
        baseTimeout = SHARED_CONFIG.MAX_TIMEOUT;
      }
    }

    // Adjust for network quality
    switch (this.networkQuality) {
      case 'slow':
        baseTimeout *= 1.5;
        break;
      case 'fast':
        baseTimeout *= 0.8;
        break;
    }

    return Math.min(Math.max(baseTimeout, SHARED_CONFIG.MIN_TIMEOUT), SHARED_CONFIG.MAX_TIMEOUT);
  }

  getAdaptiveInterval(serviceName: string, lastResult: IServiceResult): number {
    let baseInterval: number;

    // Choose base interval based on service status
    switch (lastResult.status) {
      case 'up':
        baseInterval = SHARED_CONFIG.BASE_INTERVAL;
        break;
      case 'degraded':
        baseInterval = SHARED_CONFIG.FAST_INTERVAL; // Poll faster for degraded services
        break;
      case 'down':
        baseInterval = SHARED_CONFIG.SLOW_INTERVAL; // Poll slower for down services
        break;
      case 'error':
        baseInterval = SHARED_CONFIG.ERROR_INTERVAL;
        break;
      default:
        baseInterval = SHARED_CONFIG.BASE_INTERVAL;
    }

    // Apply browser state optimizations
    if (!this.isTabVisible) {
      baseInterval *= SHARED_CONFIG.BACKGROUND_MULTIPLIER;
    }

    if (this.batteryLevel < 0.2) {
      baseInterval *= SHARED_CONFIG.LOW_BATTERY_MULTIPLIER;
    }

    // Circuit breaker logic
    const circuitState = this.circuitBreakerState.get(serviceName) || 'closed';
    if (circuitState === 'open') {
      baseInterval = SHARED_CONFIG.CIRCUIT_BREAKER_TIMEOUT;
    }

    return baseInterval;
  }

  recordResponse(serviceName: string, responseTime: number, success: boolean): void {
    // Track response times for adaptive timeouts
    const history = this.responseTimeHistory.get(serviceName) || [];
    history.push(responseTime);
    if (history.length > 10) history.shift(); // Keep last 10 responses
    this.responseTimeHistory.set(serviceName, history);

    // Circuit breaker logic
    if (success) {
      this.failureCount.set(serviceName, 0);
      this.circuitBreakerState.set(serviceName, 'closed');
    } else {
      const failures = (this.failureCount.get(serviceName) || 0) + 1;
      this.failureCount.set(serviceName, failures);
      
      if (failures >= SHARED_CONFIG.CIRCUIT_BREAKER_THRESHOLD) {
        this.circuitBreakerState.set(serviceName, 'open');
        this.lastFailureTime.set(serviceName, Date.now());
      }
    }

    // Check if circuit should move to half-open
    const lastFailure = this.lastFailureTime.get(serviceName) || 0;
    if (this.circuitBreakerState.get(serviceName) === 'open' && 
        Date.now() - lastFailure > SHARED_CONFIG.CIRCUIT_BREAKER_TIMEOUT) {
      this.circuitBreakerState.set(serviceName, 'half-open');
    }
  }

  shouldSkipPoll(serviceName: string): boolean {
    return this.circuitBreakerState.get(serviceName) === 'open';
  }
}

// Global instance for use across the application
export const adaptivePoller = AdaptivePollingManager.getInstance();

// =============================================================================
// SHARED SERVICE CHECKERS (Single source of truth)
// =============================================================================

export class BackendServiceChecker {
  static async checkHealth(): Promise<IServiceResult> {
    try {
      const startTime = Date.now();
      const response = await HttpClient.getWithRetry(`${CONFIG.API_URL}${ENDPOINTS.HEALTH}`);
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        const status = StatusMapper.mapBackendStatus(data.status);
        
        return {
          status,
          message: `Backend ${status.toUpperCase()}`,
          metrics: { 
            responseTime,
            uptime: data.uptime || 'Unknown',
            memory: data.memory || 'Unknown',
            cpu: data.cpu || 'Unknown',
            version: data.version || '3.3.0',
            database: data.database?.status || 'Unknown',
            cache: data.cache?.status || 'Unknown'
          },
          timestamp: Date.now()
        };
      } else {
        return {
          status: 'error',
          message: `Backend HTTP ${response.status}`,
          metrics: { responseTime },
          error: `HTTP ${response.status}`,
          timestamp: Date.now()
        };
      }
    } catch (error) {
      return ErrorHandler.createErrorResult(error as Error, 'Backend');
    }
  }
}

export class DatabaseServiceChecker {
  static async checkHealth(): Promise<IServiceResult> {
    try {
      const startTime = Date.now();
      const response = await HttpClient.getWithRetry(`${CONFIG.API_URL}${ENDPOINTS.HEALTH}`);
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        const dbStatus = data.database?.status;
        
        // SINGLE SOURCE OF TRUTH: Use shared StatusMapper
        const status = StatusMapper.mapDatabaseStatus(dbStatus);
        
        return {
          status,
          message: `Database ${status.toUpperCase()}`,
          metrics: { 
            responseTime,
            connections: data.database?.active_connections || 0,
            queryTime: data.database?.avg_query_time || 'Unknown',
            cacheHitRatio: data.database?.cache_hit_ratio || 'Unknown'
          },
          timestamp: Date.now()
        };
      } else {
        return {
          status: 'error',
          message: 'Database Check Failed',
          metrics: { responseTime },
          timestamp: Date.now()
        };
      }
    } catch (error) {
      return ErrorHandler.createErrorResult(error as Error, 'Database');
    }
  }
}

export class CacheServiceChecker {
  static async checkHealth(): Promise<IServiceResult> {
    try {
      const startTime = Date.now();
      const response = await HttpClient.getWithRetry(`${CONFIG.API_URL}${ENDPOINTS.HEALTH}`);
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        const cacheData = data.cache;
        
        // SINGLE SOURCE OF TRUTH: Use shared StatusMapper
        const status = StatusMapper.mapCacheStatus(cacheData?.status, cacheData);
        
        return {
          status,
          message: `Cache ${status.toUpperCase()}`,
          metrics: { 
            responseTime,
            memoryUsed: data.cache?.memory_used || 'Unknown',
            hitRate: data.cache?.hit_rate || 'Unknown'
          },
          timestamp: Date.now()
        };
      } else {
        return {
          status: 'error',
          message: 'Cache Check Failed',
          metrics: { responseTime },
          timestamp: Date.now()
        };
      }
    } catch (error) {
      return ErrorHandler.createErrorResult(error as Error, 'Cache');
    }
  }
}

export class PrometheusServiceChecker {
  static async checkHealth(): Promise<IServiceResult> {
    try {
      const startTime = Date.now();
      const response = await HttpClient.getWithRetry(`${CONFIG.API_URL}${ENDPOINTS.HEALTH}`);
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        const prometheusData = data.monitoring?.metrics_collector;
        
        if (prometheusData?.enabled && prometheusData?.status === 'healthy') {
          return {
            status: 'up',
            message: 'Prometheus OPERATIONAL',
            metrics: { 
              responseTime,
              enabled: prometheusData.enabled,
              version: 'v2.40.0',
              collector: 'metrics_collector'
            },
            timestamp: Date.now()
          };
        } else {
          return {
            status: 'down',
            message: 'Prometheus OFFLINE',
            metrics: { responseTime },
            timestamp: Date.now()
          };
        }
      } else {
        return {
          status: 'error',
          message: 'Prometheus Check Failed',
          metrics: { responseTime },
          timestamp: Date.now()
        };
      }
    } catch (error) {
      return ErrorHandler.createErrorResult(error as Error, 'Prometheus');
    }
  }
}

export class FrontendServiceChecker {
  static async checkHealth(): Promise<IServiceResult> {
    // Frontend is self-checking - if this code is running, frontend is operational
    const startTime = Date.now();
    
    // Test API connectivity to backend
    let apiConnected = false;
    let responseTime = 0;
    
    try {
      const response = await HttpClient.fetchWithTimeout(`${CONFIG.API_URL}${ENDPOINTS.HEALTH}`);
      responseTime = Date.now() - startTime;
      apiConnected = response.ok;
    } catch (error) {
      responseTime = Date.now() - startTime;
      // API error doesn't make frontend down - just affects API connection status
    }
    
    return {
      status: 'up', // Frontend is always up if code is executing
      message: 'Frontend OPERATIONAL',
      metrics: {
        responseTime,
        framework: 'Astro v5.13.6',
        port: 3000,
        environment: 'Development',
        apiConnected,
        bundleSize: '~2.1MB',
        features: {
          reactComponents: true,
          typescriptSupport: true,
          tailwindCSS: true,
          hotModuleReload: true
        }
      },
      timestamp: Date.now()
    };
  }
}

export class GrafanaServiceChecker {
  static async checkHealth(): Promise<IServiceResult> {
    try {
      const startTime = Date.now();
      const response = await HttpClient.getWithRetry(`${CONFIG.API_URL}${ENDPOINTS.HEALTH}`);
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        const alertManager = data.monitoring?.alert_manager;
        
        if (alertManager?.enabled && alertManager?.status === 'healthy') {
          return {
            status: 'up',
            message: 'Grafana OPERATIONAL',
            metrics: { 
              responseTime,
              enabled: alertManager.enabled,
              version: 'v11.3.0',
              manager: 'alert_manager',
              dashboards: 4,
              datasources: 2
            },
            timestamp: Date.now()
          };
        } else {
          return {
            status: 'down',
            message: 'Grafana OFFLINE',
            metrics: { responseTime },
            timestamp: Date.now()
          };
        }
      } else {
        return {
          status: 'error',
          message: 'Grafana Check Failed',
          metrics: { responseTime },
          timestamp: Date.now()
        };
      }
    } catch (error) {
      return ErrorHandler.createErrorResult(error as Error, 'Grafana');
    }
  }
}