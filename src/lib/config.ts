export type AuthMode = 'phone' | 'anonymous';

// Default: phone auth (OTP). For now you asked to disable it, so set
// EXPO_PUBLIC_AUTH_MODE=anonymous in `.env`.
export const AUTH_MODE: AuthMode =
  (process.env.EXPO_PUBLIC_AUTH_MODE as AuthMode) || 'phone';


