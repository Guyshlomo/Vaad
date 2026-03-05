import { Platform } from 'react-native';

export const colors = {
  primary: '#FFD400',
  secondary: '#1F4C8F',
  background: '#F6F8FB',
  surface: '#FFFFFF',
  text: '#1A1A1A',
  muted: '#6B7280',
  border: '#E5E7EB',

  statusOpen: '#FF6B6B',
  statusInProgress: '#FFA94D',
  statusDone: '#4CAF50',

  danger: '#EF4444',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0,0,0,0.4)',
};

export const typography = {
  fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  h1: { fontSize: 26, fontWeight: '600' },
  h2: { fontSize: 19, fontWeight: '600' },
  body: { fontSize: 15, fontWeight: '400' },
  caption: { fontSize: 13, fontWeight: '400' },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
};

export const radius = {
  card: 16,
  input: 12,
  chip: 999,
  button: 12,
};

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
};

export const statusMap = {
  open: { label: 'נפתחה', color: colors.statusOpen, bg: '#FFF0F0' },
  in_progress: { label: 'בטיפול', color: colors.statusInProgress, bg: '#FFF8EE' },
  done: { label: 'טופלה', color: colors.statusDone, bg: '#EEFBEE' },
};

export const issueTypeMap = {
  elevator: { label: 'מעלית', icon: 'elevator-passenger' },
  electricity: { label: 'חשמל', icon: 'flash' },
  water: { label: 'מים', icon: 'water' },
  cleaning: { label: 'ניקיון', icon: 'broom' },
  other: { label: 'אחר', icon: 'dots-horizontal' },
};

export const locationMap = {
  lobby: 'לובי',
  floor: 'קומה',
  parking: 'חניה',
  roof: 'גג',
};
