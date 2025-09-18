/**
 * Modal Glass Strategy
 * High-blur glass effect optimized for modal overlays and dialogs
 */

import {
  BaseGlassVariantStrategy,
  type GlassVariantConfig,
  type GlassVariantProps,
} from "../GlassVariantStrategy.ts";

export class ModalGlassStrategy extends BaseGlassVariantStrategy {
  constructor() {
    super(
      "modal",
      "High-blur glass effect optimized for modal overlays and dialogs",
    );
  }

  getConfig(props: GlassVariantProps): GlassVariantConfig {
    return {
      classes: [
        ...this.getCommonClasses(props),
        "glass-modal",
        // Modal-specific styling
        "fixed",
        "z-modal",
        "backdrop-blur-glass-modal",
      ],
      customProperties: {
        ...this.getCommonCustomProperties(props),
        "--glass-modal-backdrop": "rgba(0, 0, 0, 0.4)",
        "--glass-modal-border-radius": "16px",
        "--glass-modal-padding": "2rem",
        "--glass-modal-shadow": "0 20px 60px rgba(0, 0, 0, 0.25)",
        "--glass-modal-blur": "60px", // Enhanced blur for modals
      },
      interactiveClasses: [
        ...this.getInteractiveClasses(props.interactive),
        // Modal interaction states
        ...(props.interactive ? ["glass-modal-dismissible"] : []),
      ],
      adaptiveClasses: [
        ...this.getAdaptiveClasses(props.adaptive),
        // Modals adapt to content size and viewport
        ...(props.adaptive
          ? ["glass-modal-responsive", "glass-modal-content-fit"]
          : []),
      ],
      lensingClasses: [
        ...this.getLensingClasses(props.lensing),
        // Modal lensing for better content focus
        ...(props.lensing ? ["glass-modal-lens-focus"] : []),
      ],
      loadingClasses: [
        ...this.getLoadingClasses(props.loading),
        // Modal loading states
        ...(props.loading ? ["glass-modal-loading-overlay"] : []),
      ],
    };
  }
}

export default ModalGlassStrategy;
