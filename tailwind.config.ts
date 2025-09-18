import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1200px",
        "2xl": "1200px",
      },
    },
    extend: {
      // Liquid Glass Color Palette (Apple-inspired)
      colors: {
        // Base Glass Colors with Environmental Adaptation
        glass: {
          highlight: "rgba(255, 255, 255, 0.4)",
          shadow: "rgba(31, 38, 135, 0.37)",
          "illumination-light": "rgba(255, 255, 255, 0.1)",
          "illumination-dark": "rgba(0, 0, 0, 0.2)",
          "border-light": "rgba(255, 255, 255, 0.2)",
          "border-dark": "rgba(255, 255, 255, 0.1)",
          adaptive: "color-mix(in srgb, transparent 90%, currentColor 10%)",
        },

        // Apple-inspired text colors for better readability
        "apple-white": "#f2f2f7", // Apple's off-white primary text
        "apple-white-80": "#c7c7cc", // Apple's secondary text (80% opacity)
        "apple-white-60": "#8e8e93", // Apple's tertiary text (60% opacity)
        "apple-white-40": "#636366", // Apple's quaternary text (40% opacity)

        // Contextual Colors for Content Hierarchy
        primary: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
        },

        // Glass-optimized Status Colors
        status: {
          success: "rgba(34, 197, 94, 0.8)",
          warning: "rgba(251, 191, 36, 0.8)",
          error: "rgba(239, 68, 68, 0.8)",
          info: "rgba(59, 130, 246, 0.8)",
          processing: "rgba(168, 85, 247, 0.8)",
        },
      },

      // Liquid Glass Typography Scale
      fontFamily: {
        sans: [
          "SF Pro Display",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: ["SF Mono", "Menlo", "Monaco", "Consolas", "monospace"],
      },

      // Glass-specific Spacing
      spacing: {
        "glass-xs": "0.125rem",
        "glass-sm": "0.25rem",
        "glass-md": "0.5rem",
        "glass-lg": "1rem",
        "glass-xl": "2rem",
      },

      // Liquid Glass Backdrop Filters
      backdropBlur: {
        glass: "20px",
        "glass-subtle": "10px",
        "glass-strong": "40px",
      },

      // Liquid Glass Box Shadows (Three-Layer System)
      boxShadow: {
        // Highlight Layer
        "glass-highlight": "inset 0 1px 0 rgba(255, 255, 255, 0.4)",

        // Shadow Layer
        "glass-shadow": "0 8px 32px rgba(31, 38, 135, 0.37)",

        // Combined Three-Layer Effect
        glass: `
          0 8px 32px rgba(31, 38, 135, 0.37),
          inset 0 1px 0 rgba(255, 255, 255, 0.4)
        `,

        // Interactive States
        "glass-hover": `
          0 12px 40px rgba(31, 38, 135, 0.45),
          inset 0 1px 0 rgba(255, 255, 255, 0.5)
        `,

        "glass-active": `
          0 4px 16px rgba(31, 38, 135, 0.3),
          inset 0 1px 0 rgba(255, 255, 255, 0.3)
        `,
      },

      // Lensing and Refraction Effects
      transform: {
        "lens-subtle": "perspective(1000px) rotateX(0.5deg)",
        lens: "perspective(1000px) rotateX(1deg)",
        "lens-strong": "perspective(1000px) rotateX(2deg)",
      },

      // Glass Animation Timings
      transitionDuration: {
        glass: "300ms",
        "glass-fast": "150ms",
        "glass-slow": "500ms",
      },

      transitionTimingFunction: {
        glass: "cubic-bezier(0.4, 0, 0.2, 1)",
        "glass-bounce": "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
      },

      // Glass Border Radius
      borderRadius: {
        glass: "12px",
        "glass-lg": "16px",
        "glass-xl": "20px",
      },

      // Responsive Breakpoints (Apple-inspired)
      screens: {
        xs: "375px",
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1536px",
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),

    // Custom Liquid Glass Plugin
    function ({ addUtilities, theme }: { addUtilities: any; theme: any }) {
      const newUtilities = {
        // Base Liquid Glass Material
        ".liquid-glass": {
          background: theme("colors.glass.illumination-light"),
          "backdrop-filter": `blur(${theme("backdropBlur.glass")}) saturate(180%)`,
          border: `1px solid ${theme("colors.glass.border-light")}`,
          "box-shadow": theme("boxShadow.glass"),
          "border-radius": theme("borderRadius.glass"),
          transition: `all ${theme("transitionDuration.glass")} ${theme("transitionTimingFunction.glass")}`,
        },

        // Dark Mode Adaptation
        ".dark .liquid-glass": {
          background: theme("colors.glass.illumination-dark"),
          "border-color": theme("colors.glass.border-dark"),
        },

        // Interactive Glass States
        ".liquid-glass-interactive": {
          cursor: "pointer",
          "&:hover": {
            "box-shadow": theme("boxShadow.glass-hover"),
            transform: "translateY(-1px)",
          },
          "&:active": {
            "box-shadow": theme("boxShadow.glass-active"),
            transform: "translateY(0)",
          },
        },

        // Lensing Effects
        ".liquid-glass-lens": {
          transform: theme("transform.lens"),
        },

        // Content-Adaptive Glass
        ".liquid-glass-adaptive": {
          background: theme("colors.glass.adaptive"),
          "border-color":
            "color-mix(in srgb, transparent 80%, currentColor 20%)",
        },

        // Accessibility Reduced Motion
        "@media (prefers-reduced-motion: reduce)": {
          ".liquid-glass": {
            transition: "none",
            transform: "none",
          },
        },

        // High Contrast Mode
        "@media (prefers-contrast: high)": {
          ".liquid-glass": {
            background: "rgba(255, 255, 255, 0.9)",
            "border-color": "rgba(0, 0, 0, 0.5)",
          },
          ".dark .liquid-glass": {
            background: "rgba(0, 0, 0, 0.8)",
            "border-color": "rgba(255, 255, 255, 0.5)",
          },
        },
      };

      addUtilities(newUtilities);
    },
  ],
};

export default config;
