import type { Config } from "tailwindcss";

/**
 * Theme colors map to CSS variables that are set per-store in
 * src/app/s/[store]/layout.tsx, so a single Tailwind build serves
 * every tenant with its own palette.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // RGB channel variables so Tailwind opacity modifiers (e.g. ink/60)
        // work with per-store dynamic palettes.
        primary: "rgb(var(--color-primary-rgb) / <alpha-value>)",
        "primary-soft": "var(--color-primary-soft)",
        secondary: "rgb(var(--color-secondary-rgb) / <alpha-value>)",
        accent: "rgb(var(--color-accent-rgb) / <alpha-value>)",
        surface: "rgb(var(--color-background-rgb) / <alpha-value>)",
        ink: "rgb(var(--color-text-rgb) / <alpha-value>)",
      },
      borderRadius: {
        theme: "var(--radius)",
        "theme-lg": "calc(var(--radius) * 1.5)",
      },
      fontFamily: {
        heading: "var(--font-heading)",
        body: "var(--font-body)",
      },
      maxWidth: {
        site: "80rem",
      },
    },
  },
  plugins: [],
};

export default config;
