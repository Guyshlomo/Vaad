import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Card from '../../components/Card';
import TextInputField from '../../components/TextInputField';
import PrimaryButton from '../../components/PrimaryButton';
import TextButton from '../../components/TextButton';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, typography } from '../../theme/tokens';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin() {
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('יש למלא את כל השדות');
      return;
    }
    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (e) {
      if (e.message?.includes('Invalid login')) {
        setError('אימייל או סיסמה שגויים');
      } else {
        setError('שגיאה בהתחברות, נסה שוב');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inner}
      >
        <View style={styles.logoSection}>
          <MaterialCommunityIcons name="office-building" size={48} color={colors.secondary} />
          <Text style={styles.brand}>Vaad</Text>
        </View>

        <Card style={styles.card}>
          <TextInputField
            label="אימייל"
            labelTextAlign="left"
            placeholder="email@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            textContentType="emailAddress"
          />
          <TextInputField
            label="סיסמה"
            labelTextAlign="left"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            textContentType="password"
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
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <PrimaryButton
            title="התחברות"
            onPress={handleLogin}
            loading={loading}
            style={styles.btn}
          />
        </Card>

        <View style={styles.registerRow}>
          <Text style={styles.registerText}>אין לך חשבון? </Text>
          <TextButton
            title="הירשם עכשיו"
            onPress={() => router.push('/(auth)/register')}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  brand: {
    fontFamily: typography.fontFamily,
    fontSize: 32,
    fontWeight: '700',
    color: colors.secondary,
    marginTop: spacing.sm,
  },
  card: {
    padding: spacing.xl,
    
  },
  error: {
    fontFamily: typography.fontFamily,
    fontSize: 14,
    color: colors.statusOpen,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  btn: {
    marginTop: spacing.sm,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
    gap: spacing.xs,
  },
  registerText: {
    fontFamily: typography.fontFamily,
    fontSize: 15,
    color: colors.muted,
  },
});
