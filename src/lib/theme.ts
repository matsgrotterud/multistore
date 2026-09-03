import type { StoreTheme } from "@prisma/client";
import type { CSSProperties } from "react";

/**
 * Converts a StoreTheme row into the CSS custom properties consumed by
 * Tailwind (see tailwind.config.ts). Applied on the store layout wrapper so
 * every tenant gets its own palette from one stylesheet.
 */

const FONT_STACKS: Record<string, string> = {
  "system-ui":
    'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  serif: 'Georgia, Cambria, "Times New Roman", Times, serif',
  rounded:
    'ui-rounded, "SF Pro Rounded", system-ui, -apple-system, "Segoe UI", sans-serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, "Courier New", monospace',
  humanist:
    'Seravek, "Gill Sans Nova", Ubuntu, Calibri, "DejaVu Sans", system-ui, sans-serif',
  geometric:
    'Avenir, Montserrat, Corbel, "URW Gothic", source-sans-pro, system-ui, sans-serif',
};

function fontStack(name: string): string {
  return FONT_STACKS[name] ?? FONT_STACKS["system-ui"];
}

function hexChannels(hex: string): [number, number, number] {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  const value = match ? parseInt(match[1], 16) : 0;
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function relativeLuminance(hex: string): number {
  return hexChannels(hex)
    .map((channel) => channel / 255)
    .map((channel) =>
      channel <= 0.03928
        ? channel / 12.92
        : Math.pow((channel + 0.055) / 1.055, 2.4)
    )
    .reduce(
      (sum, channel, index) =>
        sum + channel * ([0.2126, 0.7152, 0.0722][index] ?? 0),
      0
    );
}

/** WCAG contrast ratio for two #rrggbb colors. Invalid colors resolve safely. */
export function contrastRatio(foreground: string, background: string): number {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

/** #rrggbb -> "r g b" channel triple for Tailwind <alpha-value> colors. */
function hexToRgbChannels(hex: string): string {
  return hexChannels(hex).join(" ");
}

/** #rrggbb -> rgba() string with the given alpha (for soft tints). */
function hexToRgba(hex: string, alpha: number): string {
  const [r, g, b] = hexChannels(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function buildThemeStyle(theme: StoreTheme | null): CSSProperties {
  const primary = theme?.primaryColor ?? "#1d4ed8";
  const secondary = theme?.secondaryColor ?? "#1e293b";
  const accent = theme?.accentColor ?? "#f59e0b";
  const background = theme?.backgroundColor ?? "#f8fafc";
  const text = theme?.textColor ?? "#0f172a";
  const radius = theme?.borderRadius ?? "0.75rem";

  return {
    "--color-primary": primary,
    "--color-primary-rgb": hexToRgbChannels(primary),
    "--color-primary-soft": hexToRgba(primary, 0.08),
    "--color-secondary": secondary,
    "--color-secondary-rgb": hexToRgbChannels(secondary),
    "--color-accent": accent,
    "--color-accent-rgb": hexToRgbChannels(accent),
    "--color-background": background,
    "--color-background-rgb": hexToRgbChannels(background),
    "--color-text": text,
    "--color-text-rgb": hexToRgbChannels(text),
    "--radius": radius,
    "--font-heading": fontStack(theme?.fontHeading ?? "system-ui"),
    "--font-body": fontStack(theme?.fontBody ?? "system-ui"),
  } as CSSProperties;
}
