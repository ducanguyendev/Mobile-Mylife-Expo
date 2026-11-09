import type { TextStyle, ViewStyle } from 'react-native';

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  huge: 48,
} as const;

export const radius = {
  input: 15,
  small: 16,
  card: 20,
  largeCard: 24,
  hero: 30,
  sheet: 30,
  pill: 999,
} as const;

export const layout = {
  contentMaxWidth: 620,
  screenGutter: 22,
  minimumTouchTarget: 48,
} as const;

export const motion = {
  fast: 170,
  normal: 250,
  slow: 360,
} as const;

export const typography: Record<string, TextStyle> = {
  display: { fontSize: 34, lineHeight: 40, fontWeight: '700', letterSpacing: -1.2 },
  screenTitle: { fontSize: 30, lineHeight: 36, fontWeight: '700', letterSpacing: -0.7 },
  sectionTitle: { fontSize: 20, lineHeight: 27, fontWeight: '700', letterSpacing: -0.25 },
  cardTitle: { fontSize: 17, lineHeight: 23, fontWeight: '600' },
  body: { fontSize: 15, lineHeight: 23, fontWeight: '400' },
  bodyMedium: { fontSize: 15, lineHeight: 22, fontWeight: '600' },
  caption: { fontSize: 12, lineHeight: 17, fontWeight: '500' },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '600' },
  button: { fontSize: 15, lineHeight: 20, fontWeight: '600' },
};

export type AppColors = {
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceMuted: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  divider: string;
  accentFamily: string;
  accentTimeline: string;
  accentAnniversary: string;
  accentLibrary: string;
  accentMap: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  onAccent: string;
  onAccentMuted: string;
  accentDecoration: string;
  heroStamp: string;
  scrim: string;
  shadow: string;
};

export const palettes: Record<'light' | 'dark', AppColors> = {
  light: {
    background: '#F6F4EF',
    surface: '#FFFEFB',
    surfaceElevated: '#FFFFFF',
    surfaceMuted: '#EEECE5',
    textPrimary: '#242722',
    textSecondary: '#666B63',
    textTertiary: '#8C9088',
    border: '#E3E1D9',
    divider: '#ECEAE3',
    accentFamily: '#60745E',
    accentTimeline: '#3F7773',
    accentAnniversary: '#B77A36',
    accentLibrary: '#78647F',
    accentMap: '#4D8790',
    success: '#3D785A',
    warning: '#A9742C',
    error: '#B7544C',
    info: '#4C768E',
    onAccent: '#FFFFFF',
    onAccentMuted: '#E6EADF',
    accentDecoration: '#FFFFFF26',
    heroStamp: '#F3F0E5',
    scrim: '#00000066',
    shadow: '#2E3228',
  },
  dark: {
    background: '#191B18',
    surface: '#222521',
    surfaceElevated: '#2B2E29',
    surfaceMuted: '#30332E',
    textPrimary: '#F2F0E8',
    textSecondary: '#B8BBB2',
    textTertiary: '#92968D',
    border: '#3B3F38',
    divider: '#343831',
    accentFamily: '#A7B99E',
    accentTimeline: '#89B9B2',
    accentAnniversary: '#D6A86D',
    accentLibrary: '#B5A0BC',
    accentMap: '#91C2C8',
    success: '#91C5A2',
    warning: '#E1B875',
    error: '#E39A92',
    info: '#9CC3D7',
    onAccent: '#1B211A',
    onAccentMuted: '#E4E9DF',
    accentDecoration: '#FFFFFF26',
    heroStamp: '#30372D',
    scrim: '#00000099',
    shadow: '#000000',
  },
};

export const moduleAccents = {
  family: 'accentFamily',
  timeline: 'accentTimeline',
  anniversary: 'accentAnniversary',
  library: 'accentLibrary',
  map: 'accentMap',
} as const satisfies Record<string, keyof AppColors>;

export const shadows: Record<'card' | 'raised', ViewStyle> = {
  card: {
    shadowColor: palettes.light.shadow,
    shadowOpacity: 0.035,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  raised: {
    shadowColor: palettes.light.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
};
