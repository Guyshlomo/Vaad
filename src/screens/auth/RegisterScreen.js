import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import TextInputField from '../../components/TextInputField';
import PrimaryButton from '../../components/PrimaryButton';
import TextButton from '../../components/TextButton';
import { useAuth } from '../../context/AuthContext';
import { getRegisterErrors } from '../../utils/validation';
import { colors, spacing, typography } from '../../theme/tokens';

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    floor: '',
    apartment: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  async function handleRegister() {
    const validationErrors = getRegisterErrors(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setLoading(true);
    try {
      await signUp({
        email: form.email.trim(),
        password: form.password,
        full_name: form.full_name.trim(),
        floor: form.floor,
        apartment: form.apartment,
      });
    } catch (e) {
      const msg = (e.message || '').toLowerCase();
      if (msg.includes('already registered')) {
        setErrors({ email: 'כבר קיים חשבון עם האימייל הזה' });
      } else if (e.message === 'EMAIL_CONFIRMATION_REQUIRED') {
        Alert.alert(
          'אישור אימייל נדרש',
          'נשלח אליך מייל לאישור החשבון. לאחר האישור התחבר/י מהמסך הבא.',
          [
            {
              text: 'מעבר להתחברות',
              onPress: () => router.replace('/(auth)/login'),
            },
          ]
        );
      } else if (
        msg.includes('rate limit') ||
        msg.includes('over_email_send_rate_limit') ||
        msg.includes('security purposes')
      ) {
        Alert.alert('יותר מדי ניסיונות', 'שלחת יותר מדי בקשות אימות בפרק זמן קצר. נסה שוב בעוד דקה.');
      } else {
        Alert.alert('שגיאה', 'לא הצלחנו ליצור חשבון, נסה שוב');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>הרשמה</Text>

          <TextInputField
            label="שם מלא"
            labelTextAlign="left"
            placeholder="הכנס שם מלא"
            value={form.full_name}
            onChangeText={(v) => update('full_name', v)}
            error={errors.full_name}
          />
          <TextInputField
            label="אימייל"
            labelTextAlign="left"
            placeholder="email@example.com"
            value={form.email}
            onChangeText={(v) => update('email', v)}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />

          <View style={styles.row}>
            <TextInputField
              label="קומה"
              labelTextAlign="left"
              placeholder="3"
              value={form.floor}
              onChangeText={(v) => update('floor', v)}
              keyboardType="number-pad"
              error={errors.floor}
              style={styles.halfField}
            />
            <TextInputField
              label="דירה"
              labelTextAlign="left"
              placeholder="12"
              value={form.apartment}
              onChangeText={(v) => update('apartment', v)}
              keyboardType="number-pad"
              error={errors.apartment}
              style={styles.halfField}
            />
          </View>

          <TextInputField
            label="סיסמה"
            labelTextAlign="left"
            placeholder="לפחות 8 תווים"
            value={form.password}
            onChangeText={(v) => update('password', v)}
            secureTextEntry={!showPassword}
            error={errors.password}
            accessory={
              <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)}>
                <MaterialCommunityIcons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.muted}
                />
              </TouchableOpacity>
            }
          />
          <TextInputField
            label="אימות סיסמה"
            labelTextAlign="left"
            placeholder="אמת את הסיסמה"
            value={form.confirmPassword}
            onChangeText={(v) => update('confirmPassword', v)}
            secureTextEntry={!showConfirmPassword}
            error={errors.confirmPassword}
            accessory={
              <TouchableOpacity onPress={() => setShowConfirmPassword((prev) => !prev)}>
                <MaterialCommunityIcons
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.muted}
                />
              </TouchableOpacity>
            }
          />
          <PrimaryButton
            title="צור חשבון"
            onPress={handleRegister}
            loading={loading}
            style={styles.btn}
          />

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>כבר יש לך חשבון? </Text>
            <TextButton title="התחבר" onPress={() => router.back()} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },
  title: {
    fontFamily: typography.fontFamily,
    ...typography.h1,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfField: {
    flex: 1,
  },
  btn: {
    marginTop: spacing.md,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
    gap: spacing.xs,
  },
  loginText: {
    fontFamily: typography.fontFamily,
    fontSize: 15,
    color: colors.muted,
  },
});
