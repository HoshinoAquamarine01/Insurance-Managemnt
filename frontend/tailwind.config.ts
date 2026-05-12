import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      // Custom color palette from DESIGN.md
      colors: {
        // Brand Teal (Primary)
        brand: {
          50: "#d0f4f1",
          100: "#b3ebe6",
          200: "#7dd9d0",
          300: "#47c7ba",
          400: "#0d9488",
          600: "#0d9488", // Primary
          700: "#0f766e", // Hover
          800: "#0d5d54",
          900: "#0a3d38",
        },
        // Semantic Colors
        success: "#10b981",
        warning: "#f59e0b",
        error: "#ef4444",
        info: "#3b82f6",

        // Role-specific accents
        creator: "#f97316", // Orange
        accountant: "#8b5cf6", // Purple
        supervisor: "#6366f1", // Indigo
        admin: "#64748b", // Slate

        // Neutral Grays
        neutral: {
          50: "#f9fafb",
          100: "#f3f4f6",
          200: "#e5e7eb",
          300: "#d1d5db",
          400: "#9ca3af",
          500: "#6b7280", // Body text
          600: "#4b5563",
          700: "#374151",
          800: "#1f2937",
          900: "#111827", // Headings
        },
      },

      // Typography tokens
      fontSize: {
        // H1 - Page Title
        h1: ["32px", { lineHeight: "40px", fontWeight: "700" }],
        // H2 - Section Title
        h2: ["24px", { lineHeight: "32px", fontWeight: "600" }],
        // H3 - Subsection
        h3: ["20px", { lineHeight: "28px", fontWeight: "600" }],
        // Body Large
        lg: ["16px", { lineHeight: "24px", fontWeight: "400" }],
        // Body Regular (default)
        base: ["14px", { lineHeight: "20px", fontWeight: "400" }],
        // Small
        sm: ["12px", { lineHeight: "16px", fontWeight: "500" }],
        // Code / Mono
        mono: ["13px", { lineHeight: "20px", fontWeight: "400" }],
      },

      // Spacing system: 4px base unit
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        "2xl": "48px",
      },

      // Border radius
      borderRadius: {
        sharp: "0px",
        subtle: "4px",
        default: "8px",
        pill: "20px",
      },

      // Shadow levels
      boxShadow: {
        none: "0 0 #0000",
        subtle: "0 1px 2px rgba(0, 0, 0, 0.05)",
        medium: "0 4px 6px rgba(0, 0, 0, 0.1)",
        elevated: "0 10px 15px rgba(0, 0, 0, 0.1)",
      },

      // Custom animations
      animation: {
        "slide-in-top": "slideInTop 300ms ease-out",
        "spin-loader": "spinLoader 2s linear infinite",
      },

      keyframes: {
        slideInTop: {
          from: { opacity: "0", transform: "translateY(-20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        spinLoader: {
          to: { transform: "rotate(360deg)" },
        },
      },

      // Responsive breakpoints (custom if needed)
      screens: {
        xs: "320px",
        sm: "640px",
        md: "1024px",
        lg: "1280px",
        xl: "1536px",
      },
    },
  },

  // Safelist for dynamic class generation
  safelist: [
    // Status badge colors
    { pattern: /^(bg|text)-(success|warning|error|info)/ },
    // Role accents
    { pattern: /^(bg|text|border)-(creator|accountant|supervisor|admin)/ },
    // Brand colors
    { pattern: /^(bg|text|border)-brand-/ },
  ],

  plugins: [],
};

export default config;
