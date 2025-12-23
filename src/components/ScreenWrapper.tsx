import React from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, StatusBar as RNStatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { StatusBar } from 'expo-status-bar';

interface ScreenWrapperProps {
  children: React.ReactNode;
  withScrollView?: boolean;
  style?: any;
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({ children, style }) => {
  const { theme, themeType } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }, style]} edges={['top', 'left', 'right']}>
      <StatusBar style={themeType === 'dark' ? 'light' : 'dark'} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        {children}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

