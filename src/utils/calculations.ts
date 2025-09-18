/**
 * Calculation Utilities - Consolidated mathematical operations
 * SOLID: Single Responsibility - Only handles calculations and metrics
 * DRY: Eliminates duplicate calculation logic across components
 */

/**
 * Calculate job progress percentage
 * SOLID: Single Responsibility - Progress calculation only
 */
export function calculateJobProgress(job: {
  status: string;
  start_time?: number;
  end_time?: number;
  duration_seconds?: number;
}): number {
  if (job.status === "completed") {
    return 100;
  }

  if (job.status === "failed" || job.status === "cancelled") {
    return 0;
  }

  if (job.status === "pending") {
    return 0;
  }

  if (job.status === "running" && job.start_time) {
    const now = Date.now();
    const elapsed = now - job.start_time;
    const estimated = job.duration_seconds
      ? job.duration_seconds * 1000
      : 30000; // 30s default
    return Math.min(95, Math.round((elapsed / estimated) * 100)); // Cap at 95% for running jobs
  }

  return 0;
}

/**
 * Calculate job efficiency metric
 * SOLID: Single Responsibility - Efficiency calculation only
 */
export function calculateJobEfficiency(job: {
  content_size_bytes?: number;
  duration_seconds?: number;
}): number {
  if (
    !job.content_size_bytes ||
    !job.duration_seconds ||
    job.duration_seconds === 0
  ) {
    return 0;
  }

  // Bytes per second
  const efficiency = job.content_size_bytes / job.duration_seconds;

  // Normalize to a 0-100 scale (1MB/s = 100%)
  const maxEfficiency = 1024 * 1024; // 1MB/s
  return Math.min(100, Math.round((efficiency / maxEfficiency) * 100));
}

/**
 * Check if job is retryable based on status and retry count
 * SOLID: Single Responsibility - Retry logic only
 */
export function isJobRetryable(job: {
  status: string;
  retry_count: number;
  max_retries: number;
}): boolean {
  return job.status === "failed" && job.retry_count < job.max_retries;
}

/**
 * Calculate next retry time for failed jobs
 * SOLID: Single Responsibility - Retry timing only
 */
export function calculateNextRetryTime(job: {
  retry_count: number;
  next_retry_at?: string;
}): Date | null {
  if (job.next_retry_at) {
    return new Date(job.next_retry_at);
  }

  // Exponential backoff: 2^retry_count minutes
  const delayMinutes = Math.pow(2, job.retry_count);
  const nextRetry = new Date();
  nextRetry.setMinutes(nextRetry.getMinutes() + delayMinutes);

  return nextRetry;
}

/**
 * Calculate percentage with bounds checking
 * SOLID: Single Responsibility - Safe percentage calculation
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.max(0, Math.min(100, Math.round((value / total) * 100)));
}

/**
 * Calculate average from array of numbers
 * SOLID: Single Responsibility - Average calculation only
 */
export function calculateAverage(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sum = numbers.reduce((acc, num) => acc + num, 0);
  return sum / numbers.length;
}

/**
 * Calculate content processing rate
 * SOLID: Single Responsibility - Rate calculation only
 */
export function calculateProcessingRate(
  contentSize: number,
  processingTime: number,
): { rate: number; unit: string } {
  if (processingTime === 0) {
    return { rate: 0, unit: "B/s" };
  }

  const bytesPerSecond = contentSize / processingTime;

  if (bytesPerSecond >= 1024 * 1024) {
    return { rate: bytesPerSecond / (1024 * 1024), unit: "MB/s" };
  } else if (bytesPerSecond >= 1024) {
    return { rate: bytesPerSecond / 1024, unit: "KB/s" };
  } else {
    return { rate: bytesPerSecond, unit: "B/s" };
  }
}
