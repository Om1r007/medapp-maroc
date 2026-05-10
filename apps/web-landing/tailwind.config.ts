import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          500: "#2563EB",
          600: "#1D4ED8",
          700: "#1E40AF",
          900: "#1E3A8A",
        },
        neutral: {
          50:  "#FAFAFA",
          100: "#F4F4F5",
          200: "#E4E4E7",
          300: "#D4D4D8",
          400: "#A1A1AA",
          500: "#71717A",
          600: "#52525B",
          700: "#3F3F46",
          800: "#27272A",
          900: "#18181B",
          950: "#0F172A",
        },
        success: {
          50:  "#F0FDF4",
          200: "#BBF7D0",
          500: "#10B981",
          600: "#16A34A",
          700: "#047857",
        },
        warning: {
          50:  "#FFFBEB",
          200: "#FDE68A",
          500: "#F59E0B",
          600: "#D97706",
          700: "#B45309",
        },
        error: {
          50:  "#FEF2F2",
          200: "#FECACA",
          500: "#EF4444",
          600: "#DC2626",
          700: "#B91C1C",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      fontSize: {
        xs:    ["0.75rem",   { lineHeight: "1rem",     letterSpacing: "0" }],
        sm:    ["0.875rem",  { lineHeight: "1.25rem",  letterSpacing: "0" }],
        base:  ["1rem",      { lineHeight: "1.5rem",   letterSpacing: "0" }],
        lg:    ["1.125rem",  { lineHeight: "1.75rem",  letterSpacing: "-0.01em" }],
        xl:    ["1.25rem",   { lineHeight: "1.75rem",  letterSpacing: "-0.01em" }],
        "2xl": ["1.5rem",    { lineHeight: "2rem",     letterSpacing: "-0.02em" }],
        "3xl": ["1.875rem",  { lineHeight: "2.25rem",  letterSpacing: "-0.02em" }],
        "4xl": ["2.25rem",   { lineHeight: "2.5rem",   letterSpacing: "-0.02em" }],
        "5xl": ["3rem",      { lineHeight: "1",        letterSpacing: "-0.03em" }],
        "6xl": ["3.75rem",   { lineHeight: "1",        letterSpacing: "-0.03em" }],
        "7xl": ["4.5rem",    { lineHeight: "1",        letterSpacing: "-0.03em" }],
      },
      borderRadius: {
        none: "0",
        sm:   "0.375rem",
        DEFAULT: "0.5rem",
        lg:   "0.75rem",
        xl:   "1rem",
        "2xl": "1rem",
        full: "9999px",
      },
      boxShadow: {
        xs:  "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        sm:  "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        md:  "0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.07)",
        lg:  "0 10px 15px -3px rgb(0 0 0 / 0.07), 0 4px 6px -4px rgb(0 0 0 / 0.07)",
        xl:  "0 20px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.08)",
      },
    },
  },
  plugins: [],
};
export default config;
