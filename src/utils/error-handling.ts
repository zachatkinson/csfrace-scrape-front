/**
 * Enhanced Error Handling Utilities
 * SOLID: Single Responsibility - Error categorization and UX generation
 * Provides intelligent error handling with auth-specific messaging
 */

// =============================================================================
// ERROR TYPES AND INTERFACES
// =============================================================================

export interface ErrorDetails {
  type: ErrorType;
  title: string;
  message: string;
  technicalDetails?: string;
  actions: ErrorAction[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  isRecoverable: boolean;
  suggestedSteps?: string[];
}

export type ErrorType = 
  | 'auth_required'
  | 'auth_expired' 
  | 'auth_invalid'
  | 'permission_denied'
  | 'network_error'
  | 'server_error'
  | 'rate_limit'
  | 'validation_error'
  | 'unknown_error';

export interface ErrorAction {
  type: 'retry' | 'sign_in' | 'refresh' | 'contact_support' | 'navigate';
  label: string;
  primary: boolean;
  handler?: () => void;
  url?: string;
  icon?: string;
}

// =============================================================================
// ERROR ANALYSIS UTILITIES
// =============================================================================

/**
 * Analyze error and determine its type and appropriate response
 */
export function analyzeError(error: unknown): ErrorDetails {
  // Handle different error formats
  let statusCode = 0;
  let errorMessage = '';
  let technicalDetails = '';

  if (error instanceof Response) {
    statusCode = error.status;
    errorMessage = error.statusText || `HTTP ${statusCode}`;
  } else if (error instanceof Error) {
    errorMessage = error.message;
    technicalDetails = error.stack || '';
  } else if (typeof error === 'object' && error !== null) {
    const errObj = error as any;
    statusCode = errObj.status || errObj.statusCode || 0;
    errorMessage = errObj.message || errObj.error || String(error);
  } else {
    errorMessage = String(error);
  }

  // Analyze error type based on status code and message
  const errorType = categorizeError(statusCode, errorMessage);
  
  return createErrorDetails(errorType, statusCode, errorMessage, technicalDetails);
}

/**
 * Categorize error based on status code and message content
 */
function categorizeError(statusCode: number, message: string): ErrorType {
  const lowerMessage = message.toLowerCase();
  
  // Authentication-related errors
  if (statusCode === 401) {
    if (lowerMessage.includes('expired') || lowerMessage.includes('token')) {
      return 'auth_expired';
    }
    if (lowerMessage.includes('invalid') || lowerMessage.includes('unauthorized')) {
      return 'auth_invalid';
    }
    return 'auth_required';
  }
  
  if (statusCode === 403) {
    return 'permission_denied';
  }
  
  // Network and server errors
  if (statusCode === 429) {
    return 'rate_limit';
  }
  
  if (statusCode >= 500) {
    return 'server_error';
  }
  
  if (statusCode >= 400 && statusCode < 500) {
    return 'validation_error';
  }
  
  // Network connectivity issues
  if (statusCode === 0 || 
      lowerMessage.includes('network') || 
      lowerMessage.includes('fetch') ||
      lowerMessage.includes('connection') ||
      lowerMessage.includes('timeout')) {
    return 'network_error';
  }
  
  return 'unknown_error';
}

/**
 * Create detailed error information based on error type
 */
function createErrorDetails(
  type: ErrorType, 
  statusCode: number, 
  message: string, 
  technicalDetails: string
): ErrorDetails {
  const errorConfigs: Record<ErrorType, Omit<ErrorDetails, 'technicalDetails'>> = {
    auth_required: {
      type: 'auth_required',
      title: 'Sign In Required',
      message: 'You need to sign in to view your conversion jobs.',
      actions: [
        {
          type: 'sign_in',
          label: 'Sign In',
          primary: true,
          icon: 'login',
        },
        {
          type: 'retry',
          label: 'Try Again',
          primary: false,
          icon: 'refresh',
        },
      ],
      severity: 'medium',
      isRecoverable: true,
      suggestedSteps: [
        'Click "Sign In" to access your account',
        'Create an account if you don\'t have one',
        'Check if you\'re using the correct credentials',
      ],
    },

    auth_expired: {
      type: 'auth_expired',
      title: 'Session Expired',
      message: 'Your session has expired. Please sign in again to continue.',
      actions: [
        {
          type: 'refresh',
          label: 'Refresh Session',
          primary: true,
          icon: 'refresh',
        },
        {
          type: 'sign_in',
          label: 'Sign In Again',
          primary: false,
          icon: 'login',
        },
      ],
      severity: 'medium',
      isRecoverable: true,
      suggestedSteps: [
        'Try refreshing your session first',
        'If that doesn\'t work, sign in again',
        'Enable "Remember Me" to stay signed in longer',
      ],
    },

    auth_invalid: {
      type: 'auth_invalid',
      title: 'Authentication Failed',
      message: 'Your credentials are invalid. Please sign in again.',
      actions: [
        {
          type: 'sign_in',
          label: 'Sign In',
          primary: true,
          icon: 'login',
        },
      ],
      severity: 'high',
      isRecoverable: true,
      suggestedSteps: [
        'Check your email and password',
        'Reset your password if needed',
        'Contact support if issues persist',
      ],
    },

    permission_denied: {
      type: 'permission_denied',
      title: 'Access Denied',
      message: 'You don\'t have permission to view this content.',
      actions: [
        {
          type: 'sign_in',
          label: 'Sign In with Different Account',
          primary: true,
          icon: 'login',
        },
        {
          type: 'contact_support',
          label: 'Contact Support',
          primary: false,
          icon: 'support',
        },
      ],
      severity: 'high',
      isRecoverable: false,
      suggestedSteps: [
        'Try signing in with a different account',
        'Contact support to request access',
        'Verify your account permissions',
      ],
    },

    network_error: {
      type: 'network_error',
      title: 'Connection Error',
      message: 'Unable to connect to the conversion service. Check your internet connection.',
      actions: [
        {
          type: 'retry',
          label: 'Try Again',
          primary: true,
          icon: 'refresh',
        },
      ],
      severity: 'medium',
      isRecoverable: true,
      suggestedSteps: [
        'Check your internet connection',
        'Try refreshing the page',
        'Wait a moment and try again',
      ],
    },

    server_error: {
      type: 'server_error',
      title: 'Service Unavailable',
      message: 'The conversion service is temporarily unavailable. Please try again later.',
      actions: [
        {
          type: 'retry',
          label: 'Try Again',
          primary: true,
          icon: 'refresh',
        },
        {
          type: 'contact_support',
          label: 'Report Issue',
          primary: false,
          icon: 'support',
        },
      ],
      severity: 'high',
      isRecoverable: true,
      suggestedSteps: [
        'Wait a few minutes and try again',
        'Check our status page for updates',
        'Report the issue if it continues',
      ],
    },

    rate_limit: {
      type: 'rate_limit',
      title: 'Too Many Requests',
      message: 'You\'ve made too many requests. Please wait before trying again.',
      actions: [
        {
          type: 'retry',
          label: 'Try Again Later',
          primary: true,
          icon: 'clock',
        },
      ],
      severity: 'medium',
      isRecoverable: true,
      suggestedSteps: [
        'Wait a few minutes before retrying',
        'Consider processing fewer URLs at once',
        'Upgrade your account for higher limits',
      ],
    },

    validation_error: {
      type: 'validation_error',
      title: 'Invalid Request',
      message: 'The request contains invalid data. Please check your input and try again.',
      actions: [
        {
          type: 'retry',
          label: 'Try Again',
          primary: true,
          icon: 'refresh',
        },
      ],
      severity: 'low',
      isRecoverable: true,
      suggestedSteps: [
        'Check that all fields are filled correctly',
        'Verify URLs are valid and accessible',
        'Try with different input data',
      ],
    },

    unknown_error: {
      type: 'unknown_error',
      title: 'Unexpected Error',
      message: 'An unexpected error occurred. Please try again or contact support.',
      actions: [
        {
          type: 'retry',
          label: 'Try Again',
          primary: true,
          icon: 'refresh',
        },
        {
          type: 'contact_support',
          label: 'Contact Support',
          primary: false,
          icon: 'support',
        },
      ],
      severity: 'medium',
      isRecoverable: true,
      suggestedSteps: [
        'Try refreshing the page',
        'Clear your browser cache',
        'Contact support with error details',
      ],
    },
  };

  const config = errorConfigs[type];
  return {
    ...config,
    technicalDetails: technicalDetails || `${statusCode}: ${message}`,
  };
}

// =============================================================================
// ERROR UI GENERATION
// =============================================================================

/**
 * Generate HTML for enhanced error display
 */
export function generateErrorHTML(errorDetails: ErrorDetails, containerId?: string): string {
  const { title, message, actions, suggestedSteps, technicalDetails, type } = errorDetails;
  
  const isAuthError = type.startsWith('auth_') || type === 'permission_denied';
  const isNetworkError = type === 'network_error';
  
  // Use different colors for different error types
  let iconColor = 'text-red-400';
  let bgColor = 'bg-red-500/10';
  
  if (isAuthError) {
    iconColor = 'text-blue-400';
    bgColor = 'bg-blue-500/10';
  } else if (isNetworkError) {
    iconColor = 'text-orange-400';
    bgColor = 'bg-orange-500/10';
  }
  
  const actionButtons = actions.map(action => {
    const buttonClass = action.primary 
      ? `glass-button px-6 py-2 ${isAuthError ? 'bg-blue-500/20 text-blue-300 hover:text-blue-200 hover:bg-blue-500/30' : 'bg-red-500/20 text-red-300 hover:text-red-200 hover:bg-red-500/30'}`
      : 'glass-button px-4 py-2 text-white/60 hover:text-white';
    
    const actionHandler = getActionHandler(action, containerId);
    
    return `
      <button 
        ${actionHandler} 
        class="${buttonClass} transition-all duration-200"
      >
        ${getActionIcon(action.icon)} ${action.label}
      </button>
    `;
  }).join('');


  return `
    <div class="flex items-start space-x-3 p-4 ${bgColor} rounded-lg border border-white/10">
      <!-- Icon on the left -->
      <div class="w-16 h-16 ${bgColor} rounded-full flex items-center justify-center flex-shrink-0">
        <svg class="w-8 h-8 ${iconColor}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          ${getErrorIcon(type)}
        </svg>
      </div>
      
      <!-- Content on the right -->
      <div class="flex-1 min-w-0">
        <div class="flex items-start justify-between">
          <div class="flex-1 min-w-0 text-left">
            <h4 class="${iconColor} font-medium text-sm">${title}</h4>
            <p class="text-white/60 text-xs mt-1">${message}</p>
          </div>
          
          <!-- Buttons stacked vertically on the right -->
          <div class="flex flex-col space-y-2 ml-3 flex-shrink-0">
            ${(suggestedSteps || technicalDetails) ? `
              <button class="glass-button px-3 py-1 text-xs bg-blue-500/20 text-blue-300 hover:text-blue-200 hover:bg-blue-500/30 transition-all duration-200 flex items-center" onclick="toggleErrorDetails(this)">
                <svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="hidden sm:inline">Details</span>
              </button>
            ` : ''}
            
            ${actions.map(action => {
              const buttonClass = action.primary 
                ? `glass-button px-3 py-1 text-xs ${isAuthError ? 'bg-blue-500/20 text-blue-300 hover:text-blue-200' : 'bg-red-500/20 text-red-300 hover:text-red-200'}`
                : 'glass-button px-3 py-1 text-xs text-white/60 hover:text-white';
              
              const actionHandler = getActionHandler(action, containerId);
              
              return `
                <button 
                  ${actionHandler} 
                  class="${buttonClass} transition-all duration-200 flex items-center"
                >
                  ${getActionIcon(action.icon)}
                  <span class="hidden sm:inline">${action.label}</span>
                </button>
              `;
            }).join('')}
          </div>
        </div>
        
        <!-- Details content that slides down when Details button is clicked -->
        ${(suggestedSteps || technicalDetails) ? `
          <div class="error-details hidden mt-4 p-4 rounded-lg bg-black/40 border border-white/20 space-y-3 transition-all duration-300 ease-out overflow-hidden" style="max-height: 0; opacity: 0;">
            ${suggestedSteps ? `
              <div>
                <p class="text-sm font-medium text-white/90 mb-3">Suggested steps:</p>
                <ul class="list-disc list-inside space-y-2 text-sm text-white/70">
                  ${suggestedSteps.map(step => `<li>${step}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
            ${technicalDetails ? `
              <div ${suggestedSteps ? 'class="pt-3 border-t border-white/10"' : ''}>
                <p class="text-sm font-medium text-white/90 mb-3">Technical details:</p>
                <code class="text-sm font-mono text-white/60 break-all block bg-black/30 p-3 rounded border border-white/10">${technicalDetails}</code>
              </div>
            ` : ''}
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getActionHandler(action: ErrorAction, containerId?: string): string {
  switch (action.type) {
    case 'retry':
      return 'onclick="window.location.reload()"';
    case 'sign_in':
      return 'onclick="window.authService?.showLogin?.()"';
    case 'refresh':
      return 'onclick="window.authService?.refreshToken?.()"';
    case 'navigate':
      return action.url ? `onclick="window.location.href='${action.url}'"` : '';
    case 'contact_support':
      return 'onclick="window.open(\'mailto:support@csfracescrape.com\')"';
    default:
      return action.handler ? 'onclick="this.handler()"' : '';
  }
}

function getActionIcon(icon?: string): string {
  const iconMap: Record<string, string> = {
    login: '<svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>',
    refresh: '<svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>',
    support: '<svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25A6.25 6.25 0 1018.25 12 6.25 6.25 0 0012 2.25z" /></svg>',
    clock: '<svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>',
  };
  
  return iconMap[icon || ''] || '';
}

function getErrorIcon(type: ErrorType): string {
  const iconMap: Record<ErrorType, string> = {
    auth_required: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />',
    auth_expired: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />',
    auth_invalid: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />',
    permission_denied: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" />',
    network_error: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />',
    server_error: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />',
    rate_limit: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />',
    validation_error: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />',
    unknown_error: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />',
  };
  
  return iconMap[type] || iconMap.unknown_error;
}

// =============================================================================
// ERROR DETAILS TOGGLE FUNCTION
// =============================================================================

/**
 * Toggle error details visibility with smooth slide-down animation
 * This function is called from the Details button onclick handler
 */
declare global {
  interface Window {
    toggleErrorDetails: (button: HTMLElement) => void;
  }
}

window.toggleErrorDetails = (button: HTMLElement) => {
  // Find the error container that contains this button
  const errorContainer = button.closest('.flex.items-start.space-x-3')?.parentElement;
  if (!errorContainer) return;
  
  // Find the details content within the same error container
  const detailsContent = errorContainer.querySelector('.error-details') as HTMLElement;
  if (!detailsContent) return;
  
  const isExpanded = !detailsContent.classList.contains('hidden');
  
  if (isExpanded) {
    // Collapse: animate to closed state
    detailsContent.style.maxHeight = '0px';
    detailsContent.style.opacity = '0';
    detailsContent.style.paddingTop = '0px';
    detailsContent.style.paddingBottom = '0px';
    detailsContent.style.marginTop = '0px';
    
    // Hide after animation completes
    setTimeout(() => {
      detailsContent.classList.add('hidden');
    }, 300);
  } else {
    // Expand: show and animate to open state
    detailsContent.classList.remove('hidden');
    
    // Reset any inline styles that might interfere
    detailsContent.style.maxHeight = '';
    detailsContent.style.opacity = '';
    detailsContent.style.paddingTop = '';
    detailsContent.style.paddingBottom = '';
    detailsContent.style.marginTop = '';
    
    // Let the element render with its natural height
    requestAnimationFrame(() => {
      const scrollHeight = detailsContent.scrollHeight;
      
      // Start from collapsed state
      detailsContent.style.maxHeight = '0px';
      detailsContent.style.opacity = '0';
      detailsContent.style.paddingTop = '0px';
      detailsContent.style.paddingBottom = '0px';
      detailsContent.style.marginTop = '0px';
      
      // Force a reflow
      detailsContent.offsetHeight;
      
      // Animate to expanded state
      requestAnimationFrame(() => {
        detailsContent.style.maxHeight = scrollHeight + 'px';
        detailsContent.style.opacity = '1';
        detailsContent.style.paddingTop = '1rem';
        detailsContent.style.paddingBottom = '1rem';
        detailsContent.style.marginTop = '1rem';
        
        // After animation, allow natural height
        setTimeout(() => {
          if (!detailsContent.classList.contains('hidden')) {
            detailsContent.style.maxHeight = 'none';
          }
        }, 300);
      });
    });
  }
};

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Show enhanced error in a specific container
 */
export function showEnhancedError(error: unknown, containerId: string): void {
  const errorDetails = analyzeError(error);
  const errorHTML = generateErrorHTML(errorDetails, containerId);
  
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = errorHTML;
    container.classList.remove('hidden');
  }
}

/**
 * Quick check if error is authentication-related
 */
export function isAuthError(error: unknown): boolean {
  const errorDetails = analyzeError(error);
  return errorDetails.type.startsWith('auth_') || errorDetails.type === 'permission_denied';
}

export default {
  analyzeError,
  generateErrorHTML,
  showEnhancedError,
  isAuthError,
};