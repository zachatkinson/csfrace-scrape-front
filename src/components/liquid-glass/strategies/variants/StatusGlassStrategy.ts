/**
 * Status Glass Strategy
 * Notification-optimized glass effect with color-coded states
 */

import { BaseGlassVariantStrategy, type GlassVariantConfig, type GlassVariantProps } from '../GlassVariantStrategy.ts';

export class StatusGlassStrategy extends BaseGlassVariantStrategy {
  constructor() {
    super('status', 'Notification-optimized glass effect with color-coded states');
  }

  getConfig(props: GlassVariantProps): GlassVariantConfig {
    return {
      classes: [
        ...this.getCommonClasses(props),
        'glass-status',
        // Status-specific styling
        'relative',
        'overflow-hidden',
        'border-l-4',
        'border-glass-status-accent',
      ],
      customProperties: {
        ...this.getCommonCustomProperties(props),
        '--glass-status-padding': '1rem 1.5rem',
        '--glass-status-border-radius': '8px',
        '--glass-status-accent-width': '4px',
        '--glass-status-shadow': '0 4px 16px rgba(0, 0, 0, 0.08)',
        '--glass-status-transition': 'all 0.3s ease-in-out',
      },
      interactiveClasses: [
        ...this.getInteractiveClasses(props.interactive),
        // Status interaction states (dismissible notifications)
        ...(props.interactive ? ['glass-status-dismissible', 'cursor-pointer'] : []),
      ],
      adaptiveClasses: [
        ...this.getAdaptiveClasses(props.adaptive),
        // Status adapts to content length and importance
        ...(props.adaptive ? ['glass-status-content-adaptive', 'glass-status-priority-aware'] : []),
      ],
      lensingClasses: [
        ...this.getLensingClasses(props.lensing),
        // Status lensing for better readability and attention
        ...(props.lensing ? ['glass-status-lens-highlight'] : []),
      ],
      loadingClasses: [
        ...this.getLoadingClasses(props.loading),
        // Status loading states (progress indicators)
        ...(props.loading ? ['glass-status-progress-bar'] : []),
      ],
    };
  }
}

export default StatusGlassStrategy;