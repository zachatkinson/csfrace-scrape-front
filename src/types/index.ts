/**
 * Shared TypeScript Definitions
 * Type definitions for WordPress to Shopify conversion system
 */

// Job Status Types
export type JobStatus = 'pending' | 'validating' | 'scraping' | 'completed' | 'error' | 'cancelled';

// Content Types
export type ContentType = 'post' | 'page' | 'product' | 'category' | 'tag';

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

// WordPress Content Structure
export interface WordPressContent {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  slug: string;
  type: ContentType;
  status: 'publish' | 'draft' | 'private';
  author: {
    id: string;
    name: string;
    email?: string;
  };
  publishedAt: string;
  modifiedAt: string;
  featuredImage?: {
    url: string;
    alt?: string;
    caption?: string;
  };
  categories: string[];
  tags: string[];
  metadata: Record<string, any>;
}

// Shopify Content Structure
export interface ShopifyContent {
  handle: string;
  title: string;
  bodyHtml: string;
  excerpt?: string;
  vendor?: string;
  productType?: string;
  tags: string[];
  images: {
    src: string;
    alt?: string;
    position: number;
  }[];
  variants?: {
    title: string;
    price: string;
    sku?: string;
    inventoryQuantity?: number;
  }[];
  seo: {
    title?: string;
    description?: string;
  };
  publishedAt?: string;
}

// Conversion Job
export interface ConversionJob {
  id: string;
  url: string;
  status: JobStatus;
  progress: number;
  
  // Input data
  wordpressContent?: WordPressContent;
  
  // Output data
  shopifyContent?: ShopifyContent;
  convertedHtml?: string;
  extractedImages?: string[];
  
  // Metadata
  metadata: {
    title?: string;
    type?: ContentType;
    wordCount?: number;
    imageCount?: number;
    estimatedSize?: string;
    processingTime?: number;
  };
  
  // Status information
  error?: string;
  warnings?: string[];
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  estimatedTimeRemaining?: number;
  
  // Configuration
  options: ConversionOptions;
}

// Conversion Configuration
export interface ConversionOptions {
  // Content processing
  preserveFormatting: boolean;
  convertImages: boolean;
  optimizeImages: boolean;
  downloadImages: boolean;
  
  // Shopify-specific
  productType?: string;
  vendor?: string;
  tags?: string[];
  
  // SEO
  generateSeoTitle: boolean;
  generateSeoDescription: boolean;
  
  // Advanced
  customCss?: string;
  removeWordPressSpecific: boolean;
  addShopifySpecific: boolean;
}

// URL Validation
export interface UrlValidationResult {
  isValid: boolean;
  isWordPress: boolean;
  isAccessible: boolean;
  contentType?: ContentType;
  error?: string;
  metadata?: {
    title?: string;
    description?: string;
    estimatedSize?: string;
    lastModified?: string;
  };
}

// Batch Processing
export interface BatchRequest {
  id: string;
  name: string;
  urls: string[];
  options: ConversionOptions;
  createdAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'error';
  jobs: ConversionJob[];
  progress: {
    total: number;
    completed: number;
    failed: number;
  };
}

// WebSocket Events
export interface WebSocketEvent {
  type: 'job_update' | 'job_complete' | 'job_error' | 'connection_status' | 'batch_update';
  payload: {
    jobId?: string;
    batchId?: string;
    data?: any;
    timestamp: string;
  };
}

// Statistics
export interface ConversionStats {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  successRate: number;
  averageProcessingTime: number;
  totalContentConverted: number;
  totalImagesProcessed: number;
  period: {
    start: string;
    end: string;
  };
}

// User Interface States
export interface UiState {
  isLoading: boolean;
  isConnected: boolean;
  theme: 'light' | 'dark' | 'auto';
  notifications: Notification[];
  activeModal?: string;
  sidebarCollapsed: boolean;
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  action?: {
    label: string;
    handler: () => void;
  };
  duration?: number;
  createdAt: Date;
}

// API Client Configuration
export interface ApiConfig {
  baseUrl: string;
  apiKey?: string;
  timeout: number;
  retries: number;
  webSocketUrl?: string;
}

// Component Props Extensions
export interface LiquidGlassBaseProps {
  className?: string;
  interactive?: boolean;
  adaptive?: boolean;
  lensing?: boolean;
  loading?: boolean;
  variant?: string;
}

// Form Validation
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'url' | 'email' | 'password' | 'textarea' | 'select' | 'checkbox' | 'radio';
  value: any;
  error?: string;
  validation?: ValidationRule;
  options?: { label: string; value: any }[];
  placeholder?: string;
  disabled?: boolean;
}

// Export utility types
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> & {
  [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
}[Keys];

// Environment Variables
export interface EnvironmentConfig {
  apiBaseUrl: string;
  wsBaseUrl: string;
  apiKey?: string;
  apiTimeout: number;
  enableBatchProcessing: boolean;
  maxConcurrentJobs: number;
  enableRealTimeUpdates: boolean;
  debugMode: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

// Note: Additional type exports would go here when those modules exist
// export * from './api';
// export * from './wordpress';
// export * from './shopify';