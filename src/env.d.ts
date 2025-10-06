/// <reference types="astro/client" />

// User type for authentication
interface User {
  id: string;
  username: string;
  email: string;
  fullName?: string;
  isActive: boolean;
  isSuperuser: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Extend Astro namespace for authentication middleware locals
declare global {
  namespace App {
    interface Locals {
      // Authentication state (set by middleware)
      user: User | null;
      isAuthenticated: boolean;
      isAdmin: boolean;

      // Rate limiting
      rateLimitRemaining?: number;
    }
  }
}

// Global Window extensions
declare global {
  interface Window {
    __healthSystemManager?: {
      connect: () => void;
      disconnect: () => void;
    };
    __healthStatusCleanup?: () => void;
    authenticatedHeader?: {
      init: () => Promise<void>;
      updateAuthUI: () => void;
      loadAuthState: () => Promise<void>;
    };
    CSFRACE_API_BASE_URL?: string;
    apiClient?: {
      setBaseURL: (url: string) => void;
    };
    healthStatusService?: {
      updateApiUrl: (url: string) => void;
    };
  }
}

interface HealthStatus {
  service: string;
  status: "up" | "down" | "error";
  responseTime?: number;
  lastChecked: Date;
  error?: string;
}

interface AppSettings {
  apiUrl: string;
  pollingInterval: number;
  theme: "light" | "dark" | "system";
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
  post<T = unknown>(
    endpoint: string,
    data: unknown,
    options?: RequestOptions,
  ): Promise<T>;
  put<T = unknown>(
    endpoint: string,
    data: unknown,
    options?: RequestOptions,
  ): Promise<T>;
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
// Test orchestrator notification
