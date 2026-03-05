import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../theme/tokens';

export default function SearchBar({ value, onChangeText, placeholder }) {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name="magnify" size={20} color={colors.muted} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || 'חיפוש...'}
        placeholderTextColor={colors.muted}
        textAlign="right"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.base,
    marginBottom: spacing.base,
    minHeight: 44,
  },
  input: {
    flex: 1,
    fontFamily: typography.fontFamily,
    fontSize: 15,
    color: colors.text,
    marginStart: spacing.sm,
    paddingVertical: spacing.sm,
    writingDirection: 'rtl',
  },
});
