import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../theme/tokens';

export default function OnboardingSlide({ icon, title, description }) {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name={icon} size={80} color={colors.secondary} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  title: {
    fontFamily: typography.fontFamily,
    ...typography.h1,
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  description: {
    fontFamily: typography.fontFamily,
    ...typography.body,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
});
