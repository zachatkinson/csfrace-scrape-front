/**
 * Glass Variant Registry
 * Central registry implementing Strategy Pattern for glass variants
 * Fixes Open/Closed Principle violation - extensible without modification
 */

import type {
  IGlassVariantStrategy,
  GlassVariantProps,
  GlassVariantConfig,
} from "./GlassVariantStrategy.ts";

// Import all variant strategies
import { DefaultGlassStrategy } from "./variants/DefaultGlassStrategy.ts";
import { CardGlassStrategy } from "./variants/CardGlassStrategy.ts";
import { ButtonGlassStrategy } from "./variants/ButtonGlassStrategy.ts";
import { InputGlassStrategy } from "./variants/InputGlassStrategy.ts";
import { ModalGlassStrategy } from "./variants/ModalGlassStrategy.ts";
import { NavGlassStrategy } from "./variants/NavGlassStrategy.ts";
import { StatusGlassStrategy } from "./variants/StatusGlassStrategy.ts";

/**
 * Registry for managing glass variant strategies
 * Implements Open/Closed Principle - open for extension, closed for modification
 */
export class GlassVariantRegistry {
  private strategies = new Map<string, IGlassVariantStrategy>();

  constructor() {
    this.registerDefaultStrategies();
  }

  /**
   * Register a glass variant strategy
   * Allows extension without modifying existing code
   */
  register(strategy: IGlassVariantStrategy): void {
    this.strategies.set(strategy.name, strategy);
  }

  /**
   * Unregister a glass variant strategy
   */
  unregister(variantName: string): boolean {
    return this.strategies.delete(variantName);
  }

  /**
   * Get configuration for a specific variant
   */
  getConfig(variantName: string, props: GlassVariantProps): GlassVariantConfig {
    const strategy = this.strategies.get(variantName);

    if (!strategy) {
      console.warn(
        `Glass variant '${variantName}' not found. Falling back to 'default'.`,
      );
      const defaultStrategy = this.strategies.get("default");
      if (!defaultStrategy) {
        throw new Error("Default glass variant strategy not found");
      }
      return defaultStrategy.getConfig(props);
    }

    return strategy.getConfig(props);
  }

  /**
   * Check if a variant is registered
   */
  hasVariant(variantName: string): boolean {
    return this.strategies.has(variantName);
  }

  /**
   * Get all available variant names
   */
  getAvailableVariants(): string[] {
    return Array.from(this.strategies.keys());
  }

  /**
   * Get strategy metadata for a variant
   */
  getVariantInfo(
    variantName: string,
  ): { name: string; description: string } | null {
    const strategy = this.strategies.get(variantName);
    if (!strategy) return null;

    return {
      name: strategy.name,
      description: strategy.description,
    };
  }

  /**
   * Get all registered strategies with metadata
   */
  getAllVariants(): Array<{ name: string; description: string }> {
    return Array.from(this.strategies.values()).map((strategy) => ({
      name: strategy.name,
      description: strategy.description,
    }));
  }

  /**
   * Register default strategies
   */
  private registerDefaultStrategies(): void {
    // Register all built-in strategies
    this.register(new DefaultGlassStrategy());
    this.register(new CardGlassStrategy());
    this.register(new ButtonGlassStrategy());
    this.register(new InputGlassStrategy());
    this.register(new ModalGlassStrategy());
    this.register(new NavGlassStrategy());
    this.register(new StatusGlassStrategy());
  }

  /**
   * Bulk register multiple strategies
   */
  registerMultiple(strategies: IGlassVariantStrategy[]): void {
    strategies.forEach((strategy) => this.register(strategy));
  }

  /**
   * Create a new registry with copied strategies
   */
  clone(): GlassVariantRegistry {
    const newRegistry = new GlassVariantRegistry();

    // Clear default strategies and copy from this registry
    newRegistry.strategies.clear();
    this.strategies.forEach((strategy, name) => {
      newRegistry.strategies.set(name, strategy);
    });

    return newRegistry;
  }

  /**
   * Reset registry to default strategies only
   */
  reset(): void {
    this.strategies.clear();
    this.registerDefaultStrategies();
  }

  /**
   * Get registry statistics
   */
  getStats(): {
    totalStrategies: number;
    variantNames: string[];
    builtinStrategies: string[];
    customStrategies: string[];
  } {
    const builtinNames = [
      "default",
      "card",
      "button",
      "input",
      "modal",
      "nav",
      "status",
    ];
    const allNames = this.getAvailableVariants();

    return {
      totalStrategies: allNames.length,
      variantNames: allNames,
      builtinStrategies: allNames.filter((name) => builtinNames.includes(name)),
      customStrategies: allNames.filter((name) => !builtinNames.includes(name)),
    };
  }
}

// Global singleton instance for the registry
let globalRegistry: GlassVariantRegistry | null = null;

/**
 * Get the global glass variant registry
 * Lazy initialization ensures registry is created when first accessed
 */
export function getGlassVariantRegistry(): GlassVariantRegistry {
  if (!globalRegistry) {
    globalRegistry = new GlassVariantRegistry();
  }
  return globalRegistry;
}

/**
 * Set a custom global registry (for testing or custom configurations)
 */
export function setGlassVariantRegistry(registry: GlassVariantRegistry): void {
  globalRegistry = registry;
}

/**
 * Reset the global registry to default state
 */
export function resetGlassVariantRegistry(): void {
  globalRegistry = null;
}

/**
 * Convenience function to register a new variant globally
 */
export function registerGlassVariant(strategy: IGlassVariantStrategy): void {
  getGlassVariantRegistry().register(strategy);
}

/**
 * Convenience function to get config from global registry
 */
export function getGlassVariantConfig(
  variantName: string,
  props: GlassVariantProps,
): GlassVariantConfig {
  return getGlassVariantRegistry().getConfig(variantName, props);
}

export default GlassVariantRegistry;
