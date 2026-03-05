import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../theme/tokens';

export default function NetworkBanner({ visible }) {
  if (!visible) return null;
  return (
    <View style={styles.banner}>
      <MaterialCommunityIcons name="wifi-off" size={18} color={colors.white} />
      <Text style={styles.text}>אין חיבור לאינטרנט</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.statusOpen,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  text: {
    fontFamily: typography.fontFamily,
    fontSize: 13,
    color: colors.white,
    fontWeight: '500',
  },
});
