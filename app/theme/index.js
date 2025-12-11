import React, { createContext, useContext, useMemo, useState } from 'react'
import { useColorScheme, StyleSheet } from 'react-native'

const base = {
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 },
  radius: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, pill: 999, full: 9999 },
  typography: {
    fontFamily: {
      body: 'System',
      heading: 'System',
    },
    sizes: {
      xs: 11,
      sm: 13,
      base: 15,
      md: 17,
      lg: 20,
      xl: 24,
      xxl: 32,
    },
    weights: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
  },
}

export const lightTheme = {
  mode: 'light',
  colors: {
    // Primary brand color
    bondedPurple: '#A45CFF',
    purple: '#A45CFF',
    
    // Modern neutral palette
    white: '#FFFFFF',
    black: '#000000',
    charcoal: '#000000',
    softBlack: '#262626',
    darkGray: '#16181C',
    gray: '#737373',
    lightGray: '#DBDBDB',
    offWhite: '#FAFAFA',
    
    // Semantic colors
    error: '#ED4956',
    success: '#00BA7C',
    warning: '#FFD23F',
    info: '#0095F6',
    
    // Backgrounds
    background: '#FFFFFF',
    backgroundSecondary: '#FAFAFA',
    backgroundTertiary: '#F5F5F5',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    
    // Text
    textPrimary: '#262626',
    textSecondary: '#8E8E8E',
    textTertiary: '#C7C7C7',
    
    // Borders
    border: '#A0A0A0',
    borderSecondary: '#B0B0B0',
    
    // Accent
    accent: '#9F6CFF',
    
    // Overlays
    overlay: 'rgba(0, 0, 0, 0.65)',
    overlayLight: 'rgba(0, 0, 0, 0.3)',
  },
  // Event type colors
  eventColors: {
    personal: '#A45CFF',
    org: '#34C759',
    campus: '#007AFF',
    public: '#FF9500',
    task: '#808080',
  },
  // Forum tag colors (for post tags like QUESTION, CONFESSION, etc.)
  tagColors: {
    QUESTION: '#007AFF',
    CONFESSION: '#FF6B6B',
    CRUSH: '#FF69B4',
    'DM ME': '#00CED1',
    EVENT: '#FF9500',
    PSA: '#FF3B30',
    SHOUTOUT: '#34C759',
    DUB: '#FFD700',
    RIP: '#808080',
    MEME: '#A45CFF',
    'LOST & FOUND': '#D2691E',
    // Forum category tags (subtle colors)
    Housing: { bg: '#F0F9F4', text: '#166534', border: '#22C55E' },
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
  // Status colors
  statusColors: {
    success: '#00BA7C',
    error: '#ED4956',
    warning: '#FFD23F',
    info: '#0095F6',
  },
  // Social media colors (static, no dark variant)
  socialColors: {
    instagram: '#E4405F',
    spotify: '#1DB954',
    tiktok: '#000000',
  },
  ...base,
}

export const darkTheme = {
  mode: 'dark',
  colors: {
    // Primary brand color
    bondedPurple: '#A45CFF',
    purple: '#A45CFF',
    
    // Modern neutral palette
    white: '#FFFFFF',
    black: '#000000',
    charcoal: '#1A1A1A',
    softBlack: '#2A2A2A',
    darkGray: '#16181C',
    gray: '#8E8E8E',
    lightGray: '#4A4A4A',
    offWhite: '#2A2A2A',
    
    // Semantic colors
    error: '#FF6B6B',
    success: '#4ECDC4',
    warning: '#FFE66D',
    info: '#4A90E2',
    
    // Backgrounds
    background: '#0F0D14',
    backgroundSecondary: '#16141D',
    backgroundTertiary: '#1A1820',
    surface: '#16141D',
    card: '#16141D',
    
    // Text
    textPrimary: '#E6E6EF',
    textSecondary: '#B6B6C2',
    textTertiary: '#8A8A95',
    
    // Borders
    border: 'rgba(255, 255, 255, 0.15)',
    borderSecondary: 'rgba(255, 255, 255, 0.1)',
    
    // Accent
    accent: '#9F6CFF',
    
    // Overlays
    overlay: 'rgba(0, 0, 0, 0.75)',
    overlayLight: 'rgba(0, 0, 0, 0.5)',
  },
  // Event type colors (slightly adjusted for dark mode)
  eventColors: {
    personal: '#B575FF',
    org: '#4ECDC4',
    campus: '#5AA3FF',
    public: '#FFB84D',
    task: '#9E9E9E',
  },
  // Forum tag colors (adjusted for dark mode visibility)
  tagColors: {
    QUESTION: '#5AA3FF',
    CONFESSION: '#FF8A8A',
    CRUSH: '#FF8FC7',
    'DM ME': '#4ECDC4',
    EVENT: '#FFB84D',
    PSA: '#FF6B6B',
    SHOUTOUT: '#4ECDC4',
    DUB: '#FFE66D',
    RIP: '#B0B0B0',
    MEME: '#B575FF',
    'LOST & FOUND': '#E6A366',
    // Forum category tags (darker variants for dark mode)
    Housing: { bg: '#1A2E1F', text: '#4ECDC4', border: '#22C55E' },
    STEM: { bg: '#1A2332', text: '#5AA3FF', border: '#3B82F6' },
    'Need Help': { bg: '#2E2419', text: '#FFB84D', border: '#F97316' },
    'Lost & Found': { bg: '#2A1F32', text: '#B575FF', border: '#A855F7' },
    'Roommate Match': { bg: '#1A2332', text: '#4ECDC4', border: '#0EA5E9' },
    Events: { bg: '#2E1F28', text: '#FF8FC7', border: '#EC4899' },
    Advice: { bg: '#2E2A19', text: '#FFE66D', border: '#EAB308' },
    Clubs: { bg: '#1F1F32', text: '#8A8AFF', border: '#6366F1' },
    Random: { bg: '#1A2E1F', text: '#4ECDC4', border: '#22C55E' },
    Confessions: { bg: '#2E1F1F', text: '#FF8A8A', border: '#EF4444' },
    'Study Group': { bg: '#1A2E2A', text: '#4ECDC4', border: '#14B8A6' },
    'Class Discussion': { bg: '#2A1F32', text: '#B575FF', border: '#8B5CF6' },
    'Campus Life': { bg: '#1A2E1F', text: '#4ECDC4', border: '#22C55E' },
    Food: { bg: '#2E2419', text: '#FFB84D', border: '#F97316' },
    Transportation: { bg: '#1A2E32', text: '#4ECDC4', border: '#06B6D4' },
    Jobs: { bg: '#1F1F32', text: '#8A8AFF', border: '#6366F1' },
    'Buy/Sell': { bg: '#2A1F32', text: '#B575FF', border: '#A855F7' },
  },
  // Status colors (adjusted for dark mode)
  statusColors: {
    success: '#4ECDC4',
    error: '#FF6B6B',
    warning: '#FFE66D',
    info: '#5AA3FF',
  },
  // Social media colors (static, no dark variant)
  socialColors: {
    instagram: '#E4405F',
    spotify: '#1DB954',
    tiktok: '#FFFFFF',
  },
  ...base,
}

// Component variant styles (functions that return style objects)
const createButtonVariants = (theme) => ({
  primary: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.md,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  secondary: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.radius.md,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  outline: {
    backgroundColor: 'transparent',
    borderRadius: theme.radius.md,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: theme.colors.accent,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderRadius: theme.radius.md,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
})

const createCardVariants = (theme) => ({
  default: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
  },
  elevated: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    ...theme.shadows.md,
  },
  outlined: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  flat: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
  },
})

const createInputVariants = (theme) => ({
  default: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  filled: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.radius.md,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  outlined: {
    backgroundColor: 'transparent',
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
})

// Add component variants to themes
lightTheme.buttonVariants = createButtonVariants(lightTheme)
lightTheme.cardVariants = createCardVariants(lightTheme)
lightTheme.inputVariants = createInputVariants(lightTheme)

darkTheme.buttonVariants = createButtonVariants(darkTheme)
darkTheme.cardVariants = createCardVariants(darkTheme)
darkTheme.inputVariants = createInputVariants(darkTheme)

const ThemeContext = createContext({ theme: lightTheme, setMode: () => {} })

export const ThemeProvider = ({ children }) => {
  const scheme = useColorScheme()
  const [mode, setMode] = useState(scheme === 'dark' ? 'dark' : 'light')

  const value = useMemo(() => {
    const theme = mode === 'dark' ? darkTheme : lightTheme
    return { theme, setMode }
  }, [mode])

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

// Default export to satisfy Expo Router expectations
export default ThemeProvider

