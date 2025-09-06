/**
 * Color Constants
 * Centralized color values and design system
 * ZERO TOLERANCE for duplicate color values - All colors must use these constants
 */

// Design system color palette
export const COLORS = {
  // Primary colors (Apple-inspired)
  PRIMARY: {
    BLUE: {
      '400': '#60a5fa',    // Light blue
      '500': '#3b82f6',    // Primary blue
      '600': '#2563eb',    // Dark blue
    },
    PURPLE: {
      '400': '#a78bfa',    // Light purple
      '500': '#8b5cf6',    // Primary purple
      '600': '#7c3aed',    // Dark purple
      '700': '#6d28d9',    // Darker purple
    },
  },

  // Status colors (semantic colors)
  STATUS: {
    SUCCESS: {
      '400': '#4ade80',    // Light green
      '500': '#22c55e',    // Primary success
      '600': '#16a34a',    // Dark green
    },
    WARNING: {
      '400': '#facc15',    // Light yellow
      '500': '#eab308',    // Primary warning
      '600': '#ca8a04',    // Dark yellow
    },
    ERROR: {
      '400': '#f87171',    // Light red
      '500': '#ef4444',    // Primary error
      '600': '#dc2626',    // Dark red
    },
    INFO: {
      '400': '#60a5fa',    // Light blue (same as primary)
      '500': '#3b82f6',    // Primary info
      '600': '#2563eb',    // Dark blue
    },
    PROCESSING: {
      '400': '#a78bfa',    // Light purple
      '500': '#8b5cf6',    // Primary processing
      '600': '#7c3aed',    // Dark purple
    },
  },

  // Neutral colors (grayscale)
  NEUTRAL: {
    WHITE: '#ffffff',
    BLACK: '#000000',
    GRAY: {
      '100': '#f3f4f6',
      '200': '#e5e7eb',
      '300': '#d1d5db',
      '400': '#9ca3af',
      '500': '#6b7280',
      '600': '#4b5563',
      '700': '#374151',
      '800': '#1f2937',
      '900': '#111827',
    },
  },

  // Accent colors for special purposes
  ACCENT: {
    ORANGE: {
      '400': '#fb923c',
      '500': '#f97316',
      '600': '#ea580c',
    },
    PINK: {
      '400': '#f472b6',
      '500': '#ec4899',
      '600': '#db2777',
    },
    CYAN: {
      '400': '#22d3ee',
      '500': '#06b6d4',
      '600': '#0891b2',
    },
  },
} as const;

// Job status color mappings
export const JOB_STATUS_COLORS = {
  pending: COLORS.NEUTRAL.GRAY['400'],
  running: COLORS.PRIMARY.BLUE['400'],
  completed: COLORS.STATUS.SUCCESS['400'],
  failed: COLORS.STATUS.ERROR['400'],
  cancelled: COLORS.ACCENT.ORANGE['400'],
} as const;

// UI component color schemes
export const UI_COLORS = {
  // Glass morphism colors (with opacity)
  GLASS: {
    BACKGROUND: 'rgba(255, 255, 255, 0.05)',     // bg-white/5
    BACKGROUND_HOVER: 'rgba(255, 255, 255, 0.1)', // bg-white/10
    BACKGROUND_ACTIVE: 'rgba(255, 255, 255, 0.2)', // bg-white/20
    BORDER: 'rgba(255, 255, 255, 0.1)',          // border-white/10
    BORDER_HOVER: 'rgba(255, 255, 255, 0.2)',     // border-white/20
    BORDER_FOCUS: 'rgba(255, 255, 255, 0.3)',     // border-white/30
  },

  // Text colors (with opacity for glass effect)
  TEXT: {
    PRIMARY: 'rgba(255, 255, 255, 1)',           // text-white
    SECONDARY: 'rgba(255, 255, 255, 0.9)',       // text-white/90
    MUTED: 'rgba(255, 255, 255, 0.8)',          // text-white/80
    SUBTLE: 'rgba(255, 255, 255, 0.7)',         // text-white/70
    PLACEHOLDER: 'rgba(255, 255, 255, 0.6)',     // text-white/60
    DISABLED: 'rgba(255, 255, 255, 0.5)',       // text-white/50
    FAINT: 'rgba(255, 255, 255, 0.4)',          // text-white/40
  },

  // Button color schemes
  BUTTON: {
    PRIMARY: {
      BACKGROUND: `linear-gradient(135deg, ${COLORS.PRIMARY.BLUE['500']}/0.8, ${COLORS.PRIMARY.PURPLE['600']}/0.8)`,
      BACKGROUND_HOVER: `linear-gradient(135deg, ${COLORS.PRIMARY.BLUE['600']}/0.9, ${COLORS.PRIMARY.PURPLE['700']}/0.9)`,
      TEXT: COLORS.NEUTRAL.WHITE,
    },
    SECONDARY: {
      BACKGROUND: 'transparent',
      BORDER: 'rgba(255, 255, 255, 0.2)',
      TEXT: 'rgba(255, 255, 255, 0.9)',
      TEXT_HOVER: COLORS.NEUTRAL.WHITE,
    },
    GHOST: {
      BACKGROUND: UI_COLORS.GLASS.BACKGROUND,
      BACKGROUND_HOVER: UI_COLORS.GLASS.BACKGROUND_HOVER,
      TEXT: UI_COLORS.TEXT.SECONDARY,
      TEXT_HOVER: UI_COLORS.TEXT.PRIMARY,
    },
  },

  // Progress bar colors
  PROGRESS: {
    BACKGROUND: 'rgba(255, 255, 255, 0.1)',     // Progress track
    DEFAULT: `linear-gradient(90deg, ${COLORS.PRIMARY.BLUE['400']}, ${COLORS.PRIMARY.BLUE['600']})`,
    SUCCESS: `linear-gradient(90deg, ${COLORS.STATUS.SUCCESS['400']}, ${COLORS.STATUS.SUCCESS['600']})`,
    WARNING: `linear-gradient(90deg, ${COLORS.STATUS.WARNING['400']}, ${COLORS.STATUS.WARNING['600']})`,
    ERROR: `linear-gradient(90deg, ${COLORS.STATUS.ERROR['400']}, ${COLORS.STATUS.ERROR['600']})`,
    PROCESSING: `linear-gradient(90deg, ${COLORS.PRIMARY.PURPLE['400']}, ${COLORS.PRIMARY.PURPLE['600']})`,
  },

  // Status indicator colors
  STATUS_INDICATORS: {
    SUCCESS: {
      BACKGROUND: `${COLORS.STATUS.SUCCESS['500']}/10`,
      BORDER: `${COLORS.STATUS.SUCCESS['500']}/20`,
      TEXT: COLORS.STATUS.SUCCESS['400'],
    },
    WARNING: {
      BACKGROUND: `${COLORS.STATUS.WARNING['500']}/10`,
      BORDER: `${COLORS.STATUS.WARNING['500']}/20`,
      TEXT: COLORS.STATUS.WARNING['400'],
    },
    ERROR: {
      BACKGROUND: `${COLORS.STATUS.ERROR['500']}/10`,
      BORDER: `${COLORS.STATUS.ERROR['500']}/20`,
      TEXT: COLORS.STATUS.ERROR['400'],
    },
    INFO: {
      BACKGROUND: `${COLORS.STATUS.INFO['500']}/10`,
      BORDER: `${COLORS.STATUS.INFO['500']}/20`,
      TEXT: COLORS.STATUS.INFO['400'],
    },
    PROCESSING: {
      BACKGROUND: `${COLORS.STATUS.PROCESSING['500']}/10`,
      BORDER: `${COLORS.STATUS.PROCESSING['500']}/20`,
      TEXT: COLORS.STATUS.PROCESSING['400'],
    },
  },
} as const;

// Background gradients and effects
export const BACKGROUND_EFFECTS = {
  // Animated gradient backgrounds
  GRADIENT_ANIMATED: {
    PRIMARY: `linear-gradient(45deg, ${COLORS.PRIMARY.BLUE['400']}, ${COLORS.PRIMARY.PURPLE['500']}, ${COLORS.PRIMARY.BLUE['400']}, ${COLORS.PRIMARY.PURPLE['500']})`,
    ACCENT: `linear-gradient(45deg, ${COLORS.ACCENT.PINK['400']}/20, ${COLORS.PRIMARY.PURPLE['400']}/20)`,
  },

  // Glass morphism blur effects
  BLUR_EFFECTS: {
    SUBTLE: 'rgba(255, 255, 255, 0.05)',
    MEDIUM: 'rgba(255, 255, 255, 0.1)',
    STRONG: 'rgba(255, 255, 255, 0.2)',
  },

  // Ambient background elements
  AMBIENT: {
    BLUE_GLOW: `${COLORS.PRIMARY.BLUE['400']}/20`,
    PURPLE_GLOW: `${COLORS.PRIMARY.PURPLE['400']}/20`,
    PINK_GLOW: `${COLORS.ACCENT.PINK['400']}/10`,
  },
} as const;

// Theme variations
export const THEMES = {
  LIGHT: {
    PRIMARY: COLORS.NEUTRAL.GRAY['900'],
    SECONDARY: COLORS.NEUTRAL.GRAY['700'],
    BACKGROUND: COLORS.NEUTRAL.WHITE,
    SURFACE: COLORS.NEUTRAL.GRAY['100'],
    BORDER: COLORS.NEUTRAL.GRAY['300'],
  },
  DARK: {
    PRIMARY: COLORS.NEUTRAL.WHITE,
    SECONDARY: UI_COLORS.TEXT.MUTED,
    BACKGROUND: COLORS.NEUTRAL.GRAY['900'],
    SURFACE: COLORS.NEUTRAL.GRAY['800'],
    BORDER: UI_COLORS.GLASS.BORDER,
  },
} as const;

// Color utility functions
export const ColorHelpers = {
  /**
   * Convert hex color to rgba with opacity
   */
  withOpacity: (hexColor: string, opacity: number): string => {
    // Remove # if present
    const hex = hexColor.replace('#', '');
    
    // Parse hex to RGB
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  },

  /**
   * Get color for job status
   */
  getJobStatusColor: (status: keyof typeof JOB_STATUS_COLORS): string => {
    return JOB_STATUS_COLORS[status] || JOB_STATUS_COLORS.pending;
  },

  /**
   * Get status indicator colors
   */
  getStatusIndicator: (type: keyof typeof UI_COLORS.STATUS_INDICATORS) => {
    return UI_COLORS.STATUS_INDICATORS[type];
  },

  /**
   * Get contrasting text color
   */
  getContrastText: (backgroundColor: string): string => {
    // Simple contrast logic - in a real app, you'd use a proper contrast calculation
    const darkColors = [
      COLORS.NEUTRAL.GRAY['800'],
      COLORS.NEUTRAL.GRAY['900'],
      COLORS.NEUTRAL.BLACK,
    ];
    
    return darkColors.includes(backgroundColor) 
      ? COLORS.NEUTRAL.WHITE 
      : COLORS.NEUTRAL.GRAY['900'];
  },

  /**
   * Generate CSS custom properties from color object
   */
  toCSSCustomProperties: (colorObj: Record<string, any>, prefix = 'color'): Record<string, string> => {
    const cssVars: Record<string, string> = {};
    
    const flatten = (obj: any, currentPrefix = prefix) => {
      Object.entries(obj).forEach(([key, value]) => {
        const cssKey = `--${currentPrefix}-${key.toLowerCase()}`;
        if (typeof value === 'string') {
          cssVars[cssKey] = value;
        } else if (typeof value === 'object') {
          flatten(value, `${currentPrefix}-${key.toLowerCase()}`);
        }
      });
    };
    
    flatten(colorObj);
    return cssVars;
  },
} as const;

// Export commonly used color combinations
export const COMMON_COLORS = {
  // Most frequently used combinations
  GLASS_CARD: {
    background: UI_COLORS.GLASS.BACKGROUND,
    border: UI_COLORS.GLASS.BORDER,
    text: UI_COLORS.TEXT.PRIMARY,
  },
  
  GLASS_BUTTON: {
    background: UI_COLORS.GLASS.BACKGROUND,
    backgroundHover: UI_COLORS.GLASS.BACKGROUND_HOVER,
    border: UI_COLORS.GLASS.BORDER_HOVER,
    text: UI_COLORS.TEXT.SECONDARY,
    textHover: UI_COLORS.TEXT.PRIMARY,
  },
  
  GLASS_INPUT: {
    background: UI_COLORS.GLASS.BACKGROUND,
    border: UI_COLORS.GLASS.BORDER,
    borderFocus: UI_COLORS.GLASS.BORDER_FOCUS,
    text: UI_COLORS.TEXT.PRIMARY,
    placeholder: UI_COLORS.TEXT.PLACEHOLDER,
  },
  
  STATUS_PILL: {
    success: {
      background: UI_COLORS.STATUS_INDICATORS.SUCCESS.BACKGROUND,
      text: UI_COLORS.STATUS_INDICATORS.SUCCESS.TEXT,
    },
    warning: {
      background: UI_COLORS.STATUS_INDICATORS.WARNING.BACKGROUND,
      text: UI_COLORS.STATUS_INDICATORS.WARNING.TEXT,
    },
    error: {
      background: UI_COLORS.STATUS_INDICATORS.ERROR.BACKGROUND,
      text: UI_COLORS.STATUS_INDICATORS.ERROR.TEXT,
    },
    processing: {
      background: UI_COLORS.STATUS_INDICATORS.PROCESSING.BACKGROUND,
      text: UI_COLORS.STATUS_INDICATORS.PROCESSING.TEXT,
    },
  },
} as const;

// Export all color constants
export const COLOR_SYSTEM = {
  COLORS,
  JOB_STATUS_COLORS,
  UI_COLORS,
  BACKGROUND_EFFECTS,
  THEMES,
  COMMON_COLORS,
  HELPERS: ColorHelpers,
} as const;

export default COLOR_SYSTEM;