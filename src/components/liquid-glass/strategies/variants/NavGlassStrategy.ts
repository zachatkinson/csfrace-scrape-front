/**
 * Navigation Glass Strategy
 * Subtle glass effect optimized for navigation bars and menus
 */

import { BaseGlassVariantStrategy, type GlassVariantConfig, type GlassVariantProps } from '../GlassVariantStrategy.ts';

export class NavGlassStrategy extends BaseGlassVariantStrategy {
  constructor() {
    super('nav', 'Subtle glass effect optimized for navigation bars and menus');
  }

  getConfig(props: GlassVariantProps): GlassVariantConfig {
    return {
      classes: [
        ...this.getCommonClasses(props),
        'glass-nav',
        // Navigation-specific styling
        'sticky',
        'top-0',
        'z-nav',
        'border-b',
        'border-glass-nav',
      ],
      customProperties: {
        ...this.getCommonCustomProperties(props),
        '--glass-nav-height': '4rem',
        '--glass-nav-padding': '0 1.5rem',
        '--glass-nav-backdrop': 'rgba(255, 255, 255, 0.8)',
        '--glass-nav-blur': '20px', // Subtle blur for navigation
        '--glass-nav-border': 'rgba(255, 255, 255, 0.1)',
      },
      interactiveClasses: [
        ...this.getInteractiveClasses(props.interactive),
        // Navigation interaction states
        ...(props.interactive ? ['glass-nav-scroll-effect'] : []),
      ],
      adaptiveClasses: [
        ...this.getAdaptiveClasses(props.adaptive),
        // Navigation adapts to scroll position and content
        ...(props.adaptive ? ['glass-nav-scroll-adaptive', 'glass-nav-content-aware'] : []),
      ],
      lensingClasses: [
        ...this.getLensingClasses(props.lensing),
        // Navigation lensing for better text readability
        ...(props.lensing ? ['glass-nav-lens-text'] : []),
      ],
      loadingClasses: [
        ...this.getLoadingClasses(props.loading),
        // Navigation loading states
        ...(props.loading ? ['glass-nav-loading-skeleton'] : []),
      ],
    };
  }
}

export default NavGlassStrategy;