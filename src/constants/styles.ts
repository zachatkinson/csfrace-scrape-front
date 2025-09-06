/**
 * Style Constants
 * Centralized CSS class combinations to eliminate repetition
 * ZERO TOLERANCE for repeated CSS class patterns
 */

// Base component styles that are frequently repeated
export const BASE_STYLES = {
  // Glass morphism base styles
  GLASS_CARD: 'bg-white/5 backdrop-blur-md border border-white/10 rounded-lg shadow-xl',
  GLASS_BUTTON: 'bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all duration-200',
  GLASS_INPUT: 'bg-white/5 backdrop-blur-md border border-white/10 focus:border-white/30 rounded-lg',
  GLASS_STATUS: 'bg-white/5 backdrop-blur-sm border border-white/10',
  
  // Container and layout patterns
  CONTAINER_MAX_WIDTH: 'max-w-7xl mx-auto',
  CONTAINER_PADDING: 'px-4 sm:px-6 lg:px-8',
  SECTION_PADDING: 'py-16',
  CARD_PADDING: 'p-4 lg:p-6',
  
  // Flex layouts (most common patterns)
  FLEX_CENTER: 'flex items-center justify-center',
  FLEX_BETWEEN: 'flex items-center justify-between',
  FLEX_START: 'flex items-center justify-start',
  FLEX_END: 'flex items-center justify-end',
  FLEX_COL_CENTER: 'flex flex-col items-center justify-center',
  FLEX_COL_START: 'flex flex-col items-start',
  
  // Grid layouts (common patterns)
  GRID_2_COL: 'grid grid-cols-1 lg:grid-cols-2 gap-8',
  GRID_3_COL: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
  GRID_AUTO_FIT: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4',
  
  // Spacing patterns (most frequently used)
  SPACE_Y_2: 'space-y-2',
  SPACE_Y_4: 'space-y-4', 
  SPACE_Y_6: 'space-y-6',
  SPACE_X_2: 'space-x-2',
  SPACE_X_3: 'space-x-3',
  SPACE_X_4: 'space-x-4',
  
  // Text styles (common combinations)
  TEXT_HEADING_1: 'text-4xl md:text-6xl font-bold text-white',
  TEXT_HEADING_2: 'text-2xl md:text-3xl font-semibold text-white',
  TEXT_HEADING_3: 'text-lg font-semibold text-white/90',
  TEXT_BODY: 'text-white/80',
  TEXT_BODY_SMALL: 'text-sm text-white/70',
  TEXT_MUTED: 'text-white/60',
  
  // Interactive states
  HOVER_SCALE: 'hover:scale-105 transition-transform duration-200',
  HOVER_OPACITY: 'hover:opacity-80 transition-opacity duration-200',
  ACTIVE_SCALE: 'active:scale-95',
  FOCUS_RING: 'focus:outline-none focus:ring-2 focus:ring-blue-400/50',
} as const;

// Button style combinations
export const BUTTON_STYLES = {
  // Primary buttons
  PRIMARY: `${BASE_STYLES.GLASS_BUTTON} text-white px-6 py-2 rounded-lg font-medium`,
  PRIMARY_LARGE: `${BASE_STYLES.GLASS_BUTTON} text-white px-8 py-3 rounded-lg font-medium text-lg`,
  PRIMARY_SMALL: `${BASE_STYLES.GLASS_BUTTON} text-white px-4 py-1 rounded text-sm font-medium`,
  
  // Secondary buttons
  SECONDARY: 'bg-transparent border border-white/20 text-white/90 hover:text-white px-6 py-2 rounded-lg transition-all duration-200',
  SECONDARY_SMALL: 'bg-transparent border border-white/20 text-white/90 hover:text-white px-3 py-1 rounded text-xs transition-all duration-200',
  
  // Icon buttons
  ICON: `${BASE_STYLES.GLASS_BUTTON} p-2 rounded-lg`,
  ICON_SMALL: `${BASE_STYLES.GLASS_BUTTON} p-1 rounded`,
  ICON_LARGE: `${BASE_STYLES.GLASS_BUTTON} p-3 rounded-lg`,
  
  // Action buttons (with specific purposes)
  DOWNLOAD: `${BASE_STYLES.GLASS_BUTTON} px-3 py-1 text-xs text-white/90 hover:text-white ${BASE_STYLES.FLEX_CENTER} ${BASE_STYLES.SPACE_X_2} transition-all duration-200`,
  RETRY: `${BASE_STYLES.GLASS_BUTTON} px-3 py-1 text-xs ${BASE_STYLES.FLEX_CENTER} ${BASE_STYLES.SPACE_X_2} transition-all duration-200`,
  VIEW: `${BASE_STYLES.GLASS_BUTTON} px-3 py-1 text-xs text-white/90 hover:text-white ${BASE_STYLES.FLEX_CENTER} ${BASE_STYLES.SPACE_X_2} transition-all duration-200`,
  
  // State-specific buttons
  DISABLED: 'bg-white/5 text-white/40 cursor-not-allowed opacity-50',
  LOADING: 'bg-white/5 text-white/60 cursor-wait',
} as const;

// Form input styles
export const INPUT_STYLES = {
  // Base input styles
  BASE: `${BASE_STYLES.GLASS_INPUT} px-3 py-2 text-white placeholder-white/50 ${BASE_STYLES.FOCUS_RING}`,
  LARGE: `${BASE_STYLES.GLASS_INPUT} px-4 py-3 text-lg text-white placeholder-white/50 ${BASE_STYLES.FOCUS_RING}`,
  SMALL: `${BASE_STYLES.GLASS_INPUT} px-2 py-1 text-sm text-white placeholder-white/50 ${BASE_STYLES.FOCUS_RING}`,
  
  // Specialized inputs
  URL: `${BASE_STYLES.GLASS_INPUT} w-full px-3 py-2 text-white placeholder-white/50 ${BASE_STYLES.FOCUS_RING}`,
  FILE: `${BASE_STYLES.GLASS_INPUT} w-full px-3 py-2 text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-white/20 file:text-white`,
  SEARCH: `${BASE_STYLES.GLASS_INPUT} w-full px-4 py-2 pl-10 text-white placeholder-white/50 ${BASE_STYLES.FOCUS_RING}`,
  
  // Input states
  ERROR: `${BASE_STYLES.GLASS_INPUT} border-red-400/50 px-3 py-2 text-white placeholder-white/50 focus:border-red-400`,
  SUCCESS: `${BASE_STYLES.GLASS_INPUT} border-green-400/50 px-3 py-2 text-white placeholder-white/50 focus:border-green-400`,
} as const;

// Card and panel styles
export const CARD_STYLES = {
  // Basic cards
  BASE: `${BASE_STYLES.GLASS_CARD} ${BASE_STYLES.CARD_PADDING}`,
  LARGE: `${BASE_STYLES.GLASS_CARD} p-8`,
  SMALL: `${BASE_STYLES.GLASS_CARD} p-3`,
  
  // Status cards (with left border indicator)
  SUCCESS: `${BASE_STYLES.GLASS_CARD} ${BASE_STYLES.CARD_PADDING} border-l-4 border-green-500`,
  WARNING: `${BASE_STYLES.GLASS_CARD} ${BASE_STYLES.CARD_PADDING} border-l-4 border-yellow-500`,
  ERROR: `${BASE_STYLES.GLASS_CARD} ${BASE_STYLES.CARD_PADDING} border-l-4 border-red-500`,
  INFO: `${BASE_STYLES.GLASS_CARD} ${BASE_STYLES.CARD_PADDING} border-l-4 border-blue-500`,
  PROCESSING: `${BASE_STYLES.GLASS_CARD} ${BASE_STYLES.CARD_PADDING} border-l-4 border-purple-500`,
  
  // Interactive cards
  HOVER: `${BASE_STYLES.GLASS_CARD} ${BASE_STYLES.CARD_PADDING} ${BASE_STYLES.HOVER_SCALE} cursor-pointer`,
  CLICKABLE: `${BASE_STYLES.GLASS_CARD} ${BASE_STYLES.CARD_PADDING} ${BASE_STYLES.HOVER_SCALE} ${BASE_STYLES.ACTIVE_SCALE} cursor-pointer`,
} as const;

// Progress and loading styles
export const PROGRESS_STYLES = {
  // Progress bars
  CONTAINER: 'w-full bg-white/10 rounded-full h-2 overflow-hidden',
  BAR: 'h-2 rounded-full transition-all duration-1000',
  BAR_GRADIENT: 'bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full transition-all duration-1000',
  BAR_SUCCESS: 'bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-1000',
  BAR_WARNING: 'bg-gradient-to-r from-yellow-400 to-yellow-600 h-2 rounded-full transition-all duration-1000',
  BAR_ERROR: 'bg-gradient-to-r from-red-400 to-red-600 h-2 rounded-full transition-all duration-1000',
  
  // Loading spinners
  SPINNER: 'animate-spin rounded-full border-2 border-white/20 border-t-white',
  SPINNER_SMALL: 'w-4 h-4 animate-spin rounded-full border-2 border-white/20 border-t-white',
  SPINNER_MEDIUM: 'w-6 h-6 animate-spin rounded-full border-2 border-white/20 border-t-white',
  SPINNER_LARGE: 'w-8 h-8 animate-spin rounded-full border-2 border-white/20 border-t-white',
  
  // Status indicators
  DOT_PENDING: 'w-3 h-3 bg-gray-400 rounded-full',
  DOT_PROCESSING: 'animate-spin rounded-full w-3 h-3 border-2 border-blue-400/30 border-t-blue-400',
  DOT_SUCCESS: 'w-3 h-3 bg-green-400 rounded-full animate-pulse',
  DOT_ERROR: 'w-3 h-3 bg-red-400 rounded-full',
  DOT_WARNING: 'w-3 h-3 bg-yellow-400 rounded-full',
} as const;

// Status and badge styles
export const STATUS_STYLES = {
  // Status pills/badges
  PILL_BASE: `${BASE_STYLES.GLASS_STATUS} px-3 py-1 rounded-full text-xs font-medium`,
  PILL_PENDING: `${BASE_STYLES.GLASS_STATUS} text-gray-400 px-3 py-1 rounded-full text-xs font-medium`,
  PILL_PROCESSING: `${BASE_STYLES.GLASS_STATUS} text-blue-400 px-3 py-1 rounded-full text-xs font-medium`,
  PILL_SUCCESS: `${BASE_STYLES.GLASS_STATUS} text-green-400 px-3 py-1 rounded-full text-xs font-medium`,
  PILL_ERROR: `${BASE_STYLES.GLASS_STATUS} text-red-400 px-3 py-1 rounded-full text-xs font-medium`,
  PILL_WARNING: `${BASE_STYLES.GLASS_STATUS} text-yellow-400 px-3 py-1 rounded-full text-xs font-medium`,
  
  // Status borders (for cards and containers)
  BORDER_PENDING: 'border-gray-500',
  BORDER_PROCESSING: 'border-blue-500',
  BORDER_SUCCESS: 'border-green-500',
  BORDER_ERROR: 'border-red-500',
  BORDER_WARNING: 'border-yellow-500',
  BORDER_CANCELLED: 'border-orange-500',
} as const;

// Layout and positioning utilities
export const LAYOUT_STYLES = {
  // Common positioning
  FIXED_TOP: 'fixed top-0 left-0 right-0 z-50',
  FIXED_BOTTOM: 'fixed bottom-0 left-0 right-0 z-50',
  ABSOLUTE_CENTER: 'absolute inset-0 flex items-center justify-center',
  STICKY_TOP: 'sticky top-0 z-40',
  
  // Common sizes and dimensions
  FULL_HEIGHT: 'h-full',
  FULL_WIDTH: 'w-full',
  FULL_SCREEN: 'h-screen w-screen',
  MIN_HEIGHT_SCREEN: 'min-h-screen',
  
  // Common responsive patterns
  RESPONSIVE_PADDING: 'px-4 sm:px-6 lg:px-8',
  RESPONSIVE_MARGIN: 'mx-4 sm:mx-6 lg:mx-8',
  RESPONSIVE_TEXT: 'text-sm sm:text-base lg:text-lg',
  RESPONSIVE_GRID: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
} as const;

// Animation and transition patterns
export const ANIMATION_STYLES = {
  // Fade animations
  FADE_IN: 'animate-fade-in',
  FADE_OUT: 'animate-fade-out',
  
  // Scale animations
  SCALE_IN: 'animate-scale-in',
  SCALE_OUT: 'animate-scale-out',
  
  // Slide animations
  SLIDE_UP: 'animate-slide-up',
  SLIDE_DOWN: 'animate-slide-down',
  SLIDE_LEFT: 'animate-slide-left',
  SLIDE_RIGHT: 'animate-slide-right',
  
  // Common transitions
  TRANSITION_ALL: 'transition-all duration-200 ease-in-out',
  TRANSITION_FAST: 'transition-all duration-150 ease-in-out',
  TRANSITION_SLOW: 'transition-all duration-300 ease-in-out',
  TRANSITION_COLORS: 'transition-colors duration-200',
  TRANSITION_TRANSFORM: 'transition-transform duration-200',
} as const;

// Job-specific styles (commonly repeated patterns)
export const JOB_STYLES = {
  // Job item layouts
  JOB_ITEM: `${CARD_STYLES.BASE} ${BASE_STYLES.SPACE_Y_4}`,
  JOB_HEADER: `${BASE_STYLES.FLEX_START} ${BASE_STYLES.SPACE_X_3} mb-4`,
  JOB_ACTIONS: `${BASE_STYLES.FLEX_CENTER} ${BASE_STYLES.SPACE_X_3} ml-auto`,
  JOB_PROGRESS: 'mb-4 ml-6',
  JOB_ERROR: 'mb-4 ml-6 bg-red-500/10 border border-red-500/20 rounded-lg p-3',
  
  // Job status specific styles
  JOB_PENDING: `${CARD_STYLES.BASE} ${STATUS_STYLES.BORDER_PENDING}`,
  JOB_PROCESSING: `${CARD_STYLES.BASE} ${STATUS_STYLES.BORDER_PROCESSING}`,
  JOB_SUCCESS: `${CARD_STYLES.BASE} ${STATUS_STYLES.BORDER_SUCCESS}`,
  JOB_ERROR_CARD: `${CARD_STYLES.BASE} ${STATUS_STYLES.BORDER_ERROR}`,
  JOB_CANCELLED: `${CARD_STYLES.BASE} ${STATUS_STYLES.BORDER_CANCELLED}`,
} as const;

// Form and input group patterns
export const FORM_STYLES = {
  // Form layouts
  FORM_GROUP: `${BASE_STYLES.SPACE_Y_2}`,
  FORM_ROW: `${BASE_STYLES.FLEX_BETWEEN} ${BASE_STYLES.SPACE_X_4}`,
  FORM_GRID: 'grid grid-cols-1 md:grid-cols-2 gap-6',
  
  // Labels and descriptions
  LABEL: 'block text-white/70 text-sm mb-2 font-medium',
  LABEL_REQUIRED: 'block text-white/70 text-sm mb-2 font-medium after:content-["*"] after:text-red-400 after:ml-1',
  DESCRIPTION: 'text-xs text-white/50 mt-1',
  ERROR_MESSAGE: 'text-xs text-red-400 mt-1',
  SUCCESS_MESSAGE: 'text-xs text-green-400 mt-1',
  
  // Form sections
  FORM_SECTION: `${BASE_STYLES.SPACE_Y_6} mb-8`,
  FORM_SECTION_TITLE: 'text-lg font-semibold text-white/90 mb-4',
} as const;

// Modal and overlay patterns
export const MODAL_STYLES = {
  // Modal overlays
  BACKDROP: 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50',
  CONTAINER: `${LAYOUT_STYLES.ABSOLUTE_CENTER} p-4`,
  CONTENT: `${BASE_STYLES.GLASS_CARD} max-w-lg w-full max-h-[90vh] overflow-y-auto`,
  
  // Modal sections
  HEADER: `${BASE_STYLES.FLEX_BETWEEN} p-6 border-b border-white/10`,
  BODY: 'p-6',
  FOOTER: `${BASE_STYLES.FLEX_END} ${BASE_STYLES.SPACE_X_3} p-6 border-t border-white/10`,
  
  // Modal sizes
  SMALL: `${BASE_STYLES.GLASS_CARD} max-w-sm w-full`,
  MEDIUM: `${BASE_STYLES.GLASS_CARD} max-w-lg w-full`,
  LARGE: `${BASE_STYLES.GLASS_CARD} max-w-2xl w-full`,
  EXTRA_LARGE: `${BASE_STYLES.GLASS_CARD} max-w-4xl w-full`,
} as const;

// Utility functions for dynamic style generation
export const StyleHelpers = {
  /**
   * Combine multiple style constants safely
   */
  combine: (...styles: string[]): string => {
    return styles.filter(Boolean).join(' ');
  },

  /**
   * Apply conditional styles
   */
  conditional: (condition: boolean, trueStyle: string, falseStyle: string = ''): string => {
    return condition ? trueStyle : falseStyle;
  },

  /**
   * Generate responsive breakpoint styles
   */
  responsive: (base: string, sm?: string, md?: string, lg?: string, xl?: string): string => {
    let classes = base;
    if (sm) classes += ` sm:${sm}`;
    if (md) classes += ` md:${md}`;
    if (lg) classes += ` lg:${lg}`;
    if (xl) classes += ` xl:${xl}`;
    return classes;
  },

  /**
   * Generate spacing utilities dynamically
   */
  spacing: (type: 'p' | 'm' | 'px' | 'py' | 'mx' | 'my', size: number): string => {
    return `${type}-${size}`;
  },

  /**
   * Generate grid column classes
   */
  gridCols: (cols: number, responsive = false): string => {
    const baseClass = `grid-cols-${cols}`;
    if (responsive && cols <= 4) {
      return `grid-cols-1 sm:grid-cols-2 md:${baseClass}`;
    }
    return baseClass;
  },
} as const;

// Export all style constants as a single object
export const STYLES = {
  BASE: BASE_STYLES,
  BUTTON: BUTTON_STYLES,
  INPUT: INPUT_STYLES,
  CARD: CARD_STYLES,
  PROGRESS: PROGRESS_STYLES,
  STATUS: STATUS_STYLES,
  LAYOUT: LAYOUT_STYLES,
  ANIMATION: ANIMATION_STYLES,
  JOB: JOB_STYLES,
  FORM: FORM_STYLES,
  MODAL: MODAL_STYLES,
  HELPERS: StyleHelpers,
} as const;

export default STYLES;