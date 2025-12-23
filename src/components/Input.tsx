import React from 'react';
import { TextInput, View, StyleSheet, TextInputProps } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Typography } from './Typography';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, style, ...props }) => {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      {label && <Typography variant="label" style={{ marginBottom: 8 }}>{label}</Typography>}
      <TextInput
        style={[
          styles.input,
          { 
            backgroundColor: theme.surface, 
            borderColor: error ? theme.error : theme.border,
            color: theme.text 
          },
          style
        ]}
        placeholderTextColor={theme.textSecondary}
        {...props}
      />
      {error && <Typography variant="caption" color={theme.error} style={{ marginTop: 4 }}>{error}</Typography>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    writingDirection: 'rtl', // Ensure RTL input
    textAlign: 'right', // Default to right for Hebrew
  },
});

