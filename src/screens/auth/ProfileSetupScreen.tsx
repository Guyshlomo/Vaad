import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Typography } from '../../components/Typography';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../../utils/storageKeys';

export const ProfileSetupScreen = () => {
  const { user } = useAuth(); 
  const [floor, setFloor] = useState('');
  const [apartment, setApartment] = useState('');
  const [loading, setLoading] = useState(false);
  
  // We need to fetch the invite details to get the building_id
  const [invite, setInvite] = useState<any>(null);

  useEffect(() => {
    fetchInvite();
  }, [user]);

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
      const { data: _profile, error } = await supabase.rpc('complete_profile', {
        phone_number: invite.phone || user.phone,
        floor_text: floor,
        apartment_text: apartment,
      });

      if (error) throw error;

      // Clear pending invite once profile is created
      await AsyncStorage.removeItem(STORAGE_KEYS.pendingInvite);

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
      Alert.alert('שגיאה', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper style={styles.container}>
      <View style={styles.content}>
        <Typography variant="h1" align="center">השלמת פרופיל</Typography>
        <Typography variant="body" align="center" style={{ marginBottom: 32 }}>
          נא להזין את פרטי הדירה שלך
        </Typography>

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

        <Button
          title="שמור והכנס"
          onPress={handleSave}
          loading={loading}
          disabled={!floor || !apartment || !invite}
        />
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

