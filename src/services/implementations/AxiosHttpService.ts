/**
 * Axios HTTP Service Implementation
 * SOLID: Dependency Inversion - Implements IHttpService interface
 * Adapts Axios to the IHttpService abstraction
 */

import axios, { 
  type AxiosInstance, 
  type AxiosRequestConfig, 
  type AxiosResponse 
} from 'axios';
import type { IHttpService, RequestConfig } from '../../interfaces/services.ts';

interface AxiosHttpConfig {
  baseURL?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

/**
 * Axios HTTP Service Implementation
 * Provides HTTP client abstraction using Axios
 */
export class AxiosHttpService implements IHttpService {
  private client: AxiosInstance;
  private config: AxiosHttpConfig;
  private requestInterceptors: Array<(config: RequestConfig) => RequestConfig> = [];
  private responseInterceptors: Array<(response: unknown) => unknown> = [];

  constructor(config: AxiosHttpConfig = {}) {
    this.config = {
      baseURL: config.baseURL || '',
      timeout: config.timeout || 30000,
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000,
      ...config
    };

    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  // =============================================================================
  // HTTP METHODS
  // =============================================================================

  async get<T>(url: string, config?: RequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, this.convertConfig(config));
    return response.data;
  }

  async post<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, this.convertConfig(config));
    return response.data;
  }

  async put<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, this.convertConfig(config));
    return response.data;
  }

  async patch<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, this.convertConfig(config));
    return response.data;
  }

  async delete<T>(url: string, config?: RequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, this.convertConfig(config));
    return response.data;
  }

  // =============================================================================
  // FILE OPERATIONS
  // =============================================================================

  async upload<T>(url: string, file: File | FormData, config?: RequestConfig): Promise<T> {
    const formData = file instanceof FormData ? file : (() => {
      const data = new FormData();
      data.append('file', file);
      return data;
    })();

    const uploadConfig = this.convertConfig({
      ...config,
      headers: {
        ...config?.headers,
        'Content-Type': 'multipart/form-data',
      },
    });

    const response = await this.client.post<T>(url, formData, uploadConfig);
    return response.data;
  }

  async download(url: string, config?: RequestConfig): Promise<Blob> {
    const downloadConfig = this.convertConfig({
      ...config,
      responseType: 'blob',
    });

    const response = await this.client.get<Blob>(url, downloadConfig);
    return response.data;
  }

  // =============================================================================
  // CONFIGURATION
  // =============================================================================

  setBaseURL(url: string): void {
    this.config.baseURL = url;
    this.client.defaults.baseURL = url;
  }

  setDefaultHeader(key: string, value: string): void {
    this.client.defaults.headers[key] = value;
  }

  removeDefaultHeader(key: string): void {
    delete this.client.defaults.headers[key];
  }

  setTimeout(ms: number): void {
    this.config.timeout = ms;
    this.client.defaults.timeout = ms;
  }

  // =============================================================================
  // INTERCEPTORS
  // =============================================================================

  addRequestInterceptor(interceptor: (config: RequestConfig) => RequestConfig): void {
    this.requestInterceptors.push(interceptor);
    this.setupInterceptors();
  }

  addResponseInterceptor(interceptor: (response: unknown) => unknown): void {
    this.responseInterceptors.push(interceptor);
    this.setupInterceptors();
  }

  // =============================================================================
  // PRIVATE METHODS
  // =============================================================================

  private setupInterceptors(): void {
    // Clear existing interceptors
    this.client.interceptors.request.clear();
    this.client.interceptors.response.clear();

    // Request interceptor
    this.client.interceptors.request.use(
      (axiosConfig) => {
        // Convert Axios config to our RequestConfig format
        let config: RequestConfig = {
          headers: axiosConfig.headers as Record<string, string>,
          timeout: axiosConfig.timeout,
          params: axiosConfig.params,
          withCredentials: axiosConfig.withCredentials,
        };

        // Apply all registered interceptors
        for (const interceptor of this.requestInterceptors) {
          try {
            config = interceptor(config);
          } catch (error) {
            console.error('Request interceptor error:', error);
          }
        }

        // Convert back to Axios config
        return {
          ...axiosConfig,
          headers: config.headers || axiosConfig.headers,
          timeout: config.timeout || axiosConfig.timeout,
          params: config.params || axiosConfig.params,
          withCredentials: config.withCredentials !== undefined 
            ? config.withCredentials 
            : axiosConfig.withCredentials,
        };
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor with retry logic
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        // Apply response interceptors
        let processedResponse: unknown = response;
        
        for (const interceptor of this.responseInterceptors) {
          try {
            processedResponse = interceptor(processedResponse);
          } catch (error) {
            console.error('Response interceptor error:', error);
          }
        }

        return processedResponse as AxiosResponse;
      },
      async (error) => {
        const originalRequest = error.config;
        
        // Retry logic for network errors or 5xx responses
        if (
          !originalRequest._retry &&
          (originalRequest._retryCount || 0) < this.config.retryAttempts! &&
          this.shouldRetry(error)
        ) {
          originalRequest._retry = true;
          originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
          
          // Exponential backoff
          const delay = this.calculateRetryDelay(originalRequest._retryCount);
          await this.sleep(delay);
          
          console.warn(
            `Retrying request (attempt ${originalRequest._retryCount}/${this.config.retryAttempts}):`,
            originalRequest.url
          );
          
          return this.client(originalRequest);
        }
        
        // Handle authentication errors
        if (error.response?.status === 401) {
          sessionStorage.removeItem('csfrace-access-token');
          localStorage.removeItem('csfrace-refresh-token');
          // Dispatch event for auth context to handle
          window.dispatchEvent(new CustomEvent('auth_token_expired'));
        }
        
        return Promise.reject(error);
      }
    );
  }

  private convertConfig(config?: RequestConfig): AxiosRequestConfig {
    if (!config) return {};
    
    return {
      headers: config.headers,
      timeout: config.timeout,
      params: config.params,
      responseType: config.responseType as 'json' | 'blob' | 'text' | undefined,
      withCredentials: config.withCredentials,
    };
  }

  private shouldRetry(error: unknown): boolean {
    // Network errors
    if (!error || typeof error !== 'object') return false;
    
    const axiosError = error as { 
      code?: string; 
      response?: { status?: number }; 
    };
    
    // Network errors
    if (axiosError.code === 'NETWORK_ERROR' || 
        axiosError.code === 'ECONNABORTED') {
      return true;
    }
    
    // 5xx server errors (but not 401/403/404)
    if (axiosError.response?.status && axiosError.response.status >= 500) {
      return true;
    }
    
    return false;
  }

  private calculateRetryDelay(retryCount: number): number {
    // Exponential backoff with jitter
    const baseDelay = this.config.retryDelay!;
    const exponentialDelay = baseDelay * Math.pow(2, retryCount - 1);
    const jitter = Math.random() * 0.1 * exponentialDelay; // 10% jitter
    return Math.min(exponentialDelay + jitter, 30000); // Cap at 30 seconds
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // =============================================================================
  // DEBUGGING AND UTILITIES
  // =============================================================================

  /**
   * Get current configuration
   */
  getConfig(): AxiosHttpConfig {
    return { ...this.config };
  }

  /**
   * Get axios instance for advanced usage
   * @deprecated Use the interface methods instead
   */
  getAxiosInstance(): AxiosInstance {
    console.warn('getAxiosInstance() is deprecated. Use the interface methods instead.');
    return this.client;
  }

  /**
   * Test connectivity to the base URL
   */
  async testConnectivity(): Promise<boolean> {
    try {
      await this.get('/health');
      return true;
    } catch {
      return false;
    }
  }
}