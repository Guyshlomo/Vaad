export const colors = {
  light: {
    primary: '#2F80ED',
    secondary: '#56CCF2',
    background: '#F7F9FC',
    surface: '#FFFFFF',
    text: '#1F2937',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    error: '#EF4444',
    success: '#10B981',
    status: {
      open: '#F2994A',
      in_progress: '#F2C94C',
      resolved: '#27AE60',
    },
  },
  dark: {
    primary: '#2F80ED',
    secondary: '#56CCF2', // Might need adjustment for dark mode, but keeping as requested
    background: '#0F172A',
    surface: '#1E293B',
    text: '#E5E7EB',
    textSecondary: '#94A3B8',
    border: '#334155',
    error: '#EF4444',
    success: '#10B981',
    status: {
      open: '#F2994A',
      in_progress: '#F2C94C',
      resolved: '#27AE60',
    },
  },
};

export type Theme = typeof colors.light;

