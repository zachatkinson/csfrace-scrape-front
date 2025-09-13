/**
 * Simple Conversion API Utilities - Following CLAUDE.md Best Practices
 * DRY: Centralized conversion API calls without service abstractions
 * SOLID: Single responsibility - just make API calls to Docker backend
 * 
 * NO SERVICES, NO MANAGERS, NO PROCESSING SERVICES - Just simple fetch() calls!
 */

import { getApiBaseUrl } from '../constants/api';
import { getAuthHeaders } from './authApi';

const API_BASE = getApiBaseUrl();

/**
 * Simple response handler for DRY error handling
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `HTTP ${response.status}`);
  }
  return response.json();
}

/**
 * Create a single conversion job - Direct call to Docker backend
 */
export async function createJob(url: string, options: {
  format?: 'markdown' | 'html' | 'json';
  includeImages?: boolean;
  customCSS?: string;
} = {}) {
  const response = await fetch(`${API_BASE}/jobs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      url,
      options: {
        format: 'markdown',
        include_images: false,
        ...options,
      },
    }),
  });
  
  return handleResponse(response);
}

/**
 * Create a batch conversion job - Direct call to Docker backend
 */
export async function createBatch(urls: string[], options: {
  name?: string;
  format?: 'markdown' | 'html' | 'json';
  includeImages?: boolean;
} = {}) {
  const response = await fetch(`${API_BASE}/batches`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      name: options.name || `Batch ${new Date().toLocaleString()}`,
      urls,
      options: {
        format: 'markdown',
        include_images: false,
        ...options,
      },
    }),
  });
  
  return handleResponse(response);
}

/**
 * Get job status - Direct call to Docker backend
 */
export async function getJob(jobId: string) {
  const response = await fetch(`${API_BASE}/jobs/${jobId}`, {
    headers: getAuthHeaders(),
  });
  
  return handleResponse(response);
}

/**
 * List jobs - Direct call to Docker backend
 */
export async function getJobs(params: {
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  page?: number;
  limit?: number;
} = {}) {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.append('status', params.status);
  if (params.page) searchParams.append('page', params.page.toString());
  if (params.limit) searchParams.append('limit', params.limit.toString());
  
  const url = `${API_BASE}/jobs${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
  const response = await fetch(url, {
    headers: getAuthHeaders(),
  });
  
  return handleResponse(response);
}

/**
 * Get batch status - Direct call to Docker backend
 */
export async function getBatch(batchId: string) {
  const response = await fetch(`${API_BASE}/batches/${batchId}`, {
    headers: getAuthHeaders(),
  });
  
  return handleResponse(response);
}

/**
 * List batches - Direct call to Docker backend
 */
export async function getBatches(params: {
  page?: number;
  limit?: number;
} = {}) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.append('page', params.page.toString());
  if (params.limit) searchParams.append('limit', params.limit.toString());
  
  const url = `${API_BASE}/batches${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
  const response = await fetch(url, {
    headers: getAuthHeaders(),
  });
  
  return handleResponse(response);
}

/**
 * Cancel job - Direct call to Docker backend
 */
export async function cancelJob(jobId: string) {
  const response = await fetch(`${API_BASE}/jobs/${jobId}/cancel`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  
  return handleResponse(response);
}

/**
 * Delete job - Direct call to Docker backend
 */
export async function deleteJob(jobId: string) {
  const response = await fetch(`${API_BASE}/jobs/${jobId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  
  return handleResponse(response);
}

/**
 * Health check - Direct call to Docker backend
 */
export async function healthCheck() {
  const response = await fetch(`${API_BASE}/health`);
  return handleResponse(response);
}

/**
 * Validate URL - Simple client-side validation (no backend needed)
 */
export function validateUrl(url: string): { isValid: boolean; error?: string } {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { isValid: false, error: 'URL must use HTTP or HTTPS protocol' };
    }
    return { isValid: true };
  } catch {
    return { isValid: false, error: 'Invalid URL format' };
  }
}