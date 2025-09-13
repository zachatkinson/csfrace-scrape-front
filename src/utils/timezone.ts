/**
 * Timezone Utility - Handle timezone-aware timestamps based on user settings
 * Integrates with SettingsManager for consistent timezone handling across the app
 */

interface SettingsData {
  timezone: string;
}

/**
 * Get current timezone setting from localStorage or default to 'auto'
 */
export function getCurrentTimezone(): string {
  try {
    const settings = localStorage.getItem('csfrace-settings');
    if (settings) {
      const parsed = JSON.parse(settings) as SettingsData;
      return parsed.timezone || 'auto';
    }
  } catch (error) {
    console.warn('Failed to parse timezone setting from localStorage:', error);
  }
  return 'auto';
}

/**
 * Get the effective timezone to use for date formatting
 * @param userTimezone - Timezone setting from user preferences
 * @returns Timezone string to use with Intl.DateTimeFormat
 */
function getEffectiveTimezone(userTimezone: string): string | undefined {
  if (userTimezone === 'auto') {
    // Use browser's detected timezone
    return undefined; // Intl.DateTimeFormat will use system timezone
  }
  return userTimezone;
}

/**
 * Format a timestamp based on user's timezone preference
 * @param date - Date to format (defaults to current time)
 * @param options - Additional formatting options
 * @returns Formatted time string
 */
export function formatTimestamp(
  date: Date = new Date(),
  options: Intl.DateTimeFormatOptions = {}
): string {
  const userTimezone = getCurrentTimezone();
  const effectiveTimezone = getEffectiveTimezone(userTimezone);

  const defaultOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false, // Use 24-hour format for technical displays
    ...options
  };

  try {
    return new Intl.DateTimeFormat('en-US', {
      ...defaultOptions,
      timeZone: effectiveTimezone
    }).format(date);
  } catch (error) {
    console.warn('Failed to format timestamp with timezone:', error);
    // Fallback to basic time formatting
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  }
}

/**
 * Format a full date and time based on user's timezone preference
 * @param date - Date to format (defaults to current time)
 * @returns Formatted date and time string
 */
export function formatDateTime(date: Date = new Date()): string {
  return formatTimestamp(date, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * Get timezone display name for UI
 * @param timezone - Timezone identifier
 * @returns Human-readable timezone name
 */
export function getTimezoneDisplayName(timezone: string): string {
  if (timezone === 'auto') {
    try {
      const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return `Auto (${detectedTz})`;
    } catch {
      return 'Auto';
    }
  }

  try {
    // Get timezone display name
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short'
    });
    const parts = formatter.formatToParts(new Date());
    const timeZoneName = parts.find(part => part.type === 'timeZoneName')?.value;
    return timeZoneName || timezone;
  } catch {
    return timezone;
  }
}

/**
 * Format relative time (e.g., "5 minutes ago", "2 hours ago")
 * @param timestamp - Timestamp in milliseconds
 * @returns Human-readable relative time string
 */
export function formatRelativeTime(timestamp: number): string {
  try {
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
    if (diffHour < 24) return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;
    if (diffDay < 7) return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;

    // For older timestamps, show formatted date
    return formatTimestamp(new Date(timestamp), {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.warn('Failed to format relative time:', error);
    return 'Unknown time';
  }
}

/**
 * Get timezone abbreviation (e.g., "PST", "EST", "UTC")
 * @param timezone - Optional timezone identifier (uses current setting if not provided)
 * @returns Timezone abbreviation string
 */
export function getTimezoneAbbreviation(timezone?: string): string {
  try {
    const tz = timezone || getCurrentTimezone();
    const effectiveTimezone = getEffectiveTimezone(tz);

    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: effectiveTimezone,
      timeZoneName: 'short'
    });

    const parts = formatter.formatToParts(new Date());
    const timeZonePart = parts.find(part => part.type === 'timeZoneName');
    return timeZonePart?.value || (effectiveTimezone || 'Local');
  } catch (error) {
    console.warn('Failed to get timezone abbreviation:', error);
    return 'UTC';
  }
}

/**
 * Get comprehensive timezone information for display
 * @returns Object with timezone details
 */
export function getTimezoneInfo(): {
  timezone: string;
  abbreviation: string;
  displayName: string;
  effectiveTimezone: string | undefined;
} {
  const timezone = getCurrentTimezone();
  const effectiveTimezone = getEffectiveTimezone(timezone);
  const abbreviation = getTimezoneAbbreviation(timezone);
  const displayName = getTimezoneDisplayName(timezone);

  return {
    timezone,
    abbreviation,
    displayName,
    effectiveTimezone
  };
}

/**
 * Listen for timezone setting changes and return cleanup function
 * @param callback - Function to call when timezone setting changes
 * @returns Cleanup function to remove the event listener
 */
export function onTimezoneChange(callback: (newTimezone: string) => void): () => void {
  const handleSettingsChange = (event: CustomEvent) => {
    const settings = event.detail as SettingsData;
    if (settings && typeof settings.timezone === 'string') {
      callback(settings.timezone);
    }
  };

  window.addEventListener('settingsChanged', handleSettingsChange as EventListener);

  return () => {
    window.removeEventListener('settingsChanged', handleSettingsChange as EventListener);
  };
}