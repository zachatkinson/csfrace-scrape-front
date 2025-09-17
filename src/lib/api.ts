/**
 * API Client
 * HTTP client for communicating with the WordPress to Shopify backend
 * Includes retry logic, error handling, and type safety
 */

import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { getApiBaseUrl, API_CONFIG } from '../constants/api.ts';
import { TIMING_CONSTANTS } from '../constants/timing.ts';
import { logger, logError } from '../utils/logger.ts';
import type { 
  ApiResponse, 
  ConversionJob, 
  ConversionOptions, 
  UrlValidationResult, 
  BatchRequest,
  ConversionStats
} from '../types';

// Environment configuration
interface ApiConfig {
  baseURL: string;
  apiKey?: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

// Default configuration
const defaultConfig: ApiConfig = {
  baseURL: getApiBaseUrl(),
  apiKey: import.meta.env.VITE_API_KEY,
  timeout: API_CONFIG.DEFAULT_TIMEOUT,
  retryAttempts: API_CONFIG.DEFAULT_RETRIES,
  retryDelay: TIMING_CONSTANTS.API.RETRY_DELAY_BASE,
};

/**
 * API Client Class
 */
class ApiClient {
  private client: AxiosInstance;
  private config: ApiConfig;
  
  constructor(config: Partial<ApiConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    
    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey && { 'X-API-Key': this.config.apiKey }),
      },
    });
    
    this.setupInterceptors();
  }
  
  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add timestamp to prevent caching
        if (config.method === 'get') {
          config.params = {
            ...config.params,
            _t: Date.now(),
          };
        }
        
        // Add auth token if available
        const token = sessionStorage.getItem('csfrace-access-token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
    
    // Response interceptor with retry logic
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // Retry logic for network errors or 5xx responses
        if (
          !originalRequest._retry &&
          originalRequest._retryCount < this.config.retryAttempts &&
          (error.code === 'NETWORK_ERROR' ||
           error.code === 'ECONNABORTED' ||
           (error.response && error.response.status >= 500))
        ) {
          originalRequest._retry = true;
          originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
          
          // Exponential backoff
          const delay = TIMING_CONSTANTS.HELPERS.exponentialBackoff(originalRequest._retryCount, this.config.retryDelay);
          await new Promise(resolve => setTimeout(resolve, delay));
          
          logger.warn(`Retrying request (attempt ${originalRequest._retryCount}/${this.config.retryAttempts})`);
          
          return this.client(originalRequest);
        }
        
        // Handle authentication errors using secure token storage
        if (error.response?.status === 401) {
          // Clear tokens using secure storage system
          const { clearStoredTokens } = await import('../utils/auth-tokens');
          clearStoredTokens();
          // Don't redirect here - let the AuthContext handle it
        }
        
        return Promise.reject(error);
      }
    );
  }
  
  /**
   * Generic request method with error handling
   */
  private async request<T>(
    config: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.client(config);
      return response.data;
    } catch (error: unknown) {
      logError('API request failed', error);
      
      // Format error response
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data: ApiResponse<T> } };
        if (axiosError.response?.data) {
          return axiosError.response.data;
        }
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      return {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      };
    }
  }
  
  // =============================================================================
  // PUBLIC API METHODS
  // =============================================================================
  
  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<ApiResponse<{ status: string; version: string }>> {
    return this.request({
      method: 'GET',
      url: '/health',
    });
  }
  
  /**
   * Validate WordPress URL (Note: Backend doesn't have this endpoint yet)
   * This is a placeholder implementation that does basic validation
   */
  async validateUrl(url: string): Promise<ApiResponse<UrlValidationResult>> {
    try {
      // Basic URL validation first
      new URL(url);
      
      // For now, return a basic validation response
      // In the future, this could call a real backend validation endpoint
      return {
        success: true,
        data: {
          isValid: true,
          isWordPress: url.includes('wordpress') || url.includes('wp-'),
          isAccessible: true,
          contentType: 'post',
          metadata: {
            title: 'WordPress Content',
            description: 'Ready for conversion',
            estimatedSize: '2.4 MB'
          }
        },
        timestamp: new Date().toISOString()
      };
    } catch {
      return {
        success: false,
        error: 'Invalid URL format',
        timestamp: new Date().toISOString()
      };
    }
  }
  
  /**
   * Submit conversion job
   */
  async submitJob(
    url: string,
    _options: ConversionOptions
  ): Promise<ApiResponse<ConversionJob>> {
    return this.request({
      method: 'POST',
      url: '/jobs',
      data: { url },
    });
  }
  
  /**
   * Get job status
   */
  async getJob(jobId: string): Promise<ApiResponse<ConversionJob>> {
    return this.request({
      method: 'GET',
      url: `/jobs/${jobId}`,
    });
  }
  
  /**
   * Get all jobs
   */
  async getJobs(params?: {
    status?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
  }): Promise<ApiResponse<ConversionJob[]>> {
    return this.request({
      method: 'GET',
      url: '/jobs',
      params,
    });
  }
  
  /**
   * Cancel job
   */
  async cancelJob(jobId: string): Promise<ApiResponse<ConversionJob>> {
    return this.request({
      method: 'POST',
      url: `/jobs/${jobId}/cancel`,
    });
  }
  
  /**
   * Delete job
   */
  async deleteJob(jobId: string): Promise<ApiResponse<void>> {
    return this.request({
      method: 'DELETE',
      url: `/jobs/${jobId}`,
    });
  }
  
  /**
   * Retry failed job
   */
  async retryJob(jobId: string): Promise<ApiResponse<ConversionJob>> {
    return this.request({
      method: 'POST',
      url: `/jobs/${jobId}/retry`,
    });
  }
  
  /**
   * Download job result
   */
  async downloadJobResult(
    jobId: string,
    format: 'html' | 'json' = 'html'
  ): Promise<Blob> {
    const response = await this.client({
      method: 'GET',
      url: `/jobs/${jobId}/download`,
      params: { format },
      responseType: 'blob',
    });
    
    return response.data;
  }
  
  /**
   * Submit batch request
   */
  async submitBatch(
    urls: string[],
    _options: ConversionOptions,
    name?: string
  ): Promise<ApiResponse<BatchRequest>> {
    return this.request({
      method: 'POST',
      url: '/batches',
      data: { 
        name: name || `Batch ${new Date().toISOString()}`,
        urls
      },
    });
  }
  
  /**
   * Get batch status
   */
  async getBatch(batchId: string): Promise<ApiResponse<BatchRequest>> {
    return this.request({
      method: 'GET',
      url: `/batches/${batchId}`,
    });
  }
  
  /**
   * Get all batches
   */
  async getBatches(): Promise<ApiResponse<BatchRequest[]>> {
    return this.request({
      method: 'GET',
      url: '/batches',
    });
  }
  
  /**
   * Get conversion statistics
   */
  async getStats(period?: {
    start: string;
    end: string;
  }): Promise<ApiResponse<ConversionStats>> {
    return this.request({
      method: 'GET',
      url: '/stats',
      params: period,
    });
  }
  
  /**
   * Upload file for batch processing
   */
  async uploadFile(
    file: File,
    options: ConversionOptions
  ): Promise<ApiResponse<BatchRequest>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('options', JSON.stringify(options));
    
    return this.request({
      method: 'POST',
      url: '/upload',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
  
  /**
   * Get system configuration
   */
  async getSystemConfig(): Promise<ApiResponse<{
    maxConcurrentJobs: number;
    supportedFormats: string[];
    features: string[];
  }>> {
    return this.request({
      method: 'GET',
      url: '/config',
    });
  }
  
  /**
   * Update API configuration
   */
  updateConfig(config: Partial<ApiConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Update axios instance
    this.client.defaults.baseURL = this.config.baseURL;
    this.client.defaults.timeout = this.config.timeout;
    
    if (this.config.apiKey) {
      this.client.defaults.headers['X-API-Key'] = this.config.apiKey;
    }
  }
  
  /**
   * Get current configuration
   */
  getConfig(): ApiConfig {
    return { ...this.config };
  }
}

// Create default instance
const apiClient = new ApiClient();

// Export both the class and default instance
export { ApiClient };
export default apiClient;

// Convenience methods
export const api = {
  healthCheck: () => apiClient.healthCheck(),
  validateUrl: (url: string) => apiClient.validateUrl(url),
  submitJob: (url: string, options: ConversionOptions) => apiClient.submitJob(url, options),
  getJob: (jobId: string) => apiClient.getJob(jobId),
  getJobs: (params?: { status?: string; limit?: number; offset?: number; sortBy?: string }) => apiClient.getJobs(params),
  cancelJob: (jobId: string) => apiClient.cancelJob(jobId),
  deleteJob: (jobId: string) => apiClient.deleteJob(jobId),
  retryJob: (jobId: string) => apiClient.retryJob(jobId),
  downloadJobResult: (jobId: string, format?: 'html' | 'json') => apiClient.downloadJobResult(jobId, format),
  submitBatch: (urls: string[], options: ConversionOptions, name?: string) => apiClient.submitBatch(urls, options, name),
  getBatch: (batchId: string) => apiClient.getBatch(batchId),
  getBatches: () => apiClient.getBatches(),
  getStats: (period?: { start: string; end: string }) => apiClient.getStats(period),
  uploadFile: (file: File, options: ConversionOptions) => apiClient.uploadFile(file, options),
};