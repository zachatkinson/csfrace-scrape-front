/// <reference types="astro/client" />

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

interface ApiClient {
  setBaseURL(url: string): void;
  get(endpoint: string, options?: any): Promise<any>;
  post(endpoint: string, data: any, options?: any): Promise<any>;
  put(endpoint: string, data: any, options?: any): Promise<any>;
  delete(endpoint: string, options?: any): Promise<any>;
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