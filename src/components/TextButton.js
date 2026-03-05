import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, typography } from '../theme/tokens';

export default function TextButton({ title, onPress, color, style }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.6} style={style}>
      <Text style={[styles.text, color && { color }]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  text: {
    fontFamily: typography.fontFamily,
    fontSize: 15,
    fontWeight: '500',
    color: colors.secondary,
  },
});
