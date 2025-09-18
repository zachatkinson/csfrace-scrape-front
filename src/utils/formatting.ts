/**
 * Formatting Utilities - Consolidated from scattered formatting functions
 * SOLID: Single Responsibility - Only handles data formatting/display
 * DRY: Eliminates duplicate formatting logic across components
 */

/**
 * Format file size in bytes to human-readable format
 * SOLID: Single Responsibility - File size formatting only
 */
export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || bytes === 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${units[i]}`;
}

/**
 * Format relative time from date string
 * SOLID: Single Responsibility - Time formatting only
 */
export function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) {
      return "Just now";
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  } catch {
    return "Unknown";
  }
}

/**
 * Format duration from start and end times
 * SOLID: Single Responsibility - Duration calculation only
 */
export function formatDuration(startTime?: number, endTime?: number): string {
  if (!startTime || !endTime) {
    return "Unknown";
  }

  const durationMs = endTime - startTime;
  const seconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Format percentage with proper decimal places
 * SOLID: Single Responsibility - Percentage formatting only
 */
export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format log level with consistent styling
 * SOLID: Single Responsibility - Log level formatting only
 */
export function formatLogLevel(level: string): string {
  return level.toUpperCase();
}

/**
 * Capitalize first letter of string
 * SOLID: Single Responsibility - String capitalization only
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Format job title from URL if title is empty
 * SOLID: Single Responsibility - Job title formatting only
 */
export function formatJobTitle(url: string, existingTitle?: string): string {
  if (existingTitle && existingTitle.trim() !== "") {
    return existingTitle;
  }

  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const segments = pathname.split("/").filter(Boolean);

    if (segments.length === 0) {
      return urlObj.hostname;
    }

    // Get the last segment and format it nicely
    const lastSegment = segments[segments.length - 1];
    if (!lastSegment) {
      return urlObj.hostname;
    }
    return lastSegment
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  } catch {
    return url;
  }
}
