import React, { useState, useRef, useCallback } from 'react';
import { View, FlatList, Dimensions, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import OnboardingSlide from '../../components/OnboardingSlide';
import PrimaryButton from '../../components/PrimaryButton';
import TextButton from '../../components/TextButton';
import { colors, spacing } from '../../theme/tokens';

const { width } = Dimensions.get('window');

const slides = [
  {
    id: '3',
    icon: 'bell-ring-outline',
    title: 'עדכונים בזמן אמת',
    description: 'קבלו התראות על שינוי סטטוס, הודעות מהוועד ועוד.',
  },
  {
    id: '2',
    icon: 'tools',
    title: 'דיווח תקלות בקלות',
    description: 'תקלה במעלית? בעיית מים? דווחו בלחיצה אחת והוועד יטפל.',
  },
  {
    id: '1',
    icon: 'office-building',
    title: 'ברוכים הבאים ל־Vaad',
    description: 'הבניין שלכם, מסודר. דווחו תקלות, עקבו אחרי טיפול, וקבלו עדכונים מהוועד.',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;
  const bounceAnim = useRef(new Animated.Value(1)).current;

  const isLast = currentIndex === slides.length - 1;
  const activeDotIndex = slides.length - 1 - currentIndex;

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }, []);

  function goToLogin() {
    Animated.sequence([
      Animated.timing(bounceAnim, { toValue: 0.88, duration: 100, useNativeDriver: true }),
      Animated.spring(bounceAnim, { toValue: 1.05, friction: 3, tension: 200, useNativeDriver: true }),
      Animated.timing(bounceAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start(() => {
      router.replace('/(auth)/login');
    });
  }

  function handleNext() {
    if (isLast) {
      goToLogin();
    } else {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    }
  }

  function handleSkip() {
    router.replace('/(auth)/login');
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.skipRow}>
        {!isLast && <TextButton title="דלג" onPress={handleSkip} />}
      </View>

      <FlatList
        ref={flatListRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ width }}>
            <OnboardingSlide icon={item.icon} title={item.title} description={item.description} />
          </View>
        )}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
      />

      <View style={styles.dots}>
        {slides.map((_, i) => (
          <View key={i} style={[styles.dot, activeDotIndex === i && styles.dotActive]} />
        ))}
      </View>

      <Animated.View style={[styles.buttonRow, { transform: [{ scale: bounceAnim }] }]}>
        <PrimaryButton
          title={isLast ? 'להתחברות' : 'הבא'}
          onPress={handleNext}
          style={styles.button}
        />
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  skipRow: {
    alignItems: 'flex-start',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    minHeight: 40,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.secondary,
    width: 24,
  },
  buttonRow: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  button: {
    width: '100%',
  },
});
