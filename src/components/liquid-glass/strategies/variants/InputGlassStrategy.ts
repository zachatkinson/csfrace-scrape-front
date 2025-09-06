/**
 * Input Glass Strategy
 * Form-optimized glass effect with focus states and validation styling
 */

import { BaseGlassVariantStrategy, type GlassVariantConfig, type GlassVariantProps } from '../GlassVariantStrategy.ts';

export class InputGlassStrategy extends BaseGlassVariantStrategy {
  constructor() {
    super('input', 'Form-optimized glass effect with focus states and validation styling');
  }

  getConfig(props: GlassVariantProps): GlassVariantConfig {
    return {
      classes: [
        ...this.getCommonClasses(props),
        'glass-input',
        // Input-specific styling
        'relative',
        'overflow-hidden',
      ],
      customProperties: {
        ...this.getCommonCustomProperties(props),
        '--glass-input-padding': '0.75rem 1rem',
        '--glass-input-border-radius': '6px',
        '--glass-input-border-width': '1px',
        '--glass-input-focus-ring': '0 0 0 3px rgba(59, 130, 246, 0.1)',
        '--glass-input-transition': 'all 0.15s ease-in-out',
      },
      interactiveClasses: [
        ...this.getInteractiveClasses(props.interactive),
        // Input focus and interaction states
        'focus-within:ring-glass-input',
        'focus-within:border-glass-focus',
        'hover:border-glass-hover',
        'transition-glass-input',
      ],
      adaptiveClasses: [
        ...this.getAdaptiveClasses(props.adaptive),
        // Inputs adapt to content and validation states
        ...(props.adaptive ? ['glass-input-adaptive-height', 'glass-input-adaptive-padding'] : []),
      ],
      lensingClasses: [
        ...this.getLensingClasses(props.lensing),
        // Input lensing for better readability
        ...(props.lensing ? ['glass-input-lens-text'] : []),
      ],
      loadingClasses: [
        ...this.getLoadingClasses(props.loading),
        // Input loading states
        ...(props.loading ? ['glass-input-loading-skeleton'] : []),
      ],
    };
  }
}

export default InputGlassStrategy;