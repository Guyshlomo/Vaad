import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import StatusChip from '../../components/StatusChip';
import TextInputField from '../../components/TextInputField';
import PrimaryButton from '../../components/PrimaryButton';
import Card from '../../components/Card';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { colors, spacing, typography, issueTypeMap, locationMap, statusMap } from '../../theme/tokens';
import { timeAgo } from '../../utils/timeAgo';

const STATUS_OPTIONS = ['open', 'in_progress', 'done'];

export default function IssueDetailsScreen() {
  const router = useRouter();
  const { issueId } = useLocalSearchParams();
  const { profile, isAdmin } = useAuth();
  const [issue, setIssue] = useState(null);
  const [creator, setCreator] = useState(null);
  const [newUpdate, setNewUpdate] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchIssue();
  }, []);

  async function fetchIssue() {
    const { data } = await supabase.from('issues').select('*').eq('id', issueId).single();
    if (data) {
      setIssue(data);
      const { data: userData } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', data.created_by)
        .single();
      if (userData) setCreator(userData);
    }
  }

  async function changeStatus(newStatus) {
    setSaving(true);
    const { error } = await supabase
      .from('issues')
      .update({ status: newStatus })
      .eq('id', issueId);
    if (error) {
      Alert.alert('שגיאה', 'הסטטוס עודכן בינתיים, מרענן...');
    }
    await fetchIssue();
    setSaving(false);
  }

  async function postUpdate() {
    if (!newUpdate.trim()) return;
    setSaving(true);
    const updates = [...(issue.updates || []), {
      text: newUpdate.trim(),
      time: new Date().toISOString(),
    }];
    const { error } = await supabase.from('issues').update({ updates }).eq('id', issueId);
    if (error) {
      Alert.alert('שגיאה', 'לא הצלחנו לפרסם עדכון');
    } else {
      setNewUpdate('');
      await fetchIssue();
    }
    setSaving(false);
  }

  if (!issue) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>טוען...</Text>
      </SafeAreaView>
    );
  }

  const typeInfo = issueTypeMap[issue.type] || issueTypeMap.other;
  const locationLabel = locationMap[issue.location] || issue.location;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-right" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>תקלה: {typeInfo.label}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.statusRow}>
          <StatusChip status={issue.status} />
        </View>

        <Text style={styles.meta}>
          {locationLabel} • דווח ע״י {creator?.full_name || '...'} • {timeAgo(issue.created_at)}
        </Text>

        <Text style={styles.sectionTitle}>תיאור</Text>
        <Card>
          <Text style={styles.description}>{issue.description}</Text>
        </Card>

        {issue.media_urls?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>תמונות</Text>
            <FlatList
              data={issue.media_urls}
              horizontal
              keyExtractor={(_, i) => String(i)}
              renderItem={({ item }) => (
                <Image source={{ uri: item }} style={styles.image} />
              )}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.images}
            />
          </>
        )}

        {(issue.updates?.length > 0) && (
          <>
            <Text style={styles.sectionTitle}>עדכונים מהוועד</Text>
            {issue.updates.map((upd, idx) => (
              <Card key={idx} style={styles.updateCard}>
                <Text style={styles.updateTime}>{timeAgo(upd.time)}</Text>
                <Text style={styles.updateText}>{upd.text}</Text>
              </Card>
            ))}
          </>
        )}

        {isAdmin && (
          <View style={styles.adminSection}>
            <Text style={styles.sectionTitle}>פעולות אדמין</Text>

            <Text style={styles.label}>שינוי סטטוס</Text>
            <View style={styles.statusButtons}>
              {STATUS_OPTIONS.map((s) => {
                const info = statusMap[s];
                const isActive = issue.status === s;
                return (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.statusBtn,
                      { borderColor: info.color },
                      isActive && { backgroundColor: info.color },
                    ]}
                    onPress={() => changeStatus(s)}
                    disabled={saving}
                  >
                    <Text
                      style={[
                        styles.statusBtnText,
                        { color: info.color },
                        isActive && { color: colors.white },
                      ]}
                    >
                      {info.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TextInputField
              label="עדכון חדש"
              placeholder="הוסף עדכון..."
              value={newUpdate}
              onChangeText={setNewUpdate}
              multiline
            />
            <PrimaryButton
              title="פרסם עדכון"
              onPress={postUpdate}
              loading={saving}
              disabled={!newUpdate.trim()}
            />
          </View>
        )}
      </ScrollView>
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
  scroll: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.xxl * 2,
  },
  statusRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  meta: {
    fontFamily: typography.fontFamily,
    ...typography.caption,
    color: colors.muted,
    textAlign: 'right',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily,
    ...typography.h2,
    color: colors.text,
    textAlign: 'right',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  description: {
    fontFamily: typography.fontFamily,
    ...typography.body,
    color: colors.text,
    textAlign: 'right',
    lineHeight: 22,
  },
  images: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  image: {
    width: 140,
    height: 100,
    borderRadius: 12,
    backgroundColor: colors.border,
  },
  updateCard: {
    marginBottom: spacing.sm,
  },
  updateTime: {
    fontFamily: typography.fontFamily,
    ...typography.caption,
    color: colors.muted,
    textAlign: 'right',
    marginBottom: spacing.xs,
  },
  updateText: {
    fontFamily: typography.fontFamily,
    ...typography.body,
    color: colors.text,
    textAlign: 'right',
  },
  adminSection: {
    marginTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.base,
  },
  label: {
    fontFamily: typography.fontFamily,
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    textAlign: 'right',
    marginBottom: spacing.sm,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statusBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 999,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  statusBtnText: {
    fontFamily: typography.fontFamily,
    fontSize: 13,
    fontWeight: '600',
  },
  loadingText: {
    fontFamily: typography.fontFamily,
    ...typography.body,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 100,
  },
});
