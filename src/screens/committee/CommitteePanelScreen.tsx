import React, { useState } from 'react';
import { View, StyleSheet, Alert, Switch } from 'react-native';
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
  const [inviteRole, setInviteRole] = useState<'resident' | 'committee'>('resident');
  const [sameBuildingForCommittee, setSameBuildingForCommittee] = useState(false);

  const formatPhone = (p: string) => {
    // Basic normalization for Israel (matches LoginScreen)
    let cleaned = p.replace(/\D/g, '');
    if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);
    if (!cleaned.startsWith('972')) cleaned = '972' + cleaned;
    return '+' + cleaned;
  };

  const handleInvite = async () => {
    if (!phone || !name) return;
    setLoading(true);

    try {
      // Get admin building
      const { data: adminProfile } = await supabase.from('profiles').select('building_id').eq('id', user?.id).single();
      if (!adminProfile) throw new Error('שגיאה בזיהוי');

      const normalizedPhone = formatPhone(phone);

      if (inviteRole === 'committee') {
        // Committee invite: by default new building_id, unless explicitly same building is chosen.
        if (sameBuildingForCommittee) {
          const { error } = await supabase.from('invited_residents').insert({
            building_id: adminProfile.building_id,
            phone: normalizedPhone,
            name,
            role: 'committee',
          });
          if (error) throw error;
        } else {
          const { data, error } = await supabase.rpc('invite_committee', {
            phone_number: normalizedPhone,
            full_name: name,
            same_building: false,
            building_name: 'בניין חדש',
          });
          if (error) throw error;
          if (!data) throw new Error('לא ניתן ליצור ועד בית חדש');
        }
      } else {
        const { error } = await supabase.from('invited_residents').insert({
          building_id: adminProfile.building_id,
          phone: normalizedPhone,
          name,
          role: 'resident',
        });
        if (error) throw error;
      }

      Alert.alert('הוזמן', `${inviteRole === 'committee' ? 'ועד בית' : 'דייר'} נוסף לרשימת המורשים\n(${normalizedPhone})`);
      setPhone('');
      setName('');
      setInviteRole('resident');
      setSameBuildingForCommittee(false);
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
        <View style={[styles.row, { borderBottomColor: theme.border }]}>
          <Typography variant="label">הרשאה</Typography>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Typography color={inviteRole === 'committee' ? theme.textSecondary : theme.primary} weight={inviteRole === 'resident' ? 'bold' : 'regular'}>
              דייר
            </Typography>
            <Switch
              value={inviteRole === 'committee'}
              onValueChange={(v) => {
                setInviteRole(v ? 'committee' : 'resident');
                if (!v) {
                  setSameBuildingForCommittee(false);
                }
              }}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor="#FFFFFF"
              ios_backgroundColor={theme.border}
            />
            <Typography color={inviteRole === 'committee' ? theme.primary : theme.textSecondary} weight={inviteRole === 'committee' ? 'bold' : 'regular'}>
              ועד בית
            </Typography>
          </View>
        </View>

        {inviteRole === 'committee' && (
          <>
     

            {/* Removed "new building name" input as requested */}
          </>
        )}

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
          title={inviteRole === 'committee' ? 'הוסף ועד בית' : 'הוסף דייר'}
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
  row: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
});

