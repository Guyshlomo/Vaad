import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../theme/tokens';

export default function SettingsRowToggle({ label, value, onValueChange }) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor={colors.white}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: {
    fontFamily: typography.fontFamily,
    fontSize: 15,
    color: colors.text,
  },
});
