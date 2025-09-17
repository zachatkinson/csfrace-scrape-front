/**
 * File Processing Service
 * SOLID: Single Responsibility - File processing and validation
 * DRY: Reusable file handling methods
 */

export interface ProcessedFile {
  name: string;
  size: number;
  type: string;
  content: string;
  lastModified: Date;
  isValid: boolean;
  error?: string;
}

export interface FileProcessingOptions {
  maxSizeBytes?: number;
  allowedTypes?: string[];
  readAsText?: boolean;
  readAsDataUrl?: boolean;
  validateContent?: boolean;
}

export interface FileProcessingConfig {
  onFileProcessed?: (urls: string[], filename: string) => void;
  onFileError?: (error: string) => void;
}

export class FileProcessingService {
  private static readonly DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB
  private static readonly TEXT_MIME_TYPES = [
    'text/plain',
    'text/csv',
    'text/html',
    'text/markdown',
    'application/json',
    'application/xml'
  ];

  private config: FileProcessingConfig;

  constructor(config: FileProcessingConfig = {}) {
    this.config = config;
  }

  /**
   * Process a single file (instance method)
   */
  async processFile(
    file: File,
    options: FileProcessingOptions = {}
  ): Promise<ProcessedFile> {
    try {
      const result = await FileProcessingService.processFileStatic(file, options);

      if (result.isValid && result.content) {
        const urls = FileProcessingService.extractUrlsFromFile(result.content);
        if (urls.length > 0) {
          this.config.onFileProcessed?.(urls, file.name);
        }
      }

      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'File processing failed';
      this.config.onFileError?.(errorMsg);
      throw error;
    }
  }

  /**
   * Process a single file (static method)
   */
  static async processFileStatic(
    file: File,
    options: FileProcessingOptions = {}
  ): Promise<ProcessedFile> {
    const {
      maxSizeBytes = this.DEFAULT_MAX_SIZE,
      allowedTypes,
      readAsText = true,
      readAsDataUrl = false,
      validateContent = false
    } = options;

    // Basic file info
    const result: ProcessedFile = {
      name: file.name,
      size: file.size,
      type: file.type || 'application/octet-stream',
      content: '',
      lastModified: new Date(file.lastModified),
      isValid: true
    };

    // Validate file size
    if (file.size > maxSizeBytes) {
      result.isValid = false;
      result.error = `File size exceeds maximum of ${this.formatFileSize(maxSizeBytes)}`;
      return result;
    }

    // Validate file type
    if (allowedTypes && allowedTypes.length > 0) {
      if (!allowedTypes.includes(file.type)) {
        result.isValid = false;
        result.error = `File type '${file.type}' is not allowed`;
        return result;
      }
    }

    // Read file content
    try {
      if (readAsDataUrl) {
        result.content = await this.readFileAsDataUrl(file);
      } else if (readAsText) {
        result.content = await this.readFileAsText(file);
      }

      // Validate content if requested
      if (validateContent) {
        const contentError = this.validateFileContent(result.content, file.type);
        if (contentError) {
          result.isValid = false;
          result.error = contentError;
        }
      }
    } catch (error) {
      result.isValid = false;
      result.error = error instanceof Error ? error.message : 'Failed to read file';
    }

    return result;
  }

  /**
   * Process multiple files (instance method)
   */
  async processFiles(
    files: FileList | File[],
    options: FileProcessingOptions = {}
  ): Promise<ProcessedFile[]> {
    const fileArray = Array.from(files);
    const results = await Promise.all(
      fileArray.map(file => this.processFile(file, options))
    );
    return results;
  }

  /**
   * Process multiple files (static method)
   */
  static async processFilesStatic(
    files: FileList | File[],
    options: FileProcessingOptions = {}
  ): Promise<ProcessedFile[]> {
    const fileArray = Array.from(files);
    const results = await Promise.all(
      fileArray.map(file => this.processFileStatic(file, options))
    );
    return results;
  }

  /**
   * Read file as text
   */
  private static readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  /**
   * Read file as data URL
   */
  private static readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Validate file content
   */
  private static validateFileContent(content: string, mimeType: string): string | null {
    // Validate JSON files
    if (mimeType === 'application/json') {
      try {
        JSON.parse(content);
      } catch {
        return 'Invalid JSON format';
      }
    }

    // Validate XML files
    if (mimeType === 'application/xml' || mimeType === 'text/xml') {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/xml');
        if (doc.getElementsByTagName('parsererror').length > 0) {
          return 'Invalid XML format';
        }
      } catch {
        return 'Invalid XML format';
      }
    }

    // Check for empty content
    if (!content || content.trim().length === 0) {
      return 'File is empty';
    }

    return null;
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  /**
   * Check if file is text-based
   */
  static isTextFile(file: File): boolean {
    return this.TEXT_MIME_TYPES.includes(file.type) ||
           file.name.endsWith('.txt') ||
           file.name.endsWith('.csv') ||
           file.name.endsWith('.json') ||
           file.name.endsWith('.xml') ||
           file.name.endsWith('.md');
  }

  /**
   * Extract URLs from file content
   */
  static extractUrlsFromFile(content: string): string[] {
    const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/g;
    const matches = content.match(urlRegex);
    return matches ? [...new Set(matches)] : [];
  }

  /**
   * Parse CSV content to URLs
   */
  static parseCsvToUrls(content: string, columnIndex: number = 0): string[] {
    const lines = content.split('\n').filter(line => line.trim());
    const urls: string[] = [];

    for (let i = 1; i < lines.length; i++) { // Skip header
      const columns = lines[i]?.split(',').map(col => col.trim().replace(/^["']|["']$/g, '')) || [];
      if (columns[columnIndex]) {
        urls.push(columns[columnIndex]);
      }
    }

    return urls;
  }
}

// Export convenience functions
export const processFile = FileProcessingService.processFileStatic.bind(FileProcessingService);
export const processFiles = FileProcessingService.processFilesStatic.bind(FileProcessingService);
export const formatFileSize = FileProcessingService.formatFileSize.bind(FileProcessingService);
export const isTextFile = FileProcessingService.isTextFile.bind(FileProcessingService);
export const extractUrlsFromFile = FileProcessingService.extractUrlsFromFile.bind(FileProcessingService);
export const parseCsvToUrls = FileProcessingService.parseCsvToUrls.bind(FileProcessingService);