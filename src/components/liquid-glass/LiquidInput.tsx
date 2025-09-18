/**
 * LiquidInput Component
 * Form input with authentic Apple Liquid Glass material
 * Implements floating labels and contextual validation states
 */

import React, { forwardRef, useState, useId } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { LiquidGlass } from "./LiquidGlass";

export interface LiquidInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  // Label and help text
  label?: string;
  helperText?: string;
  errorText?: string | undefined;

  // Visual variants
  size?: "sm" | "md" | "lg";
  variant?: "default" | "filled" | "minimal";

  // States
  error?: boolean;
  success?: boolean;
  loading?: boolean;

  // Enhanced features
  floatingLabel?: boolean;
  clearable?: boolean;

  // Icons
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;

  // Custom styling
  className?: string;
  inputClassName?: string;

  // Callbacks
  onClear?: () => void;
}

/**
 * LiquidInput - Premium form input with glass material
 */
export const LiquidInput = forwardRef<HTMLInputElement, LiquidInputProps>(
  (
    {
      label,
      helperText,
      errorText,
      size = "md",
      variant = "default",
      error = false,
      success = false,
      loading = false,
      floatingLabel = false,
      clearable = false,
      leftIcon,
      rightIcon,
      className = "",
      inputClassName = "",
      onClear,
      value,
      placeholder,
      disabled,
      ...props
    },
    ref,
  ) => {
    const [focused, setFocused] = useState(false);
    const inputId = useId();
    const hasValue = Boolean(value);

    // Generate size-specific classes
    const getSizeClasses = (): {
      container: string;
      input: string;
      icon: string;
    } => {
      const sizes = {
        sm: {
          container: "h-9",
          input: "px-3 py-2 text-sm",
          icon: "w-4 h-4",
        },
        md: {
          container: "h-11",
          input: "px-4 py-3 text-base",
          icon: "w-5 h-5",
        },
        lg: {
          container: "h-13",
          input: "px-5 py-4 text-lg",
          icon: "w-6 h-6",
        },
      };

      return sizes[size];
    };

    // Generate state-specific classes
    const getStateClasses = (): string => {
      const classes = [];

      if (error) {
        classes.push(
          "border-red-500/50 focus:border-red-500 focus:ring-red-500/20",
        );
      } else if (success) {
        classes.push(
          "border-green-500/50 focus:border-green-500 focus:ring-green-500/20",
        );
      } else {
        classes.push(
          "border-white/20 focus:border-blue-500/50 focus:ring-blue-500/20",
        );
      }

      if (disabled) {
        classes.push("opacity-50 cursor-not-allowed");
      }

      return classes.join(" ");
    };

    // Generate variant-specific classes
    const getVariantClasses = (): string => {
      switch (variant) {
        case "filled":
          return "bg-white/10 border-white/30";
        case "minimal":
          return "bg-transparent border-0 border-b-2 rounded-none";
        default:
          return "bg-white/5 border-white/20";
      }
    };

    const sizeClasses = getSizeClasses();

    // Handle clear button
    const handleClear = () => {
      if (onClear) {
        onClear();
      }
    };

    // Floating label logic
    const isLabelFloating = floatingLabel && (focused || hasValue);

    return (
      <div className={`relative ${className}`.trim()}>
        {/* Static Label */}
        {label && !floatingLabel && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-white/80 mb-2"
          >
            {label}
          </label>
        )}

        {/* Input Container */}
        <div className="relative">
          <LiquidGlass
            variant="input"
            className={`
            relative flex items-center
            ${sizeClasses.container}
            ${getVariantClasses()}
            ${getStateClasses()}
            transition-all duration-glass
          `.trim()}
          >
            {/* Left Icon */}
            {leftIcon && (
              <div
                className={`flex-shrink-0 text-white/60 ml-3 ${sizeClasses.icon}`}
              >
                {leftIcon}
              </div>
            )}

            {/* Input Field */}
            <input
              ref={ref}
              id={inputId}
              value={value}
              placeholder={floatingLabel ? "" : placeholder}
              disabled={disabled}
              className={`
              flex-1 bg-transparent border-none outline-none
              text-white placeholder:text-white/50
              ${sizeClasses.input}
              ${leftIcon ? "pl-2" : ""}
              ${rightIcon || clearable || loading ? "pr-2" : ""}
              ${inputClassName}
            `.trim()}
              onFocus={(e) => {
                setFocused(true);
                props.onFocus?.(e);
              }}
              onBlur={(e) => {
                setFocused(false);
                props.onBlur?.(e);
              }}
              {...props}
            />

            {/* Floating Label */}
            {floatingLabel && label && (
              <label
                htmlFor={inputId}
                className={`
                absolute left-4 text-white/60 pointer-events-none
                transition-all duration-glass origin-left
                ${
                  isLabelFloating
                    ? "text-xs -top-2 scale-90 bg-glass-illumination px-2 rounded"
                    : "text-base top-1/2 -translate-y-1/2"
                }
                ${error ? "text-red-400" : success ? "text-green-400" : focused ? "text-blue-400" : ""}
              `.trim()}
              >
                {label}
              </label>
            )}

            {/* Right Icons Container */}
            <div className="flex items-center gap-2 mr-3">
              {/* Loading Spinner */}
              {loading && (
                <div className="animate-spin rounded-full w-4 h-4 border-2 border-white/30 border-t-white"></div>
              )}

              {/* Clear Button */}
              {clearable && hasValue && !loading && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-white/60 hover:text-white/80 transition-colors"
                  tabIndex={-1}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}

              {/* Right Icon */}
              {rightIcon && !loading && (
                <div
                  className={`flex-shrink-0 text-white/60 ${sizeClasses.icon}`}
                >
                  {rightIcon}
                </div>
              )}
            </div>
          </LiquidGlass>
        </div>

        {/* Helper Text */}
        {(helperText || errorText) && (
          <p
            className={`mt-2 text-sm ${error ? "text-red-400" : "text-white/60"}`}
          >
            {error ? errorText : helperText}
          </p>
        )}
      </div>
    );
  },
);

LiquidInput.displayName = "LiquidInput";

export default LiquidInput;
