/**
 * Default Glass Strategy
 * Standard glass effect with balanced transparency and blur
 */

import {
  BaseGlassVariantStrategy,
  type GlassVariantConfig,
  type GlassVariantProps,
} from "../GlassVariantStrategy.ts";

export class DefaultGlassStrategy extends BaseGlassVariantStrategy {
  constructor() {
    super(
      "default",
      "Standard glass effect with balanced transparency and blur",
    );
  }

  getConfig(props: GlassVariantProps): GlassVariantConfig {
    return {
      classes: [
        ...this.getCommonClasses(props),
        // No additional variant-specific classes for default
      ],
      customProperties: {
        ...this.getCommonCustomProperties(props),
      },
      interactiveClasses: this.getInteractiveClasses(props.interactive),
      adaptiveClasses: this.getAdaptiveClasses(props.adaptive),
      lensingClasses: this.getLensingClasses(props.lensing),
      loadingClasses: this.getLoadingClasses(props.loading),
    };
  }
}

export default DefaultGlassStrategy;
