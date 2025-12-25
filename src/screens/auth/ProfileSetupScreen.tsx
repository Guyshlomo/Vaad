import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Switch, TouchableOpacity } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Typography } from '../../components/Typography';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../../utils/storageKeys';
import { AUTH_MODE } from '../../lib/config';
import { ArrowLeft } from 'lucide-react-native';

export const ProfileSetupScreen = () => {
  const { theme } = useTheme();
  const { user } = useAuth(); 
  const [floor, setFloor] = useState('');
  const [apartment, setApartment] = useState('');
  const [loading, setLoading] = useState(false);
  const [livesInBuilding, setLivesInBuilding] = useState<boolean>(true);
  
  // We need to fetch the invite details to get the building_id
  const [invite, setInvite] = useState<any>(null);

  useEffect(() => {
    fetchInvite();
  }, [user]);

  useEffect(() => {
    // Default committee flow: assume "yes" unless the user turns it off.
    if (invite?.role === 'committee') {
      setLivesInBuilding(true);
    }
  }, [invite?.role]);

  const fetchInvite = async () => {
    // Prefer locally stored invite (works with anonymous auth)
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.pendingInvite);
    if (stored) {
      try {
        setInvite(JSON.parse(stored));
        return;
      } catch {}
    }

    // Fallback: if user has a phone (phone auth mode), fetch from DB
    if (!user?.phone) return;
    const { data } = await supabase.rpc('check_is_invited', { phone_number: user.phone });
    if (data) setInvite(data);
  };

  const handleSave = async () => {
    if (!invite || !user) return;
    setLoading(true);

    try {
      // Complete profile via secure RPC (avoids RLS issues on units/profiles during setup)
      const isCommittee = invite?.role === 'committee';
      const effectiveLivesInBuilding = isCommittee ? livesInBuilding : true;

      const rpcArgs: any = {
        phone_number: invite.phone || user.phone,
        floor_text: floor,
        apartment_text: apartment,
        lives_in_building: effectiveLivesInBuilding,
      };

      let { error } = await supabase.rpc('complete_profile', rpcArgs);

      // Backwards-compatible fallback if the DB function wasn't updated yet (no lives_in_building param).
      if (
        error &&
        (String(error.message || '').toLowerCase().includes('lives_in_building') ||
          String(error.message || '').toLowerCase().includes('complete_profile') ||
          String(error.message || '').toLowerCase().includes('could not find the function'))
      ) {
        const retry = await supabase.rpc('complete_profile', {
          phone_number: invite.phone || user.phone,
          floor_text: floor,
          apartment_text: apartment,
        });
        error = retry.error;

        // If committee chose "not living in building" and server RPC isn't updated, fall back to direct profile upsert.
        // This prevents blocking the user, but you should still apply the SQL update in Supabase for best security.
        if (error && effectiveLivesInBuilding === false) {
          // Re-validate invite server-side (security definer) to reduce risk of tampered local storage.
          const { data: freshInvite, error: freshInviteErr } = await supabase.rpc('check_is_invited', {
            phone_number: invite.phone || user.phone,
          });
          if (freshInviteErr || !freshInvite) throw new Error('לא ניתן לאמת הזמנה. נסה שוב.');

          const { error: profileErr } = await supabase.from('profiles').upsert(
            {
              id: user.id,
              phone: freshInvite.phone,
              full_name: freshInvite.name,
              building_id: freshInvite.building_id,
              unit_id: null,
              role: freshInvite.role,
            },
            { onConflict: 'id' }
          );
          if (profileErr) throw profileErr;

          const now = new Date().toISOString();
          await supabase.from('user_settings').upsert(
            { user_id: user.id, updated_at: now },
            { onConflict: 'user_id' }
          );

          // Clear pending invite once profile is created
          await AsyncStorage.removeItem(STORAGE_KEYS.pendingInvite);
          await AsyncStorage.setItem(STORAGE_KEYS.profileReadyUserId, user.id);
          try {
            await supabase.auth.refreshSession();
          } catch {}
          return;
        }
      }

      if (error) throw error;

      // Clear pending invite once profile is created
      await AsyncStorage.removeItem(STORAGE_KEYS.pendingInvite);
      await AsyncStorage.setItem(STORAGE_KEYS.profileReadyUserId, user.id);

      // Trigger RootNavigator to re-check profile existence by forcing an auth session refresh.
      // RootNavigator's profile check currently runs when `session` changes.
      try {
        await supabase.auth.refreshSession();
      } catch {
        // Even if refresh fails, profile is created; user can reload the app.
      }

      // Navigation is handled by AuthContext state change logic in RootNavigator 
      // (once profile is set, user is "ready")
      
    } catch (error: any) {
      const msg = String(error?.message || '');
      if (msg.includes('profiles_phone_key')) {
        Alert.alert(
          'שגיאה',
          'המספר הזה כבר משויך לפרופיל קיים במערכת.\n\nזה קורה בדרך כלל כשעובדים במצב התחברות אנונימי (anonymous) ומבצעים התנתקות/התחברות – נוצרת זהות משתמש חדשה, אבל הטלפון חייב להיות ייחודי בטבלת profiles.\n\nפתרון מומלץ: לעבור להתחברות טלפון (OTP) כדי שהמשתמש יישאר אותו משתמש.\nפתרון מהיר לבדיקה: למחוק את הרשומה הקיימת של הטלפון הזה בטבלת profiles בסופאבייס ואז לנסות שוב.'
        );
      } else {
        Alert.alert('שגיאה', msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = async () => {
    Alert.alert('חזרה להתחברות', 'האם לחזור למסך ההתחברות?', [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'חזור',
        style: 'destructive',
        onPress: async () => {
          try {
            await AsyncStorage.removeItem(STORAGE_KEYS.pendingInvite);
            await AsyncStorage.removeItem(STORAGE_KEYS.profileReadyUserId);
          } catch {}
          await supabase.auth.signOut();
        },
      },
    ]);
  };

  return (
    <ScreenWrapper style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={handleBackToLogin}
          hitSlop={12}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="חזור להתחברות"
        >
          <ArrowLeft size={22} color={theme.text} />
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        <Typography variant="h1" align="center">השלמת פרופיל</Typography>
        {invite?.role === 'committee' ? (
          <>
            <Typography variant="body" align="center" style={{ marginBottom: 12 }}>
              ועד הבית לא בהכרח גר בבניין.
            </Typography>
            <Typography variant="body" align="center" style={{ marginBottom: 20 }}>
              האם אתה גר בבניין?
            </Typography>

            <View style={[styles.switchCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.switchRow}>
                {/* Left side (toggle) */}
                <Switch
                  value={livesInBuilding}
                  trackColor={{ false: theme.border, true: theme.primary }}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor={theme.border}
                  onValueChange={(v) => {
                    setLivesInBuilding(v);
                    if (!v) {
                      setFloor('');
                      setApartment('');
                    }
                  }}
                />

                {/* Right side (label) */}
                <View style={styles.switchLabelWrap}>
                  <Typography
                    variant="label"
                    style={{ marginBottom: 0 }}
                    color={livesInBuilding ? theme.primary : theme.textSecondary}
                  >
                    {livesInBuilding ? 'כן' : 'לא'}
                  </Typography>
                </View>
              </View>
            </View>
          </>
        ) : (
          <Typography variant="body" align="center" style={{ marginBottom: 32 }}>
            נא להזין את פרטי הדירה שלך
          </Typography>
        )}

        {(invite?.role !== 'committee' || livesInBuilding === true) && (
          <>
            <Input
              label="קומה"
              value={floor}
              onChangeText={setFloor}
              keyboardType="numeric"
            />
            
            <Input
              label="מספר דירה"
              value={apartment}
              onChangeText={setApartment}
              keyboardType="numeric"
            />
          </>
        )}

        <Button
          title="שמור והכנס"
          onPress={handleSave}
          loading={loading}
          disabled={
            !invite ||
            (invite?.role === 'committee'
              ? (livesInBuilding === true && (!floor || !apartment))
              : (!floor || !apartment))
          }
        />

        {/* Keep the bottom button for non-anonymous flows; header back is always available. */}
        {AUTH_MODE !== 'anonymous' && (
          <Button title="חזור להתחברות" onPress={handleBackToLogin} variant="ghost" disabled={loading} />
        )}
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
  },
  topBar: {
    height: 44,
    justifyContent: 'center',
  },
  backButton: {
    alignSelf: 'flex-start', // left side (as requested)
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  switchCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginBottom: 24,
  },
  switchRow: {
    // Right: label | Left: switch
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  switchLabelWrap: {
    flex: 1,
    alignItems: 'flex-end',
  },
  // pill removed: we show "כן / לא" labels on the sides of the switch instead
});

