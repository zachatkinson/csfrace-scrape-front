/// <reference types="astro/client" />

// Extend Astro namespace for middleware locals
declare namespace App {
  interface Locals {
    rateLimitRemaining?: number;
  }
}

interface HealthStatus {
  service: string;
  status: 'up' | 'down' | 'error';
  responseTime?: number;
  lastChecked: Date;
  error?: string;
}

interface AppSettings {
  apiUrl: string;
  pollingInterval: number;
  theme: 'light' | 'dark' | 'system';
  timezone: string;
  dateFormat: string;
  soundEnabled: boolean;
  vibrateEnabled: boolean;
  notificationsEnabled: boolean;
  animationsEnabled: boolean;
  highContrastMode: boolean;
  language: string;
  developerMode: boolean;
}

interface HealthStatusService {
  updateApiUrl(url: string): void;
  startPolling(): void;
  stopPolling(): void;
  checkStatus(): Promise<HealthStatus[]>;
  getLatestStatus(): HealthStatus[];
}

interface RequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
  params?: Record<string, string | number | boolean>;
}

interface ApiClient {
  setBaseURL(url: string): void;
  get<T = unknown>(endpoint: string, options?: RequestOptions): Promise<T>;
  post<T = unknown>(endpoint: string, data: unknown, options?: RequestOptions): Promise<T>;
  put<T = unknown>(endpoint: string, data: unknown, options?: RequestOptions): Promise<T>;
  delete<T = unknown>(endpoint: string, options?: RequestOptions): Promise<T>;
}

declare global {
  interface Window {
    healthStatusService?: HealthStatusService;
    apiClient?: ApiClient;
    getAppSettings?: () => AppSettings;
    saveAppSettings?: (settings: AppSettings) => void;
    loadJobs?: () => void;
  }
}

export {};