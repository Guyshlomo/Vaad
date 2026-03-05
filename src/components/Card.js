import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, radius, shadow, spacing } from '../theme/tokens';

export default function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.72)',
    borderRadius: radius.card,
    padding: spacing.base,
    ...shadow.card,
  },
});
