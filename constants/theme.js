const theme = {
  colors: {
    // Primary brand color
    bondedPurple: '#A45CFF',
    purple: '#A45CFF',
    
    // Modern neutral palette (Instagram/X inspired)
    white: '#FFFFFF',
    black: '#000000',
    charcoal: '#000000', // Pure black for modern look
    softBlack: '#262626', // Instagram soft black
    darkGray: '#16181C', // X/Twitter dark
    gray: '#737373', // Instagram gray
    lightGray: '#DBDBDB', // Instagram light gray
    offWhite: '#FAFAFA', // Instagram off-white
    
    // Semantic colors
    error: '#ED4956', // Instagram red
    success: '#00BA7C',
    warning: '#FFD23F',
    info: '#0095F6', // Instagram blue
    
    // Backgrounds
    background: '#FFFFFF',
    backgroundSecondary: '#FAFAFA',
    backgroundTertiary: '#F5F5F5',
    
    // Text
    textPrimary: '#262626', // Instagram primary text
    textSecondary: '#8E8E8E', // Instagram secondary text
    textTertiary: '#C7C7C7',
    
    // Borders
    border: '#DBDBDB', // Instagram border
    borderSecondary: '#EFEFEF',
    
    // Overlays
    overlay: 'rgba(0, 0, 0, 0.65)', // Instagram overlay
    overlayLight: 'rgba(0, 0, 0, 0.3)',
  },
  radius: {
    full: 9999,
    pill: 9999,
    xl: 20,
    lg: 16,
    md: 12,
    sm: 8,
    xs: 4,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
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
  typography: {
    fontFamily: {
      heading: 'System',
      body: 'System',
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
}

export default theme


