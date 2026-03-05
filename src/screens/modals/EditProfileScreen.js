import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import TextInputField from '../../components/TextInputField';
import PrimaryButton from '../../components/PrimaryButton';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, typography } from '../../theme/tokens';

export default function EditProfileScreen() {
  const router = useRouter();
  const { profile, updateProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [floor, setFloor] = useState(String(profile?.floor || ''));
  const [apartment, setApartment] = useState(String(profile?.apartment || ''));
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    if (!fullName.trim()) {
      Alert.alert('שגיאה', 'חובה להזין שם מלא');
      return;
    }
    setLoading(true);
    try {
      await updateProfile({
        full_name: fullName.trim(),
        floor: parseInt(floor, 10) || profile.floor,
        apartment: parseInt(apartment, 10) || profile.apartment,
      });
      router.back();
    } catch {
      Alert.alert('שגיאה', 'לא הצלחנו לעדכן את הפרופיל');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-right" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>עריכת פרופיל</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.form}>
        <TextInputField
          label="שם מלא"
          value={fullName}
          onChangeText={setFullName}
        />
        <View style={styles.row}>
          <TextInputField
            label="קומה"
            value={floor}
            onChangeText={setFloor}
            keyboardType="number-pad"
            style={styles.halfField}
          />
          <TextInputField
            label="דירה"
            value={apartment}
            onChangeText={setApartment}
            keyboardType="number-pad"
            style={styles.halfField}
          />
        </View>

        <PrimaryButton
          title="שמירה"
          onPress={handleSave}
          loading={loading}
          style={styles.btn}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontFamily: typography.fontFamily,
    ...typography.h2,
    color: colors.text,
  },
  form: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfField: {
    flex: 1,
  },
  btn: {
    marginTop: spacing.xl,
  },
});
