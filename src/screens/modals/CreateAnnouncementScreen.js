import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import TextInputField from '../../components/TextInputField';
import PrimaryButton from '../../components/PrimaryButton';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { colors, spacing, typography } from '../../theme/tokens';

export default function CreateAnnouncementScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [pinned, setPinned] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handlePublish() {
    if (!title.trim()) {
      Alert.alert('שגיאה', 'יש להזין כותרת');
      return;
    }
    if (!body.trim()) {
      Alert.alert('שגיאה', 'יש להזין תוכן');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from('announcements').insert({
        building_id: profile.building_id,
        title: title.trim(),
        body: body.trim(),
        pinned,
        created_by: profile.id,
      });
      if (error) throw error;
      router.back();
    } catch {
      Alert.alert('שגיאה', 'לא הצלחנו לפרסם את ההודעה');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>הודעה חדשה</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.form}>
        <TextInputField
          label="כותרת"
          placeholder="כותרת ההודעה"
          value={title}
          onChangeText={setTitle}
        />
        <TextInputField
          label="תוכן"
          placeholder="כתוב את ההודעה..."
          value={body}
          onChangeText={setBody}
          multiline
        />

        <View style={styles.pinnedRow}>
          <Text style={styles.pinnedLabel}>נעיצה בראש הרשימה</Text>
          <Switch
            value={pinned}
            onValueChange={setPinned}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.white}
          />
        </View>

        <PrimaryButton
          title="פרסום"
          onPress={handlePublish}
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
    paddingTop: spacing.base,
  },
  pinnedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    marginBottom: spacing.base,
  },
  pinnedLabel: {
    fontFamily: typography.fontFamily,
    fontSize: 15,
    color: colors.text,
  },
  btn: {
    marginTop: spacing.md,
  },
});
