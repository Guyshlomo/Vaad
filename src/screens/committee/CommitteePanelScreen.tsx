import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Typography } from '../../components/Typography';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { useNavigation } from '@react-navigation/native';

export const CommitteePanelScreen = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation();
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInvite = async () => {
    if (!phone || !name) return;
    setLoading(true);

    try {
      // Get admin building
      const { data: adminProfile } = await supabase.from('profiles').select('building_id').eq('id', user?.id).single();
      if (!adminProfile) throw new Error('שגיאה בזיהוי');

      const { error } = await supabase.from('invited_residents').insert({
        building_id: adminProfile.building_id,
        phone: phone, // Assuming user inputs formatted or we format it. I should format it.
        name: name,
        role: 'resident',
      });

      if (error) throw error;

      Alert.alert('הוזמן', 'הדייר נוסף לרשימת המורשים');
      setPhone('');
      setName('');
    } catch (error: any) {
      Alert.alert('שגיאה', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper style={styles.container}>
      <View style={styles.header}>
        <Typography variant="h2">ניהול ועד</Typography>
        <Typography variant="body" color={theme.textSecondary}>הוספת דיירים למערכת</Typography>
      </View>

      <View style={styles.content}>
        <Input
          label="שם הדייר"
          value={name}
          onChangeText={setName}
        />
        <Input
          label="טלפון"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholder="050-1234567"
        />
        
        <Button
          title="הוסף דייר"
          onPress={handleInvite}
          loading={loading}
          disabled={!name || !phone}
        />

        <Button
          title="פרסם הודעה לדיירים"
          onPress={() => navigation.navigate('CommitteeAnnouncements' as never)}
          variant="outline"
          style={{ marginTop: 24 }}
        />
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
  },
  content: {
    padding: 24,
  },
});

