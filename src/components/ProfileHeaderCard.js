import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Card from './Card';
import { colors, spacing, typography } from '../theme/tokens';

export default function ProfileHeaderCard({ profile, onEdit }) {
  const initials = profile?.full_name?.charAt(0) || '?';

  return (
    <Card style={styles.card}>
      <TouchableOpacity style={styles.editBtn} onPress={onEdit}>
        <MaterialCommunityIcons name="pencil" size={20} color={colors.secondary} />
      </TouchableOpacity>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <Text style={styles.name}>{profile?.full_name}</Text>
      <Text style={styles.info}>
        קומה {profile?.floor} • דירה {profile?.apartment}
      </Text>
      <Text style={styles.email}>{profile?.email}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginHorizontal: spacing.base,
    marginTop: spacing.base,
  },
  editBtn: {
    position: 'absolute',
    top: spacing.base,
    left: spacing.base,
    padding: spacing.xs,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 28,
  },
  name: {
    fontFamily: typography.fontFamily,
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  info: {
    fontFamily: typography.fontFamily,
    ...typography.body,
    color: colors.muted,
    marginBottom: spacing.xs,
  },
  email: {
    fontFamily: typography.fontFamily,
    ...typography.caption,
    color: colors.muted,
  },
});
