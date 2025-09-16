// =============================================================================
// SIMPLE API CLIENT - Following CLAUDE.md NO LOCAL SERVICES RULE
// =============================================================================
// CRITICAL: This is NOT a service - just simple fetch() wrappers
// All actual logic is handled by Docker backend at localhost:8000
// Frontend only manages browser state and makes simple API calls
// =============================================================================

import type { IJobsResponse, IJobQueryParams, IBackendJob } from '../../types/job.ts';
import { apiFetch } from '../api-utils.ts';
import { getApiBaseUrl } from '../../constants/api.ts';

/**
 * Simple API call wrapper using shared utilities - NOT a service class
 * SOLID: DRY - Uses centralized fetch patterns from api-utils
 */
const apiCall = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  const apiBaseUrl = getApiBaseUrl();
  return apiFetch(`${apiBaseUrl}${endpoint}`, {
    method: (options.method as any) || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: options.body as string | FormData,
    signal: options.signal,
  });
};

// =============================================================================
// SIMPLE API FUNCTIONS - Following CLAUDE.md Guidelines
// =============================================================================
// ✅ GOOD: Simple fetch() calls to Docker backend APIs
// ❌ BAD: Complex AuthProvider, TokenManager, OAuthHandler services
// =============================================================================

/**
 * Get jobs list from backend API
 */
export const getJobs = async (params: IJobQueryParams = {}): Promise<IJobsResponse> => {
  const searchParams = new URLSearchParams();
  
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.page_size) searchParams.set('page_size', params.page_size.toString());
  if (params.status_filter) searchParams.set('status_filter', params.status_filter);
  if (params.search) searchParams.set('search', params.search);
  if (params.sort_by) searchParams.set('sort_by', params.sort_by);
  if (params.sort_order) searchParams.set('sort_order', params.sort_order);

  const endpoint = `/jobs${searchParams.toString() ? `?${searchParams}` : ''}`;
  return apiCall(endpoint);
};

/**
 * Get single job details from backend API
 */
export const getJob = async (jobId: number): Promise<IBackendJob> => {
  return apiCall(`/jobs/${jobId}`);
};

/**
 * Delete job via backend API
 */
export const deleteJob = async (jobId: number): Promise<void> => {
  await apiCall(`/jobs/${jobId}`, {
    method: 'DELETE',
  });
};

/**
 * Retry failed job via backend API
 */
export const retryJob = async (jobId: number): Promise<void> => {
  await apiCall(`/jobs/${jobId}/retry`, {
    method: 'POST',
  });
};

/**
 * Cancel running job via backend API
 */
export const cancelJob = async (jobId: number): Promise<void> => {
  await apiCall(`/jobs/${jobId}/cancel`, {
    method: 'POST',
  });
};

/**
 * Get job result/download content via backend API
 */
export const downloadJobContent = async (jobId: number): Promise<string> => {
  const apiBaseUrl = getApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/jobs/${jobId}/download`);

  if (!response.ok) {
    throw new Error(`Download failed: ${response.status} ${response.statusText}`);
  }

  return response.text();
};

/**
 * Health check for backend connection
 */
export const checkBackendHealth = async (): Promise<{ status: string; timestamp: string }> => {
  return apiCall('/health');
};