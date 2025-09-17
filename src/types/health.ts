/**
 * Health System Types - DRY/SOLID Implementation
 * Single Responsibility: Type definitions for health monitoring system
 */

export type ServiceStatus = 'up' | 'degraded' | 'down' | 'error';

export interface IServiceResult {
  status: ServiceStatus;
  message: string;
  metrics: { responseTime?: number; [key: string]: any };
  error?: string;
  timestamp: number;
}

export interface ISystemStats {
  totalRequests: number;
  avgResponseTime: number;
  errorRate: number;
  uptime: string;
}

export interface IServiceChecker {
  readonly serviceName: string;
  readonly endpoint: string;
  checkHealth(): Promise<IServiceResult>;
  updateUI(result: IServiceResult): void;
}

export interface ILatencyTest {
  timestamp: number;
  responseTime: number;
  service: string;
}

export interface IHealthDataConsumer {
  getLatestHealthData(): {services: any, overallStatus: any, timestamp: number} | null;
  requestRefresh(): void;
}

export interface IHealthServiceStatuses {
  frontend?: IServiceResult;
  backend?: IServiceResult;
  database?: IServiceResult;
  cache?: IServiceResult;
  [key: string]: IServiceResult | undefined;
}

export interface IConsolidatedHealthData {
  services: IHealthServiceStatuses;
  overallStatus: {
    status: ServiceStatus;
    message: string;
  };
  metadata: {
    timestamp: number;
    lastCheck: string;
  };
}