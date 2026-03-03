import { lightTheme } from '../app/theme'

export const ONBOARDING_THEME = {
  ...lightTheme,
  colors: {
    ...lightTheme.colors,
    backgroundSecondary: 'rgba(255, 255, 255, 0.2)',
    border: 'rgba(0, 0, 0, 0.1)',
    offWhite: 'rgba(0, 0, 0, 0.05)',
  },
}
