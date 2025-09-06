/**
 * Custom Glass Variant Example
 * Demonstrates Open/Closed Principle - extending without modifying core component
 * This example shows how developers can add new variants without touching LiquidGlass.tsx
 */

import { BaseGlassVariantStrategy, type GlassVariantConfig, type GlassVariantProps } from '../GlassVariantStrategy.ts';
import { registerGlassVariant } from '../GlassVariantRegistry.ts';

/**
 * Gaming Glass Strategy - Custom variant for gaming interfaces
 * Shows how to extend the system without modifying existing code
 */
export class GamingGlassStrategy extends BaseGlassVariantStrategy {
  constructor() {
    super('gaming', 'High-performance glass effect optimized for gaming interfaces with RGB accents');
  }

  getConfig(props: GlassVariantProps): GlassVariantConfig {
    return {
      classes: [
        ...this.getCommonClasses(props),
        'glass-gaming',
        // Gaming-specific styling
        'border-2',
        'border-gaming-accent',
        'shadow-gaming-glow',
        'bg-gradient-gaming',
      ],
      customProperties: {
        ...this.getCommonCustomProperties(props),
        '--glass-gaming-glow': '0 0 20px rgba(0, 255, 127, 0.3)',
        '--glass-gaming-border': 'linear-gradient(45deg, #00ff7f, #ff1493, #00bfff)',
        '--glass-gaming-backdrop': 'rgba(0, 0, 0, 0.9)',
        '--glass-gaming-animation': 'rgbPulse 2s infinite ease-in-out',
      },
      interactiveClasses: [
        ...this.getInteractiveClasses(props.interactive),
        // Gaming-specific interactions
        ...(props.interactive ? ['hover:shadow-gaming-intense', 'active:scale-gaming'] : []),
      ],
      adaptiveClasses: [
        ...this.getAdaptiveClasses(props.adaptive),
        // Gaming UI adapts to performance mode
        ...(props.adaptive ? ['glass-gaming-performance-mode'] : []),
      ],
      lensingClasses: [
        ...this.getLensingClasses(props.lensing),
        // Gaming lensing with RGB effects
        ...(props.lensing ? ['glass-gaming-rgb-lens'] : []),
      ],
      loadingClasses: [
        ...this.getLoadingClasses(props.loading),
        // Gaming loading with animated RGB bars
        ...(props.loading ? ['glass-gaming-rgb-loading'] : []),
      ],
    };
  }
}

/**
 * Neon Glass Strategy - Another custom variant for cyberpunk themes
 */
export class NeonGlassStrategy extends BaseGlassVariantStrategy {
  constructor() {
    super('neon', 'Cyberpunk-inspired glass with neon glow effects');
  }

  getConfig(props: GlassVariantProps): GlassVariantConfig {
    return {
      classes: [
        ...this.getCommonClasses(props),
        'glass-neon',
        'border',
        'border-neon-cyan',
        'shadow-neon-glow',
      ],
      customProperties: {
        ...this.getCommonCustomProperties(props),
        '--glass-neon-glow': '0 0 15px #00ffff, 0 0 30px #00ffff, 0 0 45px #00ffff',
        '--glass-neon-border': '#00ffff',
        '--glass-neon-text-shadow': '0 0 10px #00ffff',
        '--glass-neon-animation': 'neonFlicker 1.5s infinite alternate',
      },
      interactiveClasses: [
        ...this.getInteractiveClasses(props.interactive),
        ...(props.interactive ? ['hover:shadow-neon-intense', 'cursor-neon'] : []),
      ],
      adaptiveClasses: [
        ...this.getAdaptiveClasses(props.adaptive),
        ...(props.adaptive ? ['glass-neon-brightness-adaptive'] : []),
      ],
      lensingClasses: [
        ...this.getLensingClasses(props.lensing),
        ...(props.lensing ? ['glass-neon-hologram'] : []),
      ],
      loadingClasses: [
        ...this.getLoadingClasses(props.loading),
        ...(props.loading ? ['glass-neon-scan-lines'] : []),
      ],
    };
  }
}

/**
 * Example of how to register custom variants
 * This can be called during application initialization
 */
export function registerCustomGlassVariants(): void {
  // Register custom variants - extends functionality without modifying core code!
  registerGlassVariant(new GamingGlassStrategy());
  registerGlassVariant(new NeonGlassStrategy());
}

/**
 * Usage example:
 * 
 * // In your app initialization:
 * registerCustomGlassVariants();
 * 
 * // In your components:
 * <LiquidGlass variant="gaming" interactive lensing>
 *   Gaming Interface Content
 * </LiquidGlass>
 * 
 * <LiquidGlass variant="neon" loading>
 *   Cyberpunk Loading Screen
 * </LiquidGlass>
 * 
 * This demonstrates the power of the Strategy Pattern:
 * ✅ Open for Extension: New variants can be added easily
 * ✅ Closed for Modification: Core LiquidGlass component unchanged
 * ✅ Single Responsibility: Each strategy handles one variant
 * ✅ Liskov Substitution: All strategies implement the same interface
 */

export default {
  GamingGlassStrategy,
  NeonGlassStrategy,
  registerCustomGlassVariants,
};