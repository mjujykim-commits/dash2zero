/**
 * Spacing Tokens — 8pt grid (UX-NEW-007)
 * Source: docs/brand/THEME_DECISIONS.md §3
 */

export const spacing = {
  "space.0":  0,
  "space.1":  4,
  "space.2":  8,
  "space.3":  12,
  "space.4":  16,
  "space.5":  20,
  "space.6":  24,
  "space.8":  32,
  "space.10": 40,
  "space.12": 48,
  "space.16": 64,
} as const;

export type SpaceToken = keyof typeof spacing;
