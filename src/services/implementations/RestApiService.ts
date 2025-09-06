/**
 * REST API Service Implementation
 * SOLID: Dependency Inversion - Implements IApiService interface
 * Adapts the existing ApiClient to the IApiService interface
 */

import type { 
  IApiService,
  IHttpService,
  RequestConfig
} from '../../interfaces/services.ts';
import type { 
  ApiResponse, 
  ConversionJob, 
  ConversionOptions, 
  UrlValidationResult, 
  BatchRequest,
  ConversionStats
} from '../../types';

interface RestApiConfig {
  baseURL?: string;
  timeout?: number;
  retries?: number;
  apiKey?: string;
}

/**
 * REST API Service Implementation
 * Implements IApiService using HTTP service dependency injection
 */
export class RestApiService implements IApiService {
  private config: RestApiConfig;

  constructor(
    private http: IHttpService,
    config: RestApiConfig = {}
  ) {
    this.config = {
      baseURL: config.baseURL || '/api',
      timeout: config.timeout || 30000,
      retries: config.retries || 3,
      apiKey: config.apiKey,
      ...config
    };
    
    this.setupHttpClient();
  }

  private setupHttpClient(): void {
    // Configure the HTTP client
    this.http.setBaseURL(this.config.baseURL!);
    this.http.setTimeout(this.config.timeout!);
    
    // Set default headers
    this.http.setDefaultHeader('Content-Type', 'application/json');
    if (this.config.apiKey) {
      this.http.setDefaultHeader('X-API-Key', this.config.apiKey);
    }

    // Add auth token interceptor
    this.http.addRequestInterceptor((config: RequestConfig) => {
      const token = sessionStorage.getItem('csfrace-access-token');
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`
        };
      }
      return config;
    });
  }

  // =============================================================================
  // SYSTEM ENDPOINTS
  // =============================================================================

  async healthCheck(): Promise<ApiResponse<{ status: string; version: string }>> {
    try {
      return await this.http.get<ApiResponse<{ status: string; version: string }>>('/health');
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getSystemConfig(): Promise<ApiResponse<{
    maxConcurrentJobs: number;
    supportedFormats: string[];
    features: string[];
  }>> {
    try {
      return await this.http.get<ApiResponse<{
        maxConcurrentJobs: number;
        supportedFormats: string[];
        features: string[];
      }>>('/config');
    } catch (error) {
      return this.handleError(error);
    }
  }

  // =============================================================================
  // URL VALIDATION
  // =============================================================================

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

  // =============================================================================
  // JOB MANAGEMENT
  // =============================================================================

  async submitJob(url: string, options: ConversionOptions): Promise<ApiResponse<ConversionJob>> {
    try {
      return await this.http.post<ApiResponse<ConversionJob>>('/jobs', { 
        url, 
        options 
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getJob(jobId: string): Promise<ApiResponse<ConversionJob>> {
    try {
      return await this.http.get<ApiResponse<ConversionJob>>(`/jobs/${jobId}`);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getJobs(params?: {
    status?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
  }): Promise<ApiResponse<ConversionJob[]>> {
    try {
      return await this.http.get<ApiResponse<ConversionJob[]>>('/jobs', { params });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async cancelJob(jobId: string): Promise<ApiResponse<ConversionJob>> {
    try {
      return await this.http.post<ApiResponse<ConversionJob>>(`/jobs/${jobId}/cancel`);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async deleteJob(jobId: string): Promise<ApiResponse<void>> {
    try {
      return await this.http.delete<ApiResponse<void>>(`/jobs/${jobId}`);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async retryJob(jobId: string): Promise<ApiResponse<ConversionJob>> {
    try {
      return await this.http.post<ApiResponse<ConversionJob>>(`/jobs/${jobId}/retry`);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async downloadJobResult(jobId: string, format: 'html' | 'json' = 'html'): Promise<Blob> {
    try {
      return await this.http.download(`/jobs/${jobId}/download`, { 
        params: { format },
        responseType: 'blob'
      });
    } catch (error) {
      console.error('Download failed:', error);
      throw error;
    }
  }

  // =============================================================================
  // BATCH PROCESSING
  // =============================================================================

  async submitBatch(urls: string[], options: ConversionOptions, name?: string): Promise<ApiResponse<BatchRequest>> {
    try {
      return await this.http.post<ApiResponse<BatchRequest>>('/batches', {
        name: name || `Batch ${new Date().toISOString()}`,
        urls,
        options
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getBatch(batchId: string): Promise<ApiResponse<BatchRequest>> {
    try {
      return await this.http.get<ApiResponse<BatchRequest>>(`/batches/${batchId}`);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getBatches(): Promise<ApiResponse<BatchRequest[]>> {
    try {
      return await this.http.get<ApiResponse<BatchRequest[]>>('/batches');
    } catch (error) {
      return this.handleError(error);
    }
  }

  async uploadFile(file: File, options: ConversionOptions): Promise<ApiResponse<BatchRequest>> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('options', JSON.stringify(options));

      return await this.http.upload<ApiResponse<BatchRequest>>('/upload', formData);
    } catch (error) {
      return this.handleError(error);
    }
  }

  // =============================================================================
  // STATISTICS
  // =============================================================================

  async getStats(period?: { start: string; end: string }): Promise<ApiResponse<ConversionStats>> {
    try {
      return await this.http.get<ApiResponse<ConversionStats>>('/stats', { params: period });
    } catch (error) {
      return this.handleError(error);
    }
  }

  // =============================================================================
  // CONFIGURATION
  // =============================================================================

  updateConfig(config: Record<string, unknown>): void {
    this.config = { ...this.config, ...config } as RestApiConfig;
    this.setupHttpClient();
  }

  getConfig(): Record<string, unknown> {
    return { ...this.config };
  }

  // =============================================================================
  // ERROR HANDLING
  // =============================================================================

  private handleError<T>(error: unknown): ApiResponse<T> {
    console.error('API request failed:', error);
    
    // Format error response
    if (error && typeof error === 'object' && 'response' in error) {
      const httpError = error as { response?: { data: ApiResponse<T> } };
      if (httpError.response?.data) {
        return httpError.response.data;
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