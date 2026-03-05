import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { radius, spacing, typography, statusMap } from '../theme/tokens';

export default function StatusChip({ status }) {
  const info = statusMap[status] || statusMap.open;
  return (
    <View style={[styles.chip, { backgroundColor: info.bg }]}>
      <Text style={[styles.text, { color: info.color }]}>{info.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: radius.chip,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: typography.fontFamily,
    fontSize: 12,
    fontWeight: '600',
  },
});
