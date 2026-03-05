import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../theme/tokens';

export default function TextInputField({
  label,
  error,
  style,
  inputStyle,
  multiline,
  labelTextAlign = 'right',
  accessory,
  ...props
}) {
  return (
    <View style={[styles.container, style]}>
      {label && <Text style={[styles.label, { textAlign: labelTextAlign }]}>{label}</Text>}
      <View style={[styles.inputContainer, error && styles.inputError]}>
        <TextInput
          style={[
            styles.input,
            multiline && styles.multiline,
            inputStyle,
          ]}
          placeholderTextColor={colors.muted}
          textAlign="right"
          multiline={multiline}
          {...props}
        />
        {accessory ? <View style={styles.accessory}>{accessory}</View> : null}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.base,
  },
  label: {
    fontFamily: typography.fontFamily,
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: 'right',
  },
  inputContainer: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: spacing.base,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    paddingVertical: spacing.md,
    fontSize: 15,
    color: colors.text,
    fontFamily: typography.fontFamily,
    textAlign: 'right',
    writingDirection: 'rtl',
    flex: 1,
  },
  multiline: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: spacing.md,
  },
  inputError: {
    borderColor: colors.statusOpen,
  },
  error: {
    fontFamily: typography.fontFamily,
    fontSize: 13,
    color: colors.statusOpen,
    marginTop: spacing.xs,
    textAlign: 'right',
  },
  accessory: {
    marginStart: spacing.sm,
  },
});
