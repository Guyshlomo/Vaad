import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../theme/tokens';

export default function ChipGroup({ options, selected, onSelect }) {
  return (
    <View style={styles.container}>
      {options.map((opt) => {
        const isActive = selected === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[styles.chip, isActive && styles.chipActive]}
            onPress={() => onSelect(opt.value)}
            activeOpacity={0.7}
          >
            {opt.icon && (
              <MaterialCommunityIcons
                name={opt.icon}
                size={18}
                color={isActive ? colors.white : colors.secondary}
                style={styles.icon}
              />
            )}
            <Text style={[styles.text, isActive && styles.textActive]}>{opt.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.chip,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    backgroundColor: colors.surface,
  },
  chipActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  icon: {
    marginEnd: spacing.xs,
  },
  text: {
    fontFamily: typography.fontFamily,
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  textActive: {
    color: colors.white,
  },
});
