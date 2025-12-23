import React from 'react';
import { TouchableOpacity, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Typography } from './Typography';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({ 
  title, 
  onPress, 
  variant = 'primary', 
  loading = false, 
  disabled = false,
  style 
}) => {
  const { theme } = useTheme();

  const getBackgroundColor = () => {
    if (disabled) return theme.border;
    if (variant === 'primary') return theme.primary;
    if (variant === 'secondary') return theme.secondary;
    return 'transparent';
  };

  const getTextColor = () => {
    if (disabled) return theme.textSecondary;
    if (variant === 'primary' || variant === 'secondary') return '#FFFFFF';
    if (variant === 'outline') return theme.primary;
    return theme.text;
  };

  const getBorder = (): ViewStyle => {
    if (variant === 'outline') return { borderWidth: 1, borderColor: theme.primary };
    return {};
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.container,
        { backgroundColor: getBackgroundColor() },
        getBorder(),
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <Typography 
          variant="label" 
          weight="bold" 
          color={getTextColor()}
          style={{ textAlign: 'center' }}
        >
          {title}
        </Typography>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginVertical: 8,
  },
});

