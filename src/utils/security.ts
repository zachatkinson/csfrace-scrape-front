import DOMPurify from 'dompurify';
import CryptoJS from 'crypto-js';

interface ISanitizationOptions {
  allowedTags?: string[];
  allowedAttributes?: string[];
  stripComments?: boolean;
}

interface IEncryptionOptions {
  key: string;
  algorithm?: string;
}

export class SecurityUtils {
  private static readonly DEFAULT_ALLOWED_TAGS = [
    'p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre'
  ];

  private static readonly DEFAULT_ALLOWED_ATTRIBUTES = [
    'href', 'title', 'class', 'id', 'target', 'rel'
  ];

  public static sanitizeHtml(
    dirty: string, 
    options: ISanitizationOptions = {}
  ): string {
    const config = {
      ALLOWED_TAGS: options.allowedTags || this.DEFAULT_ALLOWED_TAGS,
      ALLOWED_ATTR: options.allowedAttributes || this.DEFAULT_ALLOWED_ATTRIBUTES,
      REMOVE_COMMENTS: options.stripComments !== false,
      FORBID_SCRIPT: true,
      FORBID_TAGS: ['script', 'object', 'embed', 'iframe', 'form', 'input'],
      FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover', 'onfocus'],
      USE_PROFILES: { html: true }
    };

    return DOMPurify.sanitize(dirty, config);
  }

  public static sanitizeText(input: string): string {
    return DOMPurify.sanitize(input, { 
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true
    });
  }

  public static sanitizeUrl(url: string): string {
    try {
      const parsed = new URL(url);
      
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('Invalid protocol');
      }
      
      return parsed.toString();
    } catch {
      throw new Error('Invalid URL format');
    }
  }

  public static validateInput(input: string, maxLength: number = 1000): boolean {
    if (typeof input !== 'string') {
      return false;
    }
    
    if (input.length > maxLength) {
      return false;
    }
    
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /data:text\/html/i,
      /vbscript:/i,
      /onload=/i,
      /onerror=/i,
      /onclick=/i
    ];
    
    return !suspiciousPatterns.some(pattern => pattern.test(input));
  }

  public static encryptToken(token: string, options: IEncryptionOptions): string {
    const encrypted = CryptoJS.AES.encrypt(token, options.key).toString();
    return encrypted;
  }

  public static decryptToken(encryptedToken: string, options: IEncryptionOptions): string {
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedToken, options.key);
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch {
      throw new Error('Token decryption failed');
    }
  }

  public static generateCSRFToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  public static hashPassword(password: string, salt?: string): string {
    const saltToUse = salt || CryptoJS.lib.WordArray.random(128/8).toString();
    const hash = CryptoJS.PBKDF2(password, saltToUse, {
      keySize: 512/32,
      iterations: 10000
    }).toString();
    
    return `${saltToUse}:${hash}`;
  }

  public static validatePassword(password: string, hashedPassword: string): boolean {
    try {
      const [salt, hash] = hashedPassword.split(':');
      const testHash = CryptoJS.PBKDF2(password, salt, {
        keySize: 512/32,
        iterations: 10000
      }).toString();
      
      return testHash === hash;
    } catch {
      return false;
    }
  }

  public static escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  public static sanitizeFileName(fileName: string): string {
    return fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  }

  public static validateFileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.includes(file.type);
  }

  public static sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
    const sanitized: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(headers)) {
      const cleanKey = key.replace(/[^\w-]/g, '');
      const cleanValue = value.replace(/[\r\n]/g, '');
      
      if (cleanKey && cleanValue) {
        sanitized[cleanKey] = cleanValue;
      }
    }
    
    return sanitized;
  }
}

export interface ISecureStorageOptions {
  encrypt?: boolean;
  expirationMinutes?: number;
}

export class SecureStorage {
  private static readonly ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'default-key';

  public static setItem(key: string, value: string, options: ISecureStorageOptions = {}): void {
    let dataToStore = value;
    
    if (options.encrypt) {
      dataToStore = SecurityUtils.encryptToken(value, { key: this.ENCRYPTION_KEY });
    }
    
    const storageItem = {
      data: dataToStore,
      timestamp: Date.now(),
      encrypted: options.encrypt || false,
      expirationMinutes: options.expirationMinutes
    };
    
    localStorage.setItem(key, JSON.stringify(storageItem));
  }

  public static getItem(key: string): string | null {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      
      const parsed = JSON.parse(item);
      
      if (parsed.expirationMinutes) {
        const expirationTime = parsed.timestamp + (parsed.expirationMinutes * 60 * 1000);
        if (Date.now() > expirationTime) {
          this.removeItem(key);
          return null;
        }
      }
      
      if (parsed.encrypted) {
        return SecurityUtils.decryptToken(parsed.data, { key: this.ENCRYPTION_KEY });
      }
      
      return parsed.data;
    } catch {
      return null;
    }
  }

  public static removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  public static clear(): void {
    localStorage.clear();
  }
}

export const sanitizeUserInput = (input: string): string => {
  return SecurityUtils.sanitizeText(input);
};

export const sanitizeHtmlContent = (html: string): string => {
  return SecurityUtils.sanitizeHtml(html);
};

export const validateAndSanitizeUrl = (url: string): string => {
  return SecurityUtils.sanitizeUrl(url);
};