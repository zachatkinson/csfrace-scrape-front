/**
 * File Processing Service
 * Single Responsibility: Handle file upload and batch URL parsing
 * Extracted from UrlScraper to follow SOLID principles
 */

export interface FileProcessingEvents {
  onFileProcessed: (urls: string[], filename: string) => void;
  onFileError: (error: string, filename?: string) => void;
  onValidUrlsExtracted: (validUrls: string[], invalidUrls: string[]) => void;
}

export interface FileProcessingResult {
  urls: string[];
  filename: string;
  totalLines: number;
  validUrls: number;
  invalidUrls: number;
  errors: string[];
}

/**
 * File Processing Service - Handles file upload and URL extraction
 */
export class FileProcessingService {
  private events: Partial<FileProcessingEvents> = {};

  // Supported file types
  private readonly SUPPORTED_TYPES = [
    'text/plain',
    'text/csv',
    'application/json',
  ];

  // Maximum file size (5MB)
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024;

  // Maximum number of URLs per file
  private readonly MAX_URLS_PER_FILE = 1000;

  constructor(events: Partial<FileProcessingEvents> = {}) {
    this.events = events;
  }

  /**
   * Process uploaded file and extract URLs
   */
  async processFile(file: File): Promise<FileProcessingResult> {
    // Validate file
    const validation = this.validateFile(file);
    if (!validation.isValid) {
      const error = validation.error || 'File validation failed';
      this.events.onFileError?.(error, file.name);
      throw new Error(error);
    }

    try {
      const content = await this.readFileContent(file);
      const result = this.extractUrlsFromContent(content, file.name);
      
      this.events.onFileProcessed?.(result.urls, file.name);
      
      if (result.validUrls > 0 || result.invalidUrls > 0) {
        const validUrls = result.urls.filter(url => this.isValidUrl(url));
        const invalidUrls = result.urls.filter(url => !this.isValidUrl(url));
        this.events.onValidUrlsExtracted?.(validUrls, invalidUrls);
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'File processing failed';
      this.events.onFileError?.(errorMessage, file.name);
      throw error;
    }
  }

  /**
   * Process text content and extract URLs
   */
  processTextContent(content: string): string[] {
    const result = this.extractUrlsFromContent(content, 'text_input');
    return result.urls;
  }

  /**
   * Validate uploaded file
   */
  private validateFile(file: File): { isValid: boolean; error?: string } {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `File size exceeds ${this.MAX_FILE_SIZE / 1024 / 1024}MB limit`
      };
    }

    // Check file type
    if (!this.SUPPORTED_TYPES.includes(file.type) && !file.name.endsWith('.txt')) {
      return {
        isValid: false,
        error: 'Unsupported file type. Please upload a text file (.txt, .csv, or .json)'
      };
    }

    return { isValid: true };
  }

  /**
   * Read file content as text
   */
  private readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          resolve(content);
        } else {
          reject(new Error('Failed to read file content'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };
      
      reader.readAsText(file);
    });
  }

  /**
   * Extract URLs from various content formats
   */
  private extractUrlsFromContent(content: string, filename: string): FileProcessingResult {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const errors: string[] = [];
    let urls: string[] = [];

    // Detect content format and extract URLs accordingly
    if (filename.endsWith('.json')) {
      urls = this.extractUrlsFromJson(content, errors);
    } else if (filename.endsWith('.csv')) {
      urls = this.extractUrlsFromCsv(content, errors);
    } else {
      // Plain text - one URL per line or comma-separated
      urls = this.extractUrlsFromText(content);
    }

    // Remove duplicates and validate URLs
    const uniqueUrls = [...new Set(urls)];
    const validUrls = uniqueUrls.filter(url => this.isValidUrl(url));
    const invalidCount = uniqueUrls.length - validUrls.length;

    // Check URL limit
    if (validUrls.length > this.MAX_URLS_PER_FILE) {
      errors.push(`Too many URLs. Limiting to first ${this.MAX_URLS_PER_FILE} URLs.`);
      validUrls.splice(this.MAX_URLS_PER_FILE);
    }

    return {
      urls: validUrls,
      filename,
      totalLines: lines.length,
      validUrls: validUrls.length,
      invalidUrls: invalidCount,
      errors,
    };
  }

  /**
   * Extract URLs from JSON content
   */
  private extractUrlsFromJson(content: string, errors: string[]): string[] {
    try {
      const data = JSON.parse(content);
      const urls: string[] = [];

      // Handle different JSON structures
      if (Array.isArray(data)) {
        // Array of URLs or objects with URL properties
        data.forEach((item, index) => {
          if (typeof item === 'string') {
            urls.push(item);
          } else if (typeof item === 'object' && item !== null) {
            // Look for common URL properties
            const urlProps = ['url', 'link', 'href', 'source', 'website'];
            for (const prop of urlProps) {
              if (item[prop] && typeof item[prop] === 'string') {
                urls.push(item[prop]);
                break;
              }
            }
          }
        });
      } else if (typeof data === 'object' && data !== null) {
        // Object with URLs property or similar
        const urlArrayProps = ['urls', 'links', 'websites', 'sources'];
        for (const prop of urlArrayProps) {
          if (Array.isArray(data[prop])) {
            urls.push(...data[prop].filter((item: any) => typeof item === 'string'));
            break;
          }
        }
      }

      return urls;
    } catch (error) {
      errors.push('Invalid JSON format');
      return [];
    }
  }

  /**
   * Extract URLs from CSV content
   */
  private extractUrlsFromCsv(content: string, errors: string[]): string[] {
    const lines = content.split('\n');
    const urls: string[] = [];

    lines.forEach((line, index) => {
      const columns = line.split(',').map(col => col.trim().replace(/['"]/g, ''));
      
      // Find URL in any column
      const urlInLine = columns.find(col => this.looksLikeUrl(col));
      if (urlInLine) {
        urls.push(urlInLine);
      }
    });

    return urls;
  }

  /**
   * Extract URLs from plain text content
   */
  private extractUrlsFromText(content: string): string[] {
    const urls: string[] = [];
    
    // Split by lines and commas to handle different formats
    const lines = content.split('\n');
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      
      // Check if line contains comma-separated URLs
      if (trimmedLine.includes(',')) {
        const commaSplit = trimmedLine.split(',')
          .map(url => url.trim())
          .filter(url => this.looksLikeUrl(url));
        urls.push(...commaSplit);
      } else if (this.looksLikeUrl(trimmedLine)) {
        urls.push(trimmedLine);
      }
    });

    return urls;
  }

  /**
   * Quick check if string looks like a URL
   */
  private looksLikeUrl(str: string): boolean {
    return str.startsWith('http://') || str.startsWith('https://') || str.includes('://');
  }

  /**
   * Validate URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get supported file types for display
   */
  getSupportedTypes(): string[] {
    return [...this.SUPPORTED_TYPES];
  }

  /**
   * Get maximum file size for display
   */
  getMaxFileSize(): number {
    return this.MAX_FILE_SIZE;
  }

  /**
   * Get maximum URLs per file
   */
  getMaxUrls(): number {
    return this.MAX_URLS_PER_FILE;
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Create file processing summary
   */
  createSummary(result: FileProcessingResult): string {
    const parts = [];
    
    if (result.validUrls > 0) {
      parts.push(`${result.validUrls} valid URLs`);
    }
    
    if (result.invalidUrls > 0) {
      parts.push(`${result.invalidUrls} invalid URLs`);
    }
    
    if (result.errors.length > 0) {
      parts.push(`${result.errors.length} warnings`);
    }
    
    return parts.join(', ') || 'No URLs found';
  }
}

export default FileProcessingService;