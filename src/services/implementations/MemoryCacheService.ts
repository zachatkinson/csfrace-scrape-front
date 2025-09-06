/**
 * Memory Cache Service Implementation
 * SOLID: Dependency Inversion - Implements ICacheService interface
 */

import type { ICacheService } from '../../interfaces/services.ts';

interface CacheEntry<T = unknown> {
  value: T;
  expiresAt: number;
  createdAt: number;
}

interface MemoryCacheConfig {
  defaultTTL?: number;
  maxSize?: number;
  cleanupInterval?: number;
}

export class MemoryCacheService implements ICacheService {
  private cache = new Map<string, CacheEntry>();
  private stats = { hits: 0, misses: 0 };
  private config: Required<MemoryCacheConfig>;
  private cleanupTimer?: number;

  constructor(config: MemoryCacheConfig = {}) {
    this.config = {
      defaultTTL: config.defaultTTL || 5 * 60 * 1000, // 5 minutes
      maxSize: config.maxSize || 1000,
      cleanupInterval: config.cleanupInterval || 60 * 1000, // 1 minute
    };

    this.startCleanupTimer();
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const finalTTL = ttl || this.config.defaultTTL;
    const now = Date.now();
    
    const entry: CacheEntry<T> = {
      value,
      expiresAt: now + finalTTL,
      createdAt: now,
    };

    this.cache.set(key, entry);
    this.enforceMaxSize();
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async getMany<T>(keys: string[]): Promise<Array<{ key: string; value: T | null }>> {
    const results = [];
    for (const key of keys) {
      const value = await this.get<T>(key);
      results.push({ key, value });
    }
    return results;
  }

  async setMany<T>(items: Array<{ key: string; value: T; ttl?: number }>): Promise<void> {
    for (const item of items) {
      await this.set(item.key, item.value, item.ttl);
    }
  }

  async deleteMany(keys: string[]): Promise<void> {
    for (const key of keys) {
      await this.delete(key);
    }
  }

  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }

  async keys(pattern?: string): Promise<string[]> {
    const allKeys = Array.from(this.cache.keys());
    
    if (!pattern) {
      return allKeys;
    }

    // Simple pattern matching (supports * wildcard)
    const regex = new RegExp(
      pattern.replace(/\*/g, '.*').replace(/\?/g, '.')
    );
    
    return allKeys.filter(key => regex.test(key));
  }

  async getStats(): Promise<{
    hits: number;
    misses: number;
    size: number;
    memoryUsage: number;
  }> {
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: this.cache.size,
      memoryUsage: this.estimateMemoryUsage(),
    };
  }

  async expire(key: string, ttl: number): Promise<void> {
    const entry = this.cache.get(key);
    if (entry) {
      entry.expiresAt = Date.now() + ttl;
    }
  }

  async ttl(key: string): Promise<number> {
    const entry = this.cache.get(key);
    if (!entry) return -2; // Key doesn't exist
    
    const remaining = entry.expiresAt - Date.now();
    return remaining > 0 ? remaining : -1; // -1 means expired
  }

  // Cleanup and maintenance
  private startCleanupTimer(): void {
    if (typeof window !== 'undefined') {
      this.cleanupTimer = window.setInterval(() => {
        this.cleanup();
      }, this.config.cleanupInterval);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    }
    
    for (const key of keysToDelete) {
      this.cache.delete(key);
    }
  }

  private enforceMaxSize(): void {
    if (this.cache.size <= this.config.maxSize) return;
    
    // Remove oldest entries first (LRU-like behavior)
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].createdAt - b[1].createdAt);
    
    const toRemove = this.cache.size - this.config.maxSize;
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  private estimateMemoryUsage(): number {
    let size = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      size += key.length * 2; // Assuming 2 bytes per char
      size += JSON.stringify(entry.value).length * 2;
      size += 24; // Overhead for timestamps and structure
    }
    
    return size;
  }

  // Cleanup on destruction
  dispose(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.cache.clear();
  }
}