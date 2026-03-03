import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useColorScheme } from 'react-native'

// ─────────────────────────────────────────────────────
// MergeFund Design System — Strict Token Architecture
// ─────────────────────────────────────────────────────
// Every visual primitive is defined here. Components must
// reference tokens — never hardcode hex, spacing, or radii.

// ── 4pt / 8pt Spatial Grid ──────────────────────────
const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
}

// ── Border Radii ────────────────────────────────────
const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 9999,
}

// ── Typography ──────────────────────────────────────
const typography = {
  fontFamily: {
    body: 'Inter_400Regular',
    heading: 'Inter_600SemiBold',
    medium: 'Inter_500Medium',
    semibold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
    extrabold: 'Inter_800ExtraBold',
  },
  sizes: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    xxl: 30,
    display: 36,
  },
  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
  letterSpacing: {
    tighter: -0.5,
    tight: -0.25,
    normal: 0,
    wide: 0.25,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
}

// ── Semantic Color Palette ──────────────────────────
const palette = {
  brand: '#7C3AED',
  brandLight: '#8B5CF6',
  brandMuted: 'rgba(124, 58, 237, 0.12)',

  destructive: '#EF4444',
  success: '#16A34A',
  warning: '#EAB308',
  info: '#3B82F6',
}

// ── Transition / Animation Tokens ───────────────────
const motion = {
  duration: {
    fast: 120,
    normal: 200,
    slow: 350,
  },
  easing: 'ease-in-out',
  pressScale: 0.98,
}

// ── Shadows ─────────────────────────────────────────
const shadows = {
  none: {},
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
}

// ── Font Weight → Family Resolver ────────────────────
// On RN, custom fonts require the exact registered name per weight.
// Use this instead of combining fontFamily + fontWeight.
export const fontForWeight = (weight = '400') => {
  switch (String(weight)) {
    case '800':
    case 'extrabold':
      return typography.fontFamily.extrabold
    case '700':
    case 'bold':
      return typography.fontFamily.bold
    case '600':
    case 'semibold':
      return typography.fontFamily.semibold
    case '500':
    case 'medium':
      return typography.fontFamily.medium
    default:
      return typography.fontFamily.body
  }
}

// ── Shared Base ─────────────────────────────────────
const base = { spacing, radius, typography, motion, shadows, fontForWeight }

// ═════════════════════════════════════════════════════
//  LIGHT THEME
// ═════════════════════════════════════════════════════
export const lightTheme = {
  mode: 'light',
  colors: {
    // Core
    background: '#FFFFFF',
    foreground: '#171717',

    // Surfaces
    backgroundSecondary: '#F5F5F5',
    backgroundTertiary: '#E5E5E5',
    surface: '#FFFFFF',
    card: '#FFFFFF',

    // Text
    textPrimary: '#171717',
    textSecondary: '#525252',
    textTertiary: '#A3A3A3',
    textMuted: '#737373',

    // Brand
    brand: palette.brand,
    brandLight: palette.brandLight,
    brandMuted: palette.brandMuted,
    bondedPurple: palette.brand,
    purple: palette.brand,
    accent: palette.brand,

    // Semantic
    error: palette.destructive,
    destructive: palette.destructive,
    success: palette.success,
    warning: palette.warning,
    info: palette.info,

    // Borders
    border: 'rgba(0, 0, 0, 0.08)',
    borderSecondary: 'rgba(0, 0, 0, 0.05)',
    borderFocus: palette.brand,

    // Neutrals (backwards compat)
    white: '#FFFFFF',
    black: '#000000',
    charcoal: '#171717',
    softBlack: '#262626',
    darkGray: '#171717',
    gray: '#737373',
    lightGray: '#D4D4D4',
    offWhite: '#F5F5F5',

    // Overlays
    overlay: 'rgba(0, 0, 0, 0.60)',
    overlayLight: 'rgba(0, 0, 0, 0.25)',
  },
  eventColors: {
    personal: palette.brand,
    org: palette.success,
    campus: palette.info,
    public: palette.warning,
    task: '#737373',
  },
  tagColors: {
    QUESTION: palette.info,
    CONFESSION: '#EF4444',
    CRUSH: '#EC4899',
    'DM ME': '#06B6D4',
    EVENT: '#F59E0B',
    PSA: '#EF4444',
    SHOUTOUT: palette.success,
    DUB: '#EAB308',
    RIP: '#737373',
    MEME: palette.brand,
    'LOST & FOUND': '#D97706',
    Housing: { bg: '#F0FDF4', text: '#166534', border: '#22C55E' },
    STEM: { bg: '#EFF6FF', text: '#1E40AF', border: '#3B82F6' },
    'Need Help': { bg: '#FFF7ED', text: '#9A3412', border: '#F97316' },
    'Lost & Found': { bg: '#FAF5FF', text: '#6B21A8', border: '#A855F7' },
    'Roommate Match': { bg: '#F0F9FF', text: '#0C4A6E', border: '#0EA5E9' },
    Events: { bg: '#FDF2F8', text: '#9F1239', border: '#EC4899' },
    Advice: { bg: '#FEFCE8', text: '#713F12', border: '#EAB308' },
    Clubs: { bg: '#EEF2FF', text: '#3730A3', border: '#6366F1' },
    Random: { bg: '#F0FDF4', text: '#166534', border: '#22C55E' },
    Confessions: { bg: '#FFF1F2', text: '#991B1B', border: '#EF4444' },
    'Study Group': { bg: '#F0FDFA', text: '#134E4A', border: '#14B8A6' },
    'Class Discussion': { bg: '#F5F3FF', text: '#5B21B6', border: '#8B5CF6' },
    'Campus Life': { bg: '#F0F9F4', text: '#14532D', border: '#22C55E' },
    Food: { bg: '#FFF7ED', text: '#9A3412', border: '#F97316' },
    Transportation: { bg: '#ECFEFF', text: '#164E63', border: '#06B6D4' },
    Jobs: { bg: '#EEF2FF', text: '#312E81', border: '#6366F1' },
    'Buy/Sell': { bg: '#FAF5FF', text: '#581C87', border: '#A855F7' },
  },
  statusColors: {
    success: palette.success,
    error: palette.destructive,
    warning: palette.warning,
    info: palette.info,
  },
  socialColors: {
    instagram: '#E4405F',
    spotify: '#1DB954',
    tiktok: '#000000',
  },
  ...base,
}

// ═════════════════════════════════════════════════════
//  DARK THEME — Premium near-black (#0A0A0A)
// ═════════════════════════════════════════════════════
export const darkTheme = {
  mode: 'dark',
  colors: {
    // Core
    background: '#0A0A0A',
    foreground: '#FAFAFA',

    // Surfaces
    backgroundSecondary: '#141414',
    backgroundTertiary: '#1C1C1C',
    surface: '#141414',
    card: '#181818',

    // Text
    textPrimary: '#FAFAFA',
    textSecondary: '#A3A3A3',
    textTertiary: '#737373',
    textMuted: '#525252',

    // Brand
    brand: palette.brand,
    brandLight: palette.brandLight,
    brandMuted: 'rgba(124, 58, 237, 0.15)',
    bondedPurple: palette.brand,
    purple: palette.brand,
    accent: palette.brand,

    // Semantic
    error: '#F87171',
    destructive: '#F87171',
    success: '#4ADE80',
    warning: '#FACC15',
    info: '#60A5FA',

    // Borders
    border: 'rgba(255, 255, 255, 0.10)',
    borderSecondary: 'rgba(255, 255, 255, 0.06)',
    borderFocus: palette.brand,

    // Neutrals (backwards compat)
    white: '#FFFFFF',
    black: '#000000',
    charcoal: '#0A0A0A',
    softBlack: '#141414',
    darkGray: '#0A0A0A',
    gray: '#A3A3A3',
    lightGray: '#404040',
    offWhite: '#141414',

    // Overlays
    overlay: 'rgba(0, 0, 0, 0.72)',
    overlayLight: 'rgba(0, 0, 0, 0.45)',
  },
  eventColors: {
    personal: palette.brandLight,
    org: '#4ADE80',
    campus: '#60A5FA',
    public: '#FACC15',
    task: '#A3A3A3',
  },
  tagColors: {
    QUESTION: '#60A5FA',
    CONFESSION: '#F87171',
    CRUSH: '#F9A8D4',
    'DM ME': '#22D3EE',
    EVENT: '#FACC15',
    PSA: '#F87171',
    SHOUTOUT: '#4ADE80',
    DUB: '#FDE68A',
    RIP: '#A3A3A3',
    MEME: palette.brandLight,
    'LOST & FOUND': '#FBBF24',
    Housing: { bg: '#0A1F0F', text: '#4ADE80', border: '#22C55E' },
    STEM: { bg: '#0A1528', text: '#60A5FA', border: '#3B82F6' },
    'Need Help': { bg: '#1A1408', text: '#FACC15', border: '#F59E0B' },
    'Lost & Found': { bg: '#150A20', text: '#C084FC', border: '#A855F7' },
    'Roommate Match': { bg: '#0A1520', text: '#22D3EE', border: '#0EA5E9' },
    Events: { bg: '#200A18', text: '#F9A8D4', border: '#EC4899' },
    Advice: { bg: '#1A1508', text: '#FDE68A', border: '#EAB308' },
    Clubs: { bg: '#100A22', text: '#C7D2FE', border: '#6366F1' },
    Random: { bg: '#0A1F0F', text: '#4ADE80', border: '#22C55E' },
    Confessions: { bg: '#200A0A', text: '#F87171', border: '#EF4444' },
    'Study Group': { bg: '#0A1815', text: '#2DD4BF', border: '#14B8A6' },
    'Class Discussion': { bg: '#150A20', text: '#C084FC', border: '#8B5CF6' },
    'Campus Life': { bg: '#0A1F0F', text: '#4ADE80', border: '#22C55E' },
    Food: { bg: '#1A1408', text: '#FACC15', border: '#F59E0B' },
    Transportation: { bg: '#0A1520', text: '#22D3EE', border: '#06B6D4' },
    Jobs: { bg: '#100A22', text: '#C7D2FE', border: '#6366F1' },
    'Buy/Sell': { bg: '#150A20', text: '#C084FC', border: '#A855F7' },
  },
  statusColors: {
    success: '#4ADE80',
    error: '#F87171',
    warning: '#FACC15',
    info: '#60A5FA',
  },
  socialColors: {
    instagram: '#E4405F',
    spotify: '#1DB954',
    tiktok: '#FFFFFF',
  },
  ...base,
}

// ── Component Variant Generators ────────────────────
const buildVariants = (theme) => {
  theme.buttonVariants = {
    primary: {
      backgroundColor: theme.colors.brand,
      borderRadius: radius.pill,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
    },
    linear: {
      backgroundColor: theme.colors.foreground,
      borderRadius: radius.pill,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
    },
    secondary: {
      backgroundColor: 'transparent',
      borderRadius: radius.pill,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderRadius: radius.md,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    destructive: {
      backgroundColor: theme.colors.destructive,
      borderRadius: radius.pill,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
    },
  }

  theme.cardVariants = {
    default: {
      backgroundColor: theme.colors.card,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    elevated: {
      backgroundColor: theme.colors.card,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...shadows.sm,
    },
    flat: {
      backgroundColor: theme.colors.backgroundSecondary,
      borderRadius: radius.md,
    },
  }

  theme.inputVariants = {
    default: {
      backgroundColor: theme.colors.backgroundSecondary,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md + spacing.xs,
    },
    focused: {
      borderColor: theme.colors.borderFocus,
    },
    error: {
      borderColor: theme.colors.destructive,
    },
  }

  theme.ui = {
    chip: {
      height: 32,
      paddingHorizontal: spacing.md,
      radius: radius.pill,
      textSize: typography.sizes.sm,
    },
    fab: {
      size: 56,
      radius: 28,
    },
    text: {
      display: { fontSize: typography.sizes.display, fontFamily: typography.fontFamily.extrabold, color: theme.colors.textPrimary, letterSpacing: typography.letterSpacing.tighter },
      heading: { fontSize: typography.sizes.xl, fontFamily: typography.fontFamily.bold, color: theme.colors.textPrimary, letterSpacing: typography.letterSpacing.tight },
      title: { fontSize: typography.sizes.lg, fontFamily: typography.fontFamily.semibold, color: theme.colors.textPrimary, letterSpacing: typography.letterSpacing.tight },
      body: { fontSize: typography.sizes.base, fontFamily: typography.fontFamily.body, color: theme.colors.textPrimary, letterSpacing: typography.letterSpacing.normal },
      caption: { fontSize: typography.sizes.sm, fontFamily: typography.fontFamily.medium, color: theme.colors.textSecondary, letterSpacing: typography.letterSpacing.normal },
      meta: { fontSize: typography.sizes.xs, fontFamily: typography.fontFamily.medium, color: theme.colors.textTertiary, letterSpacing: typography.letterSpacing.wide },
    },
  }
}

buildVariants(lightTheme)
buildVariants(darkTheme)

// ── Route-Aware Theme Context ───────────────────────
const FORCE_LIGHT_ROUTES = ['/', '/index', '/welcome', '/login', '/otp', '/onboarding', '/auth/callback']

/** @type {React.Context<{theme: typeof lightTheme, setMode: (mode: string|null) => void}>} */
const ThemeContext = createContext({ theme: lightTheme, setMode: (_mode) => {} })

/**
 * routePath prop is read synchronously each render — no useState/useEffect lag.
 * Auth/onboarding routes force light; everything else follows system or user pref.
 * @param {{ children: React.ReactNode, routePath?: string | null }} props
 */
export const ThemeProvider = ({ children, routePath = null }) => {
  const scheme = useColorScheme()
  const [userMode, setUserMode] = useState(null)

  const isForceLight = FORCE_LIGHT_ROUTES.some(
    (r) => routePath === r || routePath?.startsWith('/auth')
  )

  const resolvedMode = useMemo(() => {
    if (isForceLight) return 'light'
    if (userMode) return userMode
    return scheme === 'dark' ? 'dark' : 'light'
  }, [isForceLight, userMode, scheme])

  const value = useMemo(() => {
    const theme = resolvedMode === 'dark' ? darkTheme : lightTheme
    return { theme, setMode: setUserMode }
  }, [resolvedMode])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useAppTheme = () => {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useAppTheme must be used within ThemeProvider')
  return ctx.theme
}

export const useThemeMode = () => {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useThemeMode must be used within ThemeProvider')
  return { mode: ctx.theme.mode, setMode: ctx.setMode }
}

// Kept for backward compat — now a no-op since routePath is a prop on ThemeProvider.
export const useThemeRouteSync = () => () => {}

export default ThemeProvider
