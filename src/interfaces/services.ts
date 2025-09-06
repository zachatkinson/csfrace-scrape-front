/**
 * Service Interfaces for Dependency Injection
 * SOLID: Dependency Inversion Principle - Depend on abstractions, not concretions!
 */

import type { 
  ApiResponse, 
  ConversionJob, 
  ConversionOptions, 
  UrlValidationResult, 
  BatchRequest,
  ConversionStats,
  User,
  AuthTokens,
  LoginCredentials,
  RegisterData,
  PasswordChangeData,
  PasswordResetRequest,
  PasswordResetConfirm,
  UserProfile,
  OAuthProvider
} from '../types';

// =============================================================================
// API SERVICE INTERFACE
// =============================================================================

/**
 * API Service Interface
 * Abstraction for all backend API communication
 * Allows swapping implementations (REST, GraphQL, Mock, etc.)
 */
export interface IApiService {
  // System endpoints
  healthCheck(): Promise<ApiResponse<{ status: string; version: string }>>;
  getSystemConfig(): Promise<ApiResponse<{
    maxConcurrentJobs: number;
    supportedFormats: string[];
    features: string[];
  }>>;

  // URL validation
  validateUrl(url: string): Promise<ApiResponse<UrlValidationResult>>;

  // Job management
  submitJob(url: string, options: ConversionOptions): Promise<ApiResponse<ConversionJob>>;
  getJob(jobId: string): Promise<ApiResponse<ConversionJob>>;
  getJobs(params?: {
    status?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
  }): Promise<ApiResponse<ConversionJob[]>>;
  cancelJob(jobId: string): Promise<ApiResponse<ConversionJob>>;
  deleteJob(jobId: string): Promise<ApiResponse<void>>;
  retryJob(jobId: string): Promise<ApiResponse<ConversionJob>>;
  downloadJobResult(jobId: string, format?: 'html' | 'json'): Promise<Blob>;

  // Batch processing
  submitBatch(urls: string[], options: ConversionOptions, name?: string): Promise<ApiResponse<BatchRequest>>;
  getBatch(batchId: string): Promise<ApiResponse<BatchRequest>>;
  getBatches(): Promise<ApiResponse<BatchRequest[]>>;
  uploadFile(file: File, options: ConversionOptions): Promise<ApiResponse<BatchRequest>>;

  // Statistics
  getStats(period?: { start: string; end: string }): Promise<ApiResponse<ConversionStats>>;

  // Configuration
  updateConfig(config: Record<string, unknown>): void;
  getConfig(): Record<string, unknown>;
}

// =============================================================================
// AUTH SERVICE INTERFACE
// =============================================================================

/**
 * Authentication Service Interface
 * Abstraction for authentication operations
 * Allows swapping auth providers (Firebase, Auth0, Custom, etc.)
 */
export interface IAuthService {
  // Basic authentication
  login(credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }>;
  register(data: RegisterData): Promise<{ user: User; tokens: AuthTokens }>;
  logout(): Promise<void>;
  refreshToken(): Promise<AuthTokens>;

  // Password management
  changePassword(data: PasswordChangeData): Promise<void>;
  requestPasswordReset(data: PasswordResetRequest): Promise<void>;
  confirmPasswordReset(data: PasswordResetConfirm): Promise<void>;

  // OAuth operations
  getAvailableOAuthProviders(): Promise<OAuthProvider[]>;
  startOAuthFlow(provider: string, usePopup?: boolean): Promise<void>;
  handleOAuthCallback(provider: string, code: string, state: string, error?: string | null): Promise<{ user: User; tokens: AuthTokens }>;

  // User management
  getCurrentUser(): Promise<User | null>;
  updateProfile(profile: Partial<UserProfile>): Promise<User>;
  refreshProfile(): Promise<User>;

  // Session management
  isAuthenticated(): boolean;
  getAuthState(): { user: User | null; tokens: AuthTokens | null; isAuthenticated: boolean };
  clearSession(): Promise<void>;
  
  // Events and lifecycle
  destroy(): void;
}

// =============================================================================
// STORAGE SERVICE INTERFACE
// =============================================================================

/**
 * Storage Service Interface
 * Abstraction for data storage operations
 * Allows swapping storage providers (localStorage, sessionStorage, IndexedDB, etc.)
 */
export interface IStorageService {
  // Basic storage operations
  setItem<T>(key: string, value: T): Promise<void>;
  getItem<T>(key: string): Promise<T | null>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
  
  // Batch operations
  setItems<T>(items: Array<{ key: string; value: T }>): Promise<void>;
  getItems<T>(keys: string[]): Promise<Array<{ key: string; value: T | null }>>;
  removeItems(keys: string[]): Promise<void>;
  
  // Key management
  getAllKeys(): Promise<string[]>;
  hasItem(key: string): Promise<boolean>;
  
  // Storage info
  getStorageInfo(): Promise<{
    type: 'localStorage' | 'sessionStorage' | 'indexedDB' | 'memory';
    size: number;
    available: number;
    persistent: boolean;
  }>;
  
  // Event handling
  onStorageChange?(callback: (key: string, newValue: unknown, oldValue: unknown) => void): () => void;
}

// =============================================================================
// CACHE SERVICE INTERFACE
// =============================================================================

/**
 * Cache Service Interface
 * Abstraction for caching operations
 * Allows swapping cache providers (Memory, Redis, IndexedDB, etc.)
 */
export interface ICacheService {
  // Basic cache operations
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  
  // Batch operations
  getMany<T>(keys: string[]): Promise<Array<{ key: string; value: T | null }>>;
  setMany<T>(items: Array<{ key: string; value: T; ttl?: number }>): Promise<void>;
  deleteMany(keys: string[]): Promise<void>;
  
  // Key management
  has(key: string): Promise<boolean>;
  keys(pattern?: string): Promise<string[]>;
  
  // Cache statistics
  getStats(): Promise<{
    hits: number;
    misses: number;
    size: number;
    memoryUsage: number;
  }>;
  
  // TTL management
  expire(key: string, ttl: number): Promise<void>;
  ttl(key: string): Promise<number>;
}

// =============================================================================
// HTTP SERVICE INTERFACE
// =============================================================================

/**
 * HTTP Service Interface
 * Abstraction for HTTP client operations
 * Allows swapping HTTP clients (axios, fetch, custom, etc.)
 */
export interface IHttpService {
  // Basic HTTP methods
  get<T>(url: string, config?: RequestConfig): Promise<T>;
  post<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T>;
  put<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T>;
  patch<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T>;
  delete<T>(url: string, config?: RequestConfig): Promise<T>;
  
  // File operations
  upload<T>(url: string, file: File | FormData, config?: RequestConfig): Promise<T>;
  download(url: string, config?: RequestConfig): Promise<Blob>;
  
  // Configuration
  setBaseURL(url: string): void;
  setDefaultHeader(key: string, value: string): void;
  removeDefaultHeader(key: string): void;
  setTimeout(ms: number): void;
  
  // Interceptors
  addRequestInterceptor(interceptor: (config: RequestConfig) => RequestConfig): void;
  addResponseInterceptor(interceptor: (response: unknown) => unknown): void;
}

export interface RequestConfig {
  headers?: Record<string, string>;
  timeout?: number;
  params?: Record<string, unknown>;
  responseType?: 'json' | 'blob' | 'text';
  withCredentials?: boolean;
}

// =============================================================================
// NOTIFICATION SERVICE INTERFACE
// =============================================================================

/**
 * Notification Service Interface
 * Abstraction for user notifications
 * Allows swapping notification providers (toast, browser, push, etc.)
 */
export interface INotificationService {
  // Basic notifications
  success(message: string, options?: NotificationOptions): void;
  error(message: string, options?: NotificationOptions): void;
  warning(message: string, options?: NotificationOptions): void;
  info(message: string, options?: NotificationOptions): void;
  
  // Advanced notifications
  show(notification: NotificationConfig): string; // Returns notification ID
  update(id: string, updates: Partial<NotificationConfig>): void;
  dismiss(id: string): void;
  dismissAll(): void;
  
  // Notification management
  getActiveNotifications(): NotificationConfig[];
  setGlobalConfig(config: Partial<NotificationGlobalConfig>): void;
}

export interface NotificationOptions {
  duration?: number;
  persistent?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  actions?: Array<{ label: string; action: () => void }>;
}

export interface NotificationConfig extends NotificationOptions {
  id?: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  title?: string;
  icon?: string;
}

export interface NotificationGlobalConfig {
  position: NotificationOptions['position'];
  duration: number;
  maxNotifications: number;
  animations: boolean;
}

// =============================================================================
// SERVICE REGISTRY INTERFACE
// =============================================================================

/**
 * Service Registry Interface
 * Central registry for dependency injection
 * Manages service lifecycle and dependencies
 */
export interface IServiceRegistry {
  // Service registration
  register<T>(name: string, factory: () => T): void;
  registerSingleton<T>(name: string, factory: () => T): void;
  registerInstance<T>(name: string, instance: T): void;
  
  // Service resolution
  resolve<T>(name: string): T;
  resolveOptional<T>(name: string): T | null;
  
  // Service management
  unregister(name: string): void;
  isRegistered(name: string): boolean;
  clear(): void;
  
  // Lifecycle hooks
  onRegister(callback: (name: string) => void): () => void;
  onUnregister(callback: (name: string) => void): () => void;
}

// =============================================================================
// COMPOSITE SERVICE INTERFACES
// =============================================================================

/**
 * Service Container Interface
 * Main dependency injection container
 * Provides unified access to all services
 */
export interface IServiceContainer {
  // Service accessors
  readonly api: IApiService;
  readonly auth: IAuthService;
  readonly storage: IStorageService;
  readonly cache: ICacheService;
  readonly http: IHttpService;
  readonly notifications: INotificationService;
  
  // Container management
  configure(config: ServiceContainerConfig): void;
  reset(): void;
  dispose(): void;
}

export interface ServiceContainerConfig {
  api?: {
    baseURL?: string;
    timeout?: number;
    retries?: number;
  };
  auth?: {
    provider?: 'custom' | 'firebase' | 'auth0';
    autoRefresh?: boolean;
  };
  storage?: {
    provider?: 'localStorage' | 'sessionStorage' | 'indexedDB';
    prefix?: string;
  };
  cache?: {
    provider?: 'memory' | 'indexedDB';
    defaultTTL?: number;
  };
  notifications?: {
    position?: NotificationOptions['position'];
    duration?: number;
  };
}