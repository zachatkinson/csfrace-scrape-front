/**
 * Browser Storage Service Implementation
 * SOLID: Dependency Inversion - Implements IStorageService interface
 */

import type { IStorageService } from '../../interfaces/services.ts';

interface BrowserStorageConfig {
  provider?: 'localStorage' | 'sessionStorage' | 'indexedDB';
  prefix?: string;
}

export class BrowserStorageService implements IStorageService {
  private storage: Storage;
  private prefix: string;
  private storageType: 'localStorage' | 'sessionStorage' | 'indexedDB';

  constructor(config: BrowserStorageConfig = {}) {
    this.prefix = config.prefix || 'csfrace_';
    this.storageType = config.provider || 'localStorage';
    
    this.storage = this.storageType === 'sessionStorage' 
      ? sessionStorage 
      : localStorage;
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      this.storage.setItem(this.getKey(key), serialized);
    } catch (error) {
      console.error(`Storage setItem failed for key ${key}:`, error);
      throw new Error(`Failed to store item: ${key}`);
    }
  }

  async getItem<T>(key: string): Promise<T | null> {
    try {
      const serialized = this.storage.getItem(this.getKey(key));
      if (serialized === null) return null;
      return JSON.parse(serialized) as T;
    } catch (error) {
      console.error(`Storage getItem failed for key ${key}:`, error);
      return null;
    }
  }

  async removeItem(key: string): Promise<void> {
    this.storage.removeItem(this.getKey(key));
  }

  async clear(): Promise<void> {
    const keysToRemove = await this.getAllKeys();
    for (const key of keysToRemove) {
      this.storage.removeItem(key);
    }
  }

  async setItems<T>(items: Array<{ key: string; value: T }>): Promise<void> {
    for (const item of items) {
      await this.setItem(item.key, item.value);
    }
  }

  async getItems<T>(keys: string[]): Promise<Array<{ key: string; value: T | null }>> {
    const results = [];
    for (const key of keys) {
      const value = await this.getItem<T>(key);
      results.push({ key, value });
    }
    return results;
  }

  async removeItems(keys: string[]): Promise<void> {
    for (const key of keys) {
      await this.removeItem(key);
    }
  }

  async getAllKeys(): Promise<string[]> {
    const keys = [];
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key && key.startsWith(this.prefix)) {
        keys.push(key);
      }
    }
    return keys;
  }

  async hasItem(key: string): Promise<boolean> {
    return this.storage.getItem(this.getKey(key)) !== null;
  }

  async getStorageInfo(): Promise<{
    type: 'localStorage' | 'sessionStorage' | 'indexedDB' | 'memory';
    size: number;
    available: number;
    persistent: boolean;
  }> {
    let size = 0;
    const keys = await this.getAllKeys();
    
    for (const key of keys) {
      const value = this.storage.getItem(key);
      if (value) {
        size += new Blob([value]).size;
      }
    }

    return {
      type: this.storageType,
      size,
      available: this.getAvailableSpace(),
      persistent: this.storageType === 'localStorage'
    };
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  private getAvailableSpace(): number {
    // Rough estimate of available storage space
    try {
      const test = 'x'.repeat(1024); // 1KB
      let size = 0;
      
      while (size < 10 * 1024 * 1024) { // Test up to 10MB
        this.storage.setItem('__storage_test__', test.repeat(size / 1024));
        size += 1024;
      }
      
      this.storage.removeItem('__storage_test__');
      return size;
    } catch {
      return 5 * 1024 * 1024; // Default 5MB estimate
    }
  }
}