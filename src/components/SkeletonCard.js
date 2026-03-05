import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../theme/tokens';

export default function SkeletonCard() {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View style={[styles.card, { opacity }]}>
      <View style={styles.row}>
        <View style={styles.chip} />
        <View style={styles.title} />
      </View>
      <View style={styles.subtitle} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.base,
    marginBottom: spacing.sm,
    marginHorizontal: spacing.base,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  chip: {
    width: 50,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.border,
    marginEnd: spacing.sm,
  },
  title: {
    flex: 1,
    height: 18,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  subtitle: {
    width: '60%',
    height: 14,
    borderRadius: 4,
    backgroundColor: colors.border,
    alignSelf: 'flex-end',
  },
});
