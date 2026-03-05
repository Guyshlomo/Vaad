import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AppHeader from '../../components/AppHeader';
import SectionHeader from '../../components/SectionHeader';
import IssueCard from '../../components/IssueCard';
import AdminIssueCard from '../../components/AdminIssueCard';
import FloatingActionButton from '../../components/FloatingActionButton';
import EmptyState from '../../components/EmptyState';
import SkeletonCard from '../../components/SkeletonCard';
import JoinBuildingModal from '../../components/JoinBuildingModal';
import ConfirmModal from '../../components/ConfirmModal';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { colors, spacing, typography } from '../../theme/tokens';

export default function IssuesHomeScreen() {
  const router = useRouter();
  const { profile, isAdmin, hasBuilding, joinBuilding } = useAuth();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchIssues = useCallback(async () => {
    if (!profile?.building_id) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('issues')
      .select('*')
      .eq('building_id', profile.building_id)
      .order('created_at', { ascending: false });
    if (data) setIssues(data);
    setLoading(false);
  }, [profile?.building_id]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  async function onRefresh() {
    setRefreshing(true);
    await fetchIssues();
    setRefreshing(false);
  }

  async function handleJoinBuilding(code) {
    await joinBuilding(code);
    setJoinModalVisible(false);
  }

  async function handleStatusChange(issueId, newStatus) {
    const { error } = await supabase
      .from('issues')
      .update({ status: newStatus })
      .eq('id', issueId);

    if (error) {
      Alert.alert('שגיאה', 'לא הצלחנו לעדכן את הסטטוס');
      return;
    }
    setIssues((prev) =>
      prev.map((i) => (i.id === issueId ? { ...i, status: newStatus } : i))
    );
  }

  async function handleDelete(issueId) {
    const { error } = await supabase.from('issues').delete().eq('id', issueId);
    if (error) {
      Alert.alert('שגיאה', 'לא הצלחנו למחוק את התקלה');
      return;
    }
    setIssues((prev) => prev.filter((i) => i.id !== issueId));
    setDeleteTarget(null);
  }

  const firstName = profile?.full_name?.split(' ')[0] || '';

  // דיירים ללא בניין רואים מסך "הצטרף לבניין",
  // אדמין לעולם לא רואה את זה (הוא נותן את הקוד לאחרים).
  if (!hasBuilding && !isAdmin) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <AppHeader
          greeting={`שלום ${firstName}`}
          avatarLabel={firstName?.charAt(0)}
          onAvatarPress={() => router.push('/(tabs)/profile')}
        />
        <EmptyState
          icon="office-building-marker"
          title="הצטרף לבניין שלך"
          subtitle="כדי לראות תקלות ועדכונים, הזן את מזהה הבניין שקיבלת מוועד הבית"
          actionLabel="הזן מזהה בניין"
          onAction={() => setJoinModalVisible(true)}
        />
        <JoinBuildingModal
          visible={joinModalVisible}
          onClose={() => setJoinModalVisible(false)}
          onJoin={handleJoinBuilding}
        />
      </SafeAreaView>
    );
  }

  const openIssues = issues.filter((i) => i.status === 'open');
  const inProgressIssues = issues.filter((i) => i.status === 'in_progress');
  const doneIssues = issues.filter((i) => i.status === 'done');

  const adminSections = [
    { title: 'תקלות חדשות', data: openIssues, key: 'open', emoji: '🔴' },
    { title: 'תקלות בטיפול', data: inProgressIssues, key: 'in_progress', emoji: '🟡' },
    { title: 'תקלות שהסתיימו', data: doneIssues, key: 'done', emoji: '✅' },
  ];

  const residentSections = [
    { title: 'תקלות פתוחות', data: openIssues, key: 'open' },
    { title: 'בטיפול', data: inProgressIssues, key: 'in_progress' },
    { title: 'טופלו', data: doneIssues, key: 'done' },
  ];

  const sections = isAdmin ? adminSections : residentSections;

  function renderContent() {
    if (loading) {
      return (
        <View style={styles.skeletons}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      );
    }

    return (
      <>
        {isAdmin && <Text style={styles.subtitle}>ניהול תקלות הבניין</Text>}

        {sections.map((section) => {
          const hasData = section.data.length > 0;
          const title = `${section.emoji || ''} ${section.title}`.trim();

          // אדמין – תמיד רואה שלוש רובריקות, גם אם ריקות
          if (isAdmin) {
            return (
              <View key={section.key}>
                <SectionHeader title={title} />
                {hasData ? (
                  <>
                    <Text style={styles.countBadge}>
                      {section.data.length}{' '}
                      {section.data.length === 1 ? 'תקלה' : 'תקלות'}
                    </Text>
                    {section.data.map((issue) => (
                      <View key={issue.id} style={styles.cardWrapper}>
                        <AdminIssueCard
                          issue={issue}
                          onStatusChange={handleStatusChange}
                          onDelete={(id) => setDeleteTarget(id)}
                          onPress={() =>
                            router.push({
                              pathname: '/modals/issue-details/[issueId]',
                              params: { issueId: issue.id },
                            })
                          }
                        />
                      </View>
                    ))}
                  </>
                ) : (
                  <Text style={styles.countBadge}>אין תקלות בסעיף זה</Text>
                )}
              </View>
            );
          }

          // דיירים – מציגים רק סקשנים עם תקלות
          if (!hasData) return null;

          return (
            <View key={section.key}>
              <SectionHeader title={title} />
              <Text style={styles.countBadge}>
                {section.data.length}{' '}
                {section.data.length === 1 ? 'תקלה' : 'תקלות'}
              </Text>
              {section.data.map((issue) => (
                <View key={issue.id} style={styles.cardWrapper}>
                  <IssueCard
                    issue={issue}
                    onPress={() =>
                      router.push({
                        pathname: '/modals/issue-details/[issueId]',
                        params: { issueId: issue.id },
                      })
                    }
                  />
                </View>
              ))}
            </View>
          );
        })}
      </>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader
        greeting={`שלום ${firstName}`}
        avatarLabel={firstName?.charAt(0)}
        onAvatarPress={() => router.push('/(tabs)/profile')}
      />

      <FlatList
        data={[{ key: 'content' }]}
        renderItem={() => renderContent()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
      />

      {!isAdmin && (
        <FloatingActionButton onPress={() => router.push('/modals/report-issue')} />
      )}

      <ConfirmModal
        visible={!!deleteTarget}
        title="מחיקת תקלה"
        message="האם למחוק את התקלה לצמיתות? לא ניתן לשחזר."
        confirmLabel="מחיקה"
        onConfirm={() => handleDelete(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
        danger
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  subtitle: {
    fontFamily: typography.fontFamily,
    fontSize: 14,
    color: colors.muted,
    textAlign: 'right',
    paddingHorizontal: spacing.base,
    marginBottom: spacing.sm,
  },
  countBadge: {
    fontFamily: typography.fontFamily,
    fontSize: 12,
    color: colors.muted,
    textAlign: 'right',
    paddingHorizontal: spacing.base,
    marginBottom: spacing.xs,
  },
  list: {
    paddingBottom: 100,
  },
  cardWrapper: {
    paddingHorizontal: spacing.base,
  },
  skeletons: {
    paddingTop: spacing.base,
  },
});
