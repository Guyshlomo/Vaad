import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../theme/tokens';

export default function SecondaryButton({ title, onPress, style }) {
  return (
    <TouchableOpacity style={[styles.button, style]} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1.5,
    borderColor: colors.secondary,
    borderRadius: radius.button,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    minHeight: 48,
  },
  text: {
    fontFamily: typography.fontFamily,
    fontSize: 16,
    fontWeight: '600',
    color: colors.secondary,
  },
});
