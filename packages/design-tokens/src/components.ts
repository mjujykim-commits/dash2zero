/**
 * Component Tokens — Source: docs/brand/THEME_DECISIONS.md §5
 */

export const components = {
  button: {
    primary: {
      height: 56,
      paddingX: 20,
      radius: 12,
      bg: "brand.primary",
      bgPressed: "brand.primary.pressed",
      text: "text.inverse",
      shadow: "s1",
    },
    secondary: {
      height: 48,
      paddingX: 16,
      radius: 12,
      bg: "surface.muted",
      text: "text.primary",
    },
    ghost: {
      height: 44,
      paddingX: 12,
      radius: 10,
      bg: "transparent",
      text: "brand.primary",
    },
  },
  audio: {
    button: {
      size: 44,
      radius: 22,
      bg: "brand.primary",
      states: ["idle", "loading", "playing", "error"] as const,
    },
  },
  card: {
    base: {
      paddingAll: 20,
      radius: 16,
      bg: "surface.card",
      shadow: "s0",
      border: { color: "border.subtle", width: 1 },
    },
    lesson: {
      paddingV: 24,
      paddingH: 20,
      radius: 20,
      bg: "surface.card",
      shadow: "s1",
    },
  },
  list: {
    item: {
      minHeight: 56,
      paddingH: 16,
      paddingV: 12,
      bg: "surface.card",
      divider: { color: "border.subtle", width: 1 },
    },
  },
  toggle: {
    width: 48,
    height: 28,
    radius: 9999,
    bgOff: "border.subtle",
    bgOn: "brand.primary",
    motion: { duration: 150, easing: "ease-out" },
  },
  sheet: {
    bg: "surface.bg",
    radiusTop: 20,
    handleSize: { w: 40, h: 4 },
    paddingAll: 20,
    shadow: "s2",
  },
  quiz: {
    option: {
      minHeight: 56,
      radius: 14,
      paddingAll: 16,
      bg: "surface.card",
      border: { color: "border.subtle", width: 1 },
      states: {
        selected: { borderColor: "brand.primary", borderWidth: 2, bg: "surface.muted" },
        correct: { borderColor: "semantic.success", borderWidth: 2, bgOpacity: 0.08 },
        incorrect: { borderColor: "semantic.danger", borderWidth: 2, bgOpacity: 0.08 },
      },
    },
  },
} as const;

export type ComponentToken = keyof typeof components;
