import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Card from '../../components/Card';
import FloatingActionButton from '../../components/FloatingActionButton';
import EmptyState from '../../components/EmptyState';
import SectionHeader from '../../components/SectionHeader';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { colors, spacing, typography } from '../../theme/tokens';
import { timeAgo } from '../../utils/timeAgo';

export default function AnnouncementsScreen() {
  const router = useRouter();
  const { profile, isAdmin } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  async function fetchAnnouncements() {
    if (!profile?.building_id) return;
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .eq('building_id', profile.building_id)
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false });
    if (data) setAnnouncements(data);
  }

  async function onRefresh() {
    setRefreshing(true);
    await fetchAnnouncements();
    setRefreshing(false);
  }

  const pinned = announcements.filter((a) => a.pinned);
  const regular = announcements.filter((a) => !a.pinned);

  function renderItem({ item }) {
    return (
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          {item.pinned && (
            <MaterialCommunityIcons name="pin" size={16} color={colors.primary} style={styles.pin} />
          )}
          <Text style={styles.title}>{item.title}</Text>
        </View>
        <Text style={styles.body}>{item.body}</Text>
        <Text style={styles.time}>{timeAgo(item.created_at)}</Text>
      </Card>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.screenTitle}>עדכונים מהוועד</Text>

      {announcements.length === 0 ? (
        <EmptyState
          icon="bullhorn-outline"
          title="אין עדכונים כרגע"
        />
      ) : (
        <FlatList
          data={[...pinned, ...regular]}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            pinned.length > 0 ? <SectionHeader title="הודעות נעוצות" /> : null
          }
        />
      )}

      {isAdmin && (
        <FloatingActionButton onPress={() => router.push('/modals/create-announcement')} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screenTitle: {
    fontFamily: typography.fontFamily,
    ...typography.h1,
    color: colors.text,
    textAlign: 'right',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  list: {
    paddingHorizontal: spacing.base,
    paddingBottom: 100,
  },
  card: {
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  pin: {
    marginEnd: spacing.xs,
  },
  title: {
    fontFamily: typography.fontFamily,
    ...typography.h2,
    color: colors.text,
    flex: 1,
    textAlign: 'right',
  },
  body: {
    fontFamily: typography.fontFamily,
    ...typography.body,
    color: colors.text,
    textAlign: 'right',
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  time: {
    fontFamily: typography.fontFamily,
    ...typography.caption,
    color: colors.muted,
    textAlign: 'right',
  },
});
