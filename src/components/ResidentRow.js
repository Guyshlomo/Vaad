import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../theme/tokens';

export default function ResidentRow({ name, apartment, isAdmin, avatarLabel }) {
  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{avatarLabel || name?.charAt(0)}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.apartment}>דירה {apartment}</Text>
      </View>
      {isAdmin && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>ועד</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginEnd: spacing.md,
  },
  avatarText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
  info: {
    flex: 1,
  },
  name: {
    fontFamily: typography.fontFamily,
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
    textAlign: 'right',
  },
  apartment: {
    fontFamily: typography.fontFamily,
    fontSize: 13,
    color: colors.muted,
    textAlign: 'right',
  },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginStart: spacing.sm,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
  },
});
