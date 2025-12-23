import React from 'react';
import { View, StyleSheet, FlatList, Dimensions, Image } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Typography } from '../../components/Typography';
import { Button } from '../../components/Button';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types/navigation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../theme/ThemeContext';
import { STORAGE_KEYS } from '../../utils/storageKeys';

const { width } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    title: 'הבניין שלכם, מסודר',
    description: 'מדווחים תקלות, עוקבים אחר טיפול, ונשארים מעודכנים.',
  },
  {
    id: '2',
    title: 'דיווח קל ומהיר',
    description: 'בחרו סוג תקלה, הוסיפו תיאור ותמונה. כולם רואים סטטוס ועדכונים.',
  },
  {
    id: '3',
    title: 'קהילה חכמה',
    description: 'רשימת דיירים לפי קומה, זיהוי ועד הבית, והודעות רשמיות במקום וואטסאפ.',
  },
];

export const OnboardingScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const flatListRef = React.useRef<FlatList>(null);
  const { theme } = useTheme();

  const handleNext = async () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      await AsyncStorage.setItem(STORAGE_KEYS.onboardingSeen, 'true');
      navigation.replace('Login');
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      flatListRef.current?.scrollToIndex({ index: currentIndex - 1 });
      setCurrentIndex(currentIndex - 1);
    }
  };

  const renderItem = ({ item }: { item: typeof slides[0] }) => (
    <View style={[styles.slide, { width }]}>
      <Typography variant="h1" align="center" style={{ marginTop: 40 }}>{item.title}</Typography>
      <Typography variant="body" align="center" color={theme.textSecondary} style={{ paddingHorizontal: 40, marginTop: 10 }}>
        {item.description}
      </Typography>
    </View>
  );

  return (
    <ScreenWrapper style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        scrollEventThrottle={16}
        keyExtractor={(item) => item.id}
        style={{ flex: 1 }}
      />
      
      <View style={styles.footer}>
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                { backgroundColor: index === currentIndex ? theme.primary : theme.border },
              ]}
            />
          ))}
        </View>

        <View style={styles.buttons}>
          {currentIndex > 0 && (
            <Button 
              title="חזור" 
              onPress={handleBack} 
              variant="ghost" 
              style={{ flex: 1, marginRight: 8 }} 
            />
          )}
          <Button 
            title={currentIndex === slides.length - 1 ? 'להתחברות' : 'הבא'} 
            onPress={handleNext} 
            style={{ flex: 1, marginLeft: currentIndex > 0 ? 8 : 0 }} 
          />
        </View>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    padding: 24,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

