/**
 * Button Glass Strategy
 * Interactive glass effect optimized for buttons with hover/active states
 */

import { BaseGlassVariantStrategy, type GlassVariantConfig, type GlassVariantProps } from '../GlassVariantStrategy.ts';

export class ButtonGlassStrategy extends BaseGlassVariantStrategy {
  constructor() {
    super('button', 'Interactive glass effect optimized for buttons with hover/active states');
  }

  getConfig(props: GlassVariantProps): GlassVariantConfig {
    return {
      classes: [
        ...this.getCommonClasses(props),
        'glass-button',
        // Button-specific styling
        'cursor-pointer',
        'select-none',
        'outline-glass-focus',
      ],
      customProperties: {
        ...this.getCommonCustomProperties(props),
        '--glass-button-padding': '0.75rem 1.5rem',
        '--glass-button-border-radius': '8px',
        '--glass-button-transition': 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        '--glass-button-scale-hover': '1.02',
        '--glass-button-scale-active': '0.98',
      },
      interactiveClasses: [
        ...this.getInteractiveClasses(true), // Buttons are always interactive
        // Enhanced button interactions
        'hover:bg-white/20',
        'hover:shadow-glass-button',
        'hover:scale-glass-button',
        'active:scale-glass-button-active',
        'focus:ring-glass-button',
        'transition-glass-button',
      ],
      adaptiveClasses: [
        ...this.getAdaptiveClasses(props.adaptive),
        // Buttons adapt to content size
        ...(props.adaptive ? ['glass-button-adaptive-size'] : []),
      ],
      lensingClasses: [
        ...this.getLensingClasses(props.lensing),
        // Button-specific lensing effects
        ...(props.lensing ? ['glass-button-lens-highlight'] : []),
      ],
      loadingClasses: [
        ...this.getLoadingClasses(props.loading),
        // Button loading states
        ...(props.loading ? ['glass-button-loading', 'pointer-events-none'] : []),
      ],
    };
  }
}

export default ButtonGlassStrategy;