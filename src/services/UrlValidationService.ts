/**
 * URL Validation Service
 * SOLID: Single Responsibility - URL validation logic
 * DRY: Reusable validation methods for URLs
 */

import type { UrlValidationResult } from "../types";

export interface UrlValidationConfig {
  onValidationStart?: () => void;
  onValidationComplete?: (url: string, result: UrlValidationResult) => void;
  onValidationError?: (url: string, error: string) => void;
}

export class UrlValidationService {
  private config: UrlValidationConfig;
  private static readonly SHOPIFY_DOMAIN_REGEX = /\.myshopify\.com$/;
  private static readonly WORDPRESS_PATTERNS = [
    /\/wp-content\//,
    /\/wp-admin\//,
    /\/wp-includes\//,
    /wordpress/i,
  ];

  constructor(config: UrlValidationConfig = {}) {
    this.config = config;
  }

  /**
   * Validate URL with callbacks
   */
  async validateUrl(url: string): Promise<UrlValidationResult> {
    this.config.onValidationStart?.();

    try {
      if (!UrlValidationService.isValidUrl(url)) {
        const result: UrlValidationResult = {
          isValid: false,
          isWordPress: false,
          isAccessible: false,
          error: "Invalid URL format",
        };
        this.config.onValidationComplete?.(url, result);
        return result;
      }

      const result: UrlValidationResult = {
        isValid: true,
        isWordPress: true, // Simplified for now
        isAccessible: true, // Simplified for now
      };

      this.config.onValidationComplete?.(url, result);
      return result;
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Validation failed";
      this.config.onValidationError?.(url, errorMsg);
      const result: UrlValidationResult = {
        isValid: false,
        isWordPress: false,
        isAccessible: false,
        error: errorMsg,
      };
      return result;
    }
  }

  /**
   * Validate if a string is a valid URL (static method)
   */
  static isValidUrl(url: string): boolean {
    if (!url || typeof url !== "string") {
      return false;
    }

    try {
      const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
      return ["http:", "https:"].includes(urlObj.protocol);
    } catch {
      return false;
    }
  }

  /**
   * Normalize URL to include protocol
   */
  static normalizeUrl(url: string): string {
    if (!url) return "";

    const trimmed = url.trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return trimmed;
    }

    return `https://${trimmed}`;
  }

  /**
   * Extract domain from URL
   */
  static extractDomain(url: string): string | null {
    try {
      const normalized = this.normalizeUrl(url);
      const urlObj = new URL(normalized);
      return urlObj.hostname;
    } catch {
      return null;
    }
  }

  /**
   * Check if URL is a Shopify store
   */
  static isShopifyUrl(url: string): boolean {
    const domain = this.extractDomain(url);
    return domain ? this.SHOPIFY_DOMAIN_REGEX.test(domain) : false;
  }

  /**
   * Check if URL appears to be WordPress
   */
  static isWordPressUrl(url: string): boolean {
    return this.WORDPRESS_PATTERNS.some((pattern) => pattern.test(url));
  }

  /**
   * Validate batch of URLs
   */
  static validateBatch(urls: string[]): { valid: string[]; invalid: string[] } {
    const valid: string[] = [];
    const invalid: string[] = [];

    urls.forEach((url) => {
      if (this.isValidUrl(url)) {
        valid.push(this.normalizeUrl(url));
      } else {
        invalid.push(url);
      }
    });

    return { valid, invalid };
  }

  /**
   * Get URL validation error message
   */
  static getValidationError(url: string): string | null {
    if (!url) {
      return "URL is required";
    }

    if (!this.isValidUrl(url)) {
      return "Please enter a valid URL (e.g., https://example.com)";
    }

    return null;
  }

  /**
   * Parse URLs from text (one per line)
   */
  static parseUrlsFromText(text: string): string[] {
    return text
      .split(/[\n,]/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }

  /**
   * Check if URL is reachable (client-side check)
   */
  static async isReachable(
    url: string,
    timeout: number = 5000,
  ): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      await fetch(this.normalizeUrl(url), {
        method: "HEAD",
        mode: "no-cors",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // In no-cors mode, we can't read the status, but if fetch succeeds, URL is likely reachable
      return true;
    } catch {
      return false;
    }
  }
}

// Export convenience functions for common operations
export const isValidUrl =
  UrlValidationService.isValidUrl.bind(UrlValidationService);
export const normalizeUrl =
  UrlValidationService.normalizeUrl.bind(UrlValidationService);
export const extractDomain =
  UrlValidationService.extractDomain.bind(UrlValidationService);
export const isShopifyUrl =
  UrlValidationService.isShopifyUrl.bind(UrlValidationService);
export const isWordPressUrl =
  UrlValidationService.isWordPressUrl.bind(UrlValidationService);
export const validateBatch =
  UrlValidationService.validateBatch.bind(UrlValidationService);
export const getValidationError =
  UrlValidationService.getValidationError.bind(UrlValidationService);
export const parseUrlsFromText =
  UrlValidationService.parseUrlsFromText.bind(UrlValidationService);
export const isReachable =
  UrlValidationService.isReachable.bind(UrlValidationService);
