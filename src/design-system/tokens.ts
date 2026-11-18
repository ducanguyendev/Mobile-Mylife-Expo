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
  controlBorder: string;
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
    background: '#f6f4ee',
    surface: '#fffefa',
    surfaceElevated: '#ffffff',
    surfaceMuted: '#f9f8f3',
    textPrimary: '#29332d',
    textSecondary: '#626e65',
    textTertiary: '#686E64',
    border: '#E3E1D9',
    controlBorder: '#808A7A',
    divider: '#ECEAE3',
    accentFamily: '#526c59',
    accentTimeline: '#3f706c',
    accentAnniversary: '#8b621f',
    accentLibrary: '#715e7b',
    accentMap: '#3e7180',
    success: '#477657',
    warning: '#8b621f',
    error: '#ad4942',
    info: '#477276',
    onAccent: '#FFFFFF',
    onAccentMuted: '#F6F7F1',
    accentDecoration: '#FFFFFF26',
    heroStamp: '#F3F0E5',
    scrim: '#00000066',
    shadow: '#2E3228',
  },
  dark: {
    background: '#202823',
    surface: '#2c3730',
    surfaceElevated: '#414f45',
    surfaceMuted: '#344139',
    textPrimary: '#f2f0e8',
    textSecondary: '#c0c7bc',
    textTertiary: '#92968D',
    border: '#3B3F38',
    controlBorder: '#879581',
    divider: '#343831',
    accentFamily: '#a1b59f',
    accentTimeline: '#83b9b0',
    accentAnniversary: '#d6b06b',
    accentLibrary: '#c0a9c8',
    accentMap: '#8ebbc4',
    success: '#9cc2a1',
    warning: '#d6b06b',
    error: '#e29487',
    info: '#91b8bc',
    onAccent: '#1B211A',
    onAccentMuted: '#243020',
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
