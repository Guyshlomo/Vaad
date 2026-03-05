import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../theme/tokens';

export default function SectionHeader({ title, actionLabel, onAction }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {actionLabel && (
        <TouchableOpacity onPress={onAction}>
          <Text style={styles.action}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  title: {
    fontFamily: typography.fontFamily,
    ...typography.h2,
    color: colors.text,
    textAlign: 'right',
  },
  action: {
    fontFamily: typography.fontFamily,
    fontSize: 14,
    color: colors.secondary,
    fontWeight: '500',
  },
});
