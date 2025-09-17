/**
 * Timezone Utility - SOLID Implementation
 * Single Responsibility: Handle timezone formatting and user preferences
 * Open/Closed: Extendable for new timezone formats without modification
 * Interface Segregation: Clean separation of timezone concerns
 * Dependency Inversion: Depends on browser APIs, not concrete implementations
 */

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export interface TimezoneOptions {
  locale?: string;
  timeZone?: string;
  format?: 'short' | 'medium' | 'long' | 'full';
  includeSeconds?: boolean;
  use24Hour?: boolean;
}

export interface TimezoneChangeListener {
  (): void;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_TIMEZONE_OPTIONS: TimezoneOptions = {
  locale: 'en-US',
  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  format: 'medium',
  includeSeconds: false,
  use24Hour: false,
};

// =============================================================================
// TIMEZONE FORMATTING (Single Responsibility)
// =============================================================================

/**
 * Format a timestamp using user's timezone preferences
 * @param date - Date to format
 * @param options - Optional formatting options
 * @returns Formatted timestamp string
 */
export function formatTimestamp(
  date: Date | string | number,
  options: Partial<TimezoneOptions> = {}
): string {
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date provided to formatTimestamp:', date);
      return 'Invalid Date';
    }

    const mergedOptions = { ...DEFAULT_TIMEZONE_OPTIONS, ...options };
    
    return formatDateWithOptions(dateObj, mergedOptions);
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return 'Format Error';
  }
}

/**
 * Format date and time separately
 * @param date - Date to format
 * @param options - Optional formatting options
 * @returns Object with formatted date and time
 */
export function formatDateTime(
  date: Date | string | number,
  options: Partial<TimezoneOptions> = {}
): { date: string; time: string; full: string } {
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return { date: 'Invalid Date', time: 'Invalid Date', full: 'Invalid Date' };
    }

    const mergedOptions = { ...DEFAULT_TIMEZONE_OPTIONS, ...options };
    
    const dateFormatter = new Intl.DateTimeFormat(mergedOptions.locale, {
      timeZone: mergedOptions.timeZone,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    const timeFormatter = new Intl.DateTimeFormat(mergedOptions.locale, {
      timeZone: mergedOptions.timeZone,
      hour: 'numeric',
      minute: '2-digit',
      second: mergedOptions.includeSeconds ? '2-digit' : undefined,
      hour12: !mergedOptions.use24Hour,
    });

    const date_part = dateFormatter.format(dateObj);
    const time_part = timeFormatter.format(dateObj);
    const full = formatDateWithOptions(dateObj, mergedOptions);

    return { date: date_part, time: time_part, full };
  } catch (error) {
    console.error('Error formatting date/time:', error);
    const errorMsg = 'Format Error';
    return { date: errorMsg, time: errorMsg, full: errorMsg };
  }
}

/**
 * Get relative time string (e.g., "2 minutes ago", "in 5 hours")
 * @param date - Date to compare
 * @param options - Optional formatting options
 * @returns Relative time string
 */
export function getRelativeTime(
  date: Date | string | number,
  options: Partial<TimezoneOptions> = {}
): string {
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }

    const now = new Date();
    const diffMs = dateObj.getTime() - now.getTime();
    const absDiffMs = Math.abs(diffMs);

    // Use Intl.RelativeTimeFormat for proper localization
    const rtf = new Intl.RelativeTimeFormat(options.locale || DEFAULT_TIMEZONE_OPTIONS.locale, {
      numeric: 'auto'
    });

    // Determine the appropriate unit
    const seconds = Math.floor(absDiffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return rtf.format(diffMs > 0 ? days : -days, 'day');
    } else if (hours > 0) {
      return rtf.format(diffMs > 0 ? hours : -hours, 'hour');
    } else if (minutes > 0) {
      return rtf.format(diffMs > 0 ? minutes : -minutes, 'minute');
    } else {
      return rtf.format(diffMs > 0 ? seconds : -seconds, 'second');
    }
  } catch (error) {
    console.error('Error getting relative time:', error);
    return 'Time Error';
  }
}

// =============================================================================
// TIMEZONE PREFERENCE MANAGEMENT (Single Responsibility)
// =============================================================================

const TIMEZONE_STORAGE_KEY = 'user_timezone_preferences';
const TIMEZONE_CHANGE_EVENT = 'timezonePreferencesChanged';

/**
 * Get user's timezone preferences from localStorage
 * @returns User timezone options or defaults
 */
export function getTimezonePreferences(): TimezoneOptions {
  try {
    const stored = localStorage.getItem(TIMEZONE_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_TIMEZONE_OPTIONS, ...parsed };
    }
  } catch (error) {
    console.warn('Error loading timezone preferences:', error);
  }
  
  return { ...DEFAULT_TIMEZONE_OPTIONS };
}

/**
 * Save user's timezone preferences to localStorage
 * @param options - Timezone options to save
 */
export function setTimezonePreferences(options: Partial<TimezoneOptions>): void {
  try {
    const current = getTimezonePreferences();
    const updated = { ...current, ...options };
    
    localStorage.setItem(TIMEZONE_STORAGE_KEY, JSON.stringify(updated));
    
    // Emit change event for reactive components
    window.dispatchEvent(new CustomEvent(TIMEZONE_CHANGE_EVENT, {
      detail: updated
    }));
  } catch (error) {
    console.error('Error saving timezone preferences:', error);
  }
}

/**
 * Listen for timezone preference changes
 * @param listener - Function to call when preferences change
 * @returns Cleanup function to remove the listener
 */
export function onTimezoneChange(listener: TimezoneChangeListener): () => void {
  const handleChange = () => listener();
  
  window.addEventListener(TIMEZONE_CHANGE_EVENT, handleChange);
  
  // Return cleanup function
  return () => {
    window.removeEventListener(TIMEZONE_CHANGE_EVENT, handleChange);
  };
}

// =============================================================================
// HELPER FUNCTIONS (DRY Principle)
// =============================================================================

/**
 * Internal helper to format date with options
 * @param date - Date object to format
 * @param options - Merged timezone options
 * @returns Formatted date string
 */
function formatDateWithOptions(date: Date, options: TimezoneOptions): string {
  const formatOptions: Intl.DateTimeFormatOptions = {
    timeZone: options.timeZone,
  };

  // Configure format based on format option
  switch (options.format) {
    case 'short':
      formatOptions.year = '2-digit';
      formatOptions.month = 'numeric';
      formatOptions.day = 'numeric';
      formatOptions.hour = 'numeric';
      formatOptions.minute = '2-digit';
      break;
    
    case 'medium':
      formatOptions.year = 'numeric';
      formatOptions.month = 'short';
      formatOptions.day = 'numeric';
      formatOptions.hour = 'numeric';
      formatOptions.minute = '2-digit';
      break;
    
    case 'long':
      formatOptions.year = 'numeric';
      formatOptions.month = 'long';
      formatOptions.day = 'numeric';
      formatOptions.hour = 'numeric';
      formatOptions.minute = '2-digit';
      formatOptions.timeZoneName = 'short';
      break;
    
    case 'full':
      formatOptions.weekday = 'long';
      formatOptions.year = 'numeric';
      formatOptions.month = 'long';
      formatOptions.day = 'numeric';
      formatOptions.hour = 'numeric';
      formatOptions.minute = '2-digit';
      formatOptions.timeZoneName = 'long';
      break;
  }

  // Add seconds if requested
  if (options.includeSeconds) {
    formatOptions.second = '2-digit';
  }

  // Set 12/24 hour format
  formatOptions.hour12 = !options.use24Hour;

  return new Intl.DateTimeFormat(options.locale, formatOptions).format(date);
}

/**
 * Get user's detected timezone
 * @returns Detected timezone string
 */
export function getDetectedTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.warn('Error detecting timezone:', error);
    return 'UTC';
  }
}

/**
 * Get list of available timezones
 * @returns Array of timezone strings
 */
export function getAvailableTimezones(): string[] {
  // Common timezones - can be extended as needed
  return [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney',
    // Add more as needed
  ];
}

// =============================================================================
// VALIDATION UTILITIES (Open/Closed Principle)
// =============================================================================

/**
 * Validate if a timezone string is valid
 * @param timezone - Timezone string to validate
 * @returns True if valid, false otherwise
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitize timezone options
 * @param options - Raw options to sanitize
 * @returns Sanitized options
 */
export function sanitizeTimezoneOptions(options: any): TimezoneOptions {
  const sanitized: TimezoneOptions = { ...DEFAULT_TIMEZONE_OPTIONS };

  if (options && typeof options === 'object') {
    if (typeof options.locale === 'string') {
      sanitized.locale = options.locale;
    }
    
    if (typeof options.timeZone === 'string' && isValidTimezone(options.timeZone)) {
      sanitized.timeZone = options.timeZone;
    }
    
    if (['short', 'medium', 'long', 'full'].includes(options.format)) {
      sanitized.format = options.format;
    }
    
    if (typeof options.includeSeconds === 'boolean') {
      sanitized.includeSeconds = options.includeSeconds;
    }
    
    if (typeof options.use24Hour === 'boolean') {
      sanitized.use24Hour = options.use24Hour;
    }
  }

  return sanitized;
}