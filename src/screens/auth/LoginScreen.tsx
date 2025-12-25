import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Typography } from '../../components/Typography';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { supabase } from '../../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../../utils/storageKeys';
import { AUTH_MODE } from '../../lib/config';

export const LoginScreen = () => {
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState(''); // Used if we want to pre-fill profile later
  const [pin, setPin] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);

  const formatPhone = (p: string) => {
    // Basic normalization for Israel
    let cleaned = p.replace(/\D/g, '');
    if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);
    if (!cleaned.startsWith('972')) cleaned = '972' + cleaned;
    return '+' + cleaned;
  };

  const emailFromPhone = (formattedPhone: string) => {
    // Temporary MVP: represent phone login as an internal email for Supabase email/password auth.
    // Example: +9725... -> u_9725...@vaad.local
    const digits = formattedPhone.replace('+', '');
    return `u_${digits}@vaad.local`;
  };

  const checkInviteAndLogin = async () => {
    if (!phone) return;
    setLoading(true);

    try {
      const formattedPhone = formatPhone(phone);
      
      // Check invitation
      const { data: invite, error: inviteError } = await supabase
        .rpc('check_is_invited', { phone_number: formattedPhone });

      if (inviteError) {
        throw inviteError;
      }

      if (!invite) {
        Alert.alert(
          'לא נמצא בבניין',
          'נראה שהוועד עדיין לא הוסיף את המספר שלך. בקשי מהוועד להוסיף אותך, ואז נסי שוב.',
          [{ text: 'נסה שוב' }]
        );
        setLoading(false);
        return;
      }

      // Store invite locally for the next step (works even in anonymous auth)
      await AsyncStorage.setItem(
        STORAGE_KEYS.pendingInvite,
        JSON.stringify({
          phone: formattedPhone,
          name: invite.name,
          role: invite.role,
          building_id: invite.building_id,
        })
      );

      if (AUTH_MODE === 'pin') {
        if (!pin || pin.length < 4) {
          Alert.alert('שגיאה', 'אנא הזן קוד PIN (לפחות 4 ספרות)');
          return;
        }

        const email = emailFromPhone(formattedPhone);

        // 1) Try sign-in
        let { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: pin,
        });

        // 2) If user doesn't exist yet, create it (temporary MVP).
        if (error) {
          const msg = String(error.message || '').toLowerCase();
          const invalidCreds =
            msg.includes('invalid login credentials') ||
            msg.includes('invalid') ||
            msg.includes('not found');

          if (invalidCreds) {
            const signUp = await supabase.auth.signUp({
              email,
              password: pin,
              options: {
                data: { phone: formattedPhone },
              },
            });

            if (signUp.error) throw signUp.error;

            // If email confirmations are enabled, session may be null. Tell the user what to change.
            if (!signUp.data.session) {
              Alert.alert(
                'נדרש שינוי בהגדרות Supabase',
                'מצב PIN יוצר משתמש Email פנימי. כדי שיתקבל Session מיד, יש לכבות אימות Email:\nSupabase → Authentication → Settings → Email confirmations = OFF\n\nלאחר מכן נסה שוב.'
              );
              return;
            }

            data = signUp.data;
            error = null;
          } else {
            throw error;
          }
        }

        if (error) throw error;
        return;
      }

      if (AUTH_MODE === 'anonymous') {
        // No SMS. Use anonymous auth (requires no phone provider).
        const { error } = await supabase.auth.signInAnonymously();
        if (error) {
          const msg = String(error.message || '');
          if (msg.toLowerCase().includes('anonymous') && msg.toLowerCase().includes('disabled')) {
            Alert.alert(
              'התחברות אנונימית לא פעילה',
              'כדי להתחבר בלי SMS צריך להפעיל ב־Supabase: Authentication → Settings → Enable anonymous sign-ins.\n\nקישור ישיר לפרויקט:\nhttps://supabase.com/dashboard/project/vszwtnclpxazeceytfic/settings/auth\n\nאחרי ההפעלה נסו שוב.'
            );
            return;
          }
          throw error;
        }
        // Navigation is handled by RootNavigator after session exists (no manual navigation here)
        return;
      }

      // Default: Phone OTP
      const { error } = await supabase.auth.signInWithOtp({ phone: formattedPhone });
      if (error) {
        const msg = String(error.message || '');
        if (msg.toLowerCase().includes('phone') || msg.toLowerCase().includes('provider')) {
          Alert.alert(
            'לא ניתן לשלוח SMS',
            'ב־Supabase של הפרויקט עדיין לא הופעל אימות טלפון/ספק SMS. פתחו Supabase → Authentication → Providers → Phone והפעילו ספק SMS (Twilio/Vonage וכו׳), ואז נסו שוב.'
          );
          return;
        }
        throw error;
      }
      setStep('otp');
    } catch (error: any) {
      Alert.alert('שגיאה', error.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp) return;
    setLoading(true);

    try {
      const formattedPhone = formatPhone(phone);
      const { error, data } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otp,
        type: 'sms',
      });

      if (error) {
        const msg = String(error.message || '');
        if (msg.toLowerCase().includes('phone') || msg.toLowerCase().includes('provider')) {
          Alert.alert(
            'אימות SMS לא זמין',
            'נראה שאימות טלפון לא מוגדר בפרויקט Supabase. הפעילו Phone Provider והגדירו ספק SMS, ואז נסו שוב.'
          );
          return;
        }
        throw error;
      }

      // Auth state change will handle navigation in RootNavigator, 
      // but we might need to check if profile exists to route to ProfileSetup
      // handled in navigation/index logic
    } catch (error: any) {
      Alert.alert('שגיאה בקוד', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper style={styles.container}>
      <View style={styles.content}>
        <Typography variant="h1" align="center">התחברות</Typography>

        {AUTH_MODE === 'anonymous' && (
          <Typography
            variant="body"
            align="center"
            style={{ marginTop: 8, marginBottom: 16 }}
          >
            שים לב: מצב התחברות אנונימי פעיל. במצב זה התנתקות/התחברות יכולה ליצור משתמש חדש ולכן תידרש השלמת פרופיל מחדש.
            מומלץ לעבור למצב התחברות טלפון (OTP) לפרודקשן.
          </Typography>
        )}

        {AUTH_MODE === 'pin' && (
          <Typography variant="body" align="center" style={{ marginTop: 8, marginBottom: 16 }}>
            מצב PIN זמני (MVP): התחברות עם מספר טלפון + PIN שהוועד נותן לך. לא מאובטח — בהמשך נעבור לאימות SMS.
          </Typography>
        )}
        
        {step === 'phone' ? (
          <>
            <Typography variant="body" align="center" style={{ marginBottom: 24 }}>
              {AUTH_MODE === 'pin'
                ? 'הזינו מספר טלפון וקוד PIN'
                : 'הזינו את מספר הטלפון והשם שלכם להתחברות'}
            </Typography>
            
            {AUTH_MODE !== 'pin' && (
              <Input
                label="שם מלא"
                value={fullName}
                onChangeText={setFullName}
                placeholder="ישראל ישראלי"
              />
            )}
            
            <Input
              label="מספר טלפון"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="050-1234567"
            />

            {AUTH_MODE === 'pin' && (
              <Input
                label="קוד PIN"
                value={pin}
                onChangeText={setPin}
                keyboardType="number-pad"
                placeholder="1234"
                secureTextEntry
              />
            )}

            <Button
              title={AUTH_MODE === 'pin' ? 'התחבר' : 'המשך'}
              onPress={checkInviteAndLogin}
              loading={loading}
              disabled={AUTH_MODE === 'pin' ? !phone || !pin : !phone || !fullName}
            />
          </>
        ) : (
          <>
            <Typography variant="body" align="center" style={{ marginBottom: 24 }}>
              שלחנו קוד אימות למספר {phone}
            </Typography>
            
            <Input
              label="קוד אימות"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              placeholder="123456"
            />

            <Button
              title="התחבר"
              onPress={verifyOtp}
              loading={loading}
              disabled={!otp}
            />
            
            <Button
              title="חזור"
              variant="ghost"
              onPress={() => setStep('phone')}
              disabled={loading}
            />
          </>
        )}
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
});

