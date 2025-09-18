/**
 * Card Glass Strategy
 * Enhanced glass effect optimized for card containers with improved depth
 */

import {
  BaseGlassVariantStrategy,
  type GlassVariantConfig,
  type GlassVariantProps,
} from "../GlassVariantStrategy.ts";

export class CardGlassStrategy extends BaseGlassVariantStrategy {
  constructor() {
    super(
      "card",
      "Enhanced glass effect optimized for card containers with improved depth",
    );
  }

  getConfig(props: GlassVariantProps): GlassVariantConfig {
    return {
      classes: [
        ...this.getCommonClasses(props),
        "glass-card",
        // Enhanced shadows and borders for card-like appearance
        "shadow-glass-elevated",
        "border-glass-card",
      ],
      customProperties: {
        ...this.getCommonCustomProperties(props),
        "--glass-card-padding": "1.5rem",
        "--glass-card-border-radius": "12px",
        "--glass-shadow-card": "0 8px 32px rgba(0, 0, 0, 0.12)",
      },
      interactiveClasses: [
        ...this.getInteractiveClasses(props.interactive),
        // Enhanced interaction for cards
        ...(props.interactive
          ? ["hover:shadow-glass-card-hover", "transition-glass-card"]
          : []),
      ],
      adaptiveClasses: [
        ...this.getAdaptiveClasses(props.adaptive),
        // Cards adapt content spacing
        ...(props.adaptive ? ["glass-card-adaptive-padding"] : []),
      ],
      lensingClasses: [
        ...this.getLensingClasses(props.lensing),
        // Enhanced lensing for card content
        ...(props.lensing ? ["glass-card-lens-magnify"] : []),
      ],
      loadingClasses: [
        ...this.getLoadingClasses(props.loading),
        // Card-specific loading shimmer
        ...(props.loading ? ["glass-card-shimmer"] : []),
      ],
    };
  }
}

export default CardGlassStrategy;
