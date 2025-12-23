import React, { useEffect } from 'react';
import { I18nManager } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/theme/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import { RootNavigator } from './src/navigation';
import { isSupabaseConfigured } from './src/lib/supabase';
import { MissingConfigScreen } from './src/screens/MissingConfigScreen';

export default function App() {
  useEffect(() => {
    // Help debug hard-to-locate native HostFunction type errors by printing stacks.
    // (Will still show the red screen, but logs will include the stack/cause.)
    const ErrorUtilsAny = global?.ErrorUtils;
    const prevHandler = ErrorUtilsAny && ErrorUtilsAny.getGlobalHandler ? ErrorUtilsAny.getGlobalHandler() : null;
    if (ErrorUtilsAny && ErrorUtilsAny.setGlobalHandler) {
      ErrorUtilsAny.setGlobalHandler((error, isFatal) => {
        try {
          // Make sure we see full details in Metro logs
          console.log('[GlobalError]', error?.message);
          if (error?.stack) console.log(error.stack);
        } catch {}
        if (prevHandler) prevHandler(error, isFatal);
      });
    }

    if (!I18nManager.isRTL) {
      I18nManager.allowRTL(true);
      I18nManager.forceRTL(true);
      // Updates.reloadAsync(); // In development this might loop if not careful. 
      // For MVP, assume user restarts or it applies on next load.
    }
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        {isSupabaseConfigured ? (
          <AuthProvider>
            <RootNavigator />
          </AuthProvider>
        ) : (
          <MissingConfigScreen />
        )}
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
