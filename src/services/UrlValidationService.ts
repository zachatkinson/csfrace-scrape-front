/**
 * URL Validation Service
 * Single Responsibility: Validate URLs and detect WordPress sites
 * Extracted from UrlScraper to follow SOLID principles
 */

import { api } from '../lib/api.ts';

export interface UrlValidationResult {
  isValid: boolean;
  isWordPress: boolean;
  isAccessible: boolean;
  contentType?: string;
  error?: string;
  metadata?: {
    title?: string;
    description?: string;
    estimatedSize?: string;
    lastModified?: string;
  };
}

export interface UrlValidationEvents {
  onValidationStart: (url: string) => void;
  onValidationComplete: (url: string, result: UrlValidationResult) => void;
  onValidationError: (url: string, error: string) => void;
}

/**
 * URL Validation Service - Handles URL validation and WordPress detection
 */
export class UrlValidationService {
  private validationCache = new Map<string, UrlValidationResult>();
  private events: Partial<UrlValidationEvents> = {};

  constructor(events: Partial<UrlValidationEvents> = {}) {
    this.events = events;
  }

  /**
   * Validate a single URL
   */
  async validateUrl(url: string): Promise<UrlValidationResult> {
    // Check cache first
    const cached = this.validationCache.get(url);
    if (cached) {
      return cached;
    }

    this.events.onValidationStart?.(url);

    try {
      // Basic URL format validation
      new URL(url);
      
      // Call backend validation API
      const response = await api.validateUrl(url);
      
      let result: UrlValidationResult;
      
      if (response.success && response.data) {
        const validationData = response.data;
        result = {
          isValid: validationData.isValid,
          isWordPress: validationData.isWordPress,
          isAccessible: validationData.isAccessible,
        };
        
        if (validationData.contentType != null) {
          result.contentType = validationData.contentType;
        }
        
        if (validationData.metadata != null) {
          result.metadata = validationData.metadata;
        }
      } else {
        result = {
          isValid: false,
          isWordPress: false,
          isAccessible: false,
          error: response.error || 'Validation failed'
        };
      }
      
      // Cache successful validations
      if (result.isValid) {
        this.validationCache.set(url, result);
      }
      
      this.events.onValidationComplete?.(url, result);
      return result;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid URL format';
      const result: UrlValidationResult = {
        isValid: false,
        isWordPress: false,
        isAccessible: false,
        error: errorMessage
      };
      
      this.events.onValidationError?.(url, errorMessage);
      return result;
    }
  }

  /**
   * Validate multiple URLs
   */
  async validateUrls(urls: string[]): Promise<Map<string, UrlValidationResult>> {
    const results = new Map<string, UrlValidationResult>();
    
    // Process in parallel with concurrency limit
    const CONCURRENT_VALIDATIONS = 3;
    
    for (let i = 0; i < urls.length; i += CONCURRENT_VALIDATIONS) {
      const batch = urls.slice(i, i + CONCURRENT_VALIDATIONS);
      const batchPromises = batch.map(async (url) => {
        const result = await this.validateUrl(url);
        return { url, result };
      });
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((settledResult) => {
        if (settledResult.status === 'fulfilled') {
          results.set(settledResult.value.url, settledResult.value.result);
        }
      });
    }
    
    return results;
  }

  /**
   * Check if URL is likely a WordPress site (fast heuristic)
   */
  isLikelyWordPress(url: string): boolean {
    const lowerUrl = url.toLowerCase();
    
    // Common WordPress URL patterns
    const wpIndicators = [
      '/wp-content/',
      '/wp-admin/',
      '/wp-includes/',
      'wordpress',
      '/blog/',
      '/?p=',
      '/category/',
      '/tag/',
      '/feed/',
      '/wp-json/'
    ];
    
    return wpIndicators.some(indicator => lowerUrl.includes(indicator));
  }

  /**
   * Extract domain from URL
   */
  extractDomain(url: string): string | null {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return null;
    }
  }

  /**
   * Normalize URL for validation
   */
  normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      
      // Ensure HTTPS for better compatibility
      if (urlObj.protocol === 'http:') {
        urlObj.protocol = 'https:';
      }
      
      // Remove trailing slash
      if (urlObj.pathname.endsWith('/') && urlObj.pathname.length > 1) {
        urlObj.pathname = urlObj.pathname.slice(0, -1);
      }
      
      return urlObj.toString();
    } catch {
      return url;
    }
  }

  /**
   * Clear validation cache
   */
  clearCache(): void {
    this.validationCache.clear();
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.validationCache.size;
  }

  /**
   * Get validation statistics
   */
  getValidationStats(): {
    cacheSize: number;
    cachedUrls: string[];
  } {
    return {
      cacheSize: this.validationCache.size,
      cachedUrls: Array.from(this.validationCache.keys()),
    };
  }
}

export default UrlValidationService;