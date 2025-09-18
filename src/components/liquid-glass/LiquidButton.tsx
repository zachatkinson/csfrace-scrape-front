/**
 * LiquidButton Component
 * Interactive button with authentic Apple Liquid Glass material
 * Implements realistic press feedback and haptic-style interactions
 */

import React, { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export interface LiquidButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "size"> {
  children: ReactNode;

  // Button variants
  variant?: "primary" | "secondary" | "accent" | "ghost" | "destructive";

  // Sizing
  size?: "sm" | "md" | "lg" | "xl";

  // State
  loading?: boolean;
  disabled?: boolean;

  // Visual enhancements
  glow?: boolean;
  pulse?: boolean;

  // Icon support
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;

  // Custom styling
  fullWidth?: boolean;
  className?: string;
}

/**
 * LiquidButton - Premium interactive button with glass material
 */
export const LiquidButton = forwardRef<HTMLButtonElement, LiquidButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      loading = false,
      disabled = false,
      glow = false,
      pulse = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className = "",
      onClick,
      ...props
    },
    ref,
  ) => {
    // Generate variant-specific classes
    const getVariantClasses = (): string => {
      const variants = {
        primary:
          "text-white bg-gradient-to-r from-blue-500/80 to-purple-600/80 hover:from-blue-600/90 hover:to-purple-700/90",
        secondary: "text-white/90 hover:text-white hover:bg-white/10",
        accent:
          "text-white bg-gradient-to-r from-emerald-500/80 to-cyan-600/80 hover:from-emerald-600/90 hover:to-cyan-700/90",
        ghost: "text-white/80 hover:text-white hover:bg-white/5",
        destructive:
          "text-white bg-gradient-to-r from-red-500/80 to-pink-600/80 hover:from-red-600/90 hover:to-pink-700/90",
      };

      return variants[variant];
    };

    // Generate size-specific classes
    const getSizeClasses = (): string => {
      const sizes = {
        sm: "px-3 py-2 text-sm",
        md: "px-4 py-2.5 text-base",
        lg: "px-6 py-3 text-lg",
        xl: "px-8 py-4 text-xl",
      };

      return sizes[size];
    };

    // Generate state-based classes
    const getStateClasses = (): string => {
      const classes = [];

      if (disabled || loading) {
        classes.push("opacity-50 cursor-not-allowed");
      }

      if (glow) {
        classes.push("shadow-[0_0_20px_currentColor]");
      }

      if (pulse) {
        classes.push("animate-pulse");
      }

      if (fullWidth) {
        classes.push("w-full");
      }

      return classes.join(" ");
    };

    // Handle click with haptic feedback simulation
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || loading) {
        event.preventDefault();
        return;
      }

      // Add haptic feedback class temporarily
      const button = event.currentTarget;
      button.classList.add("scale-95");

      setTimeout(() => {
        button.classList.remove("scale-95");
      }, 100);

      if (onClick) {
        onClick(event);
      }
    };

    const buttonClasses = `
    ${getVariantClasses()}
    ${getSizeClasses()}
    ${getStateClasses()}
    font-medium rounded-glass
    transition-all duration-glass
    flex items-center justify-center gap-2
    focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-transparent
    active:scale-95
    ${className}
  `.trim();

    return (
      <button
        ref={ref}
        className={`liquid-glass glass-button liquid-glass-interactive ${loading ? "glass-loading" : ""} ${buttonClasses}`.trim()}
        onClick={handleClick}
        disabled={disabled || loading}
        {...props}
      >
        {/* Loading Spinner */}
        {loading && (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
        )}

        {/* Left Icon */}
        {leftIcon && !loading && (
          <span className="flex-shrink-0">{leftIcon}</span>
        )}

        {/* Button Content */}
        <span className={loading ? "opacity-0" : "opacity-100"}>
          {children}
        </span>

        {/* Right Icon */}
        {rightIcon && !loading && (
          <span className="flex-shrink-0">{rightIcon}</span>
        )}
      </button>
    );
  },
);

LiquidButton.displayName = "LiquidButton";

export default LiquidButton;
