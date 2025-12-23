import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Typography } from '../../components/Typography';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { RootStackParamList } from '../../types/navigation';
import { Plus, FileText, Mail } from 'lucide-react-native';

export const DashboardScreen = () => {
  const { theme } = useTheme();
  const { user, isAdmin } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'open' | 'in_progress' | 'resolved'>('open');
  const [profile, setProfile] = useState<any>(null);
  const [unreadAnnouncements, setUnreadAnnouncements] = useState(0);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    setProfile(data);
  };

  const fetchUnreadAnnouncements = async () => {
    if (!user || !profile?.building_id) return;

    // Get last seen timestamp (fallback to epoch = all announcements are unread)
    const { data: settings } = await supabase
      .from('user_settings')
      .select('announcements_last_seen_at')
      .eq('user_id', user.id)
      .maybeSingle();

    const lastSeen = settings?.announcements_last_seen_at || '1970-01-01T00:00:00.000Z';

    const { count } = await supabase
      .from('announcements')
      .select('id', { count: 'exact', head: true })
      .eq('building_id', profile.building_id)
      .gt('created_at', lastSeen);

    setUnreadAnnouncements(count || 0);
  };

  const fetchIssues = async () => {
    try {
      const { data, error } = await supabase
        .from('issues')
        .select(`
          *,
          reporter:profiles(full_name),
          media:issue_media(url)
        `)
        .eq('status', filter)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIssues(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchIssues();
      fetchProfile();
      fetchUnreadAnnouncements();
    }, [filter])
  );

  useEffect(() => {
    // Once profile is loaded (building_id), we can compute unread count
    fetchUnreadAnnouncements();
  }, [profile?.building_id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchIssues();
  };

  const getStatusColor = (status: string) => {
    return theme.status[status as keyof typeof theme.status] || theme.textSecondary;
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'נפתחה';
      case 'in_progress': return 'בטיפול';
      case 'resolved': return 'טופלה';
      default: return status;
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
      onPress={() => navigation.navigate('IssueDetails', { issueId: item.id })}
    >
      <View style={styles.cardHeader}>
        {/* Right: status | Left: date */}
        <View style={styles.dateMeta}>
          <Typography variant="caption" color={theme.textSecondary} align="right">
            {new Date(item.created_at).toLocaleDateString('he-IL')}
          </Typography>
        </View>

        <View style={styles.statusMeta}>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
            <Typography variant="label" color={getStatusColor(item.status)} align="left">
              {getStatusLabel(item.status)}
            </Typography>
          </View>
        </View>
      </View>
      
      <Typography variant="h3" style={{ marginTop: 8 }}>{item.category}</Typography>
      <Typography variant="body" numberOfLines={2} color={theme.textSecondary} style={{ marginTop: 4 }}>
        {item.description}
      </Typography>
      
      <View style={{ flexDirection: 'row', marginTop: 12, alignItems: 'center' }}>
        <Typography variant="caption" color={theme.textSecondary}>
           דווח ע״י {item.reporter?.full_name || 'דייר'} • {item.location || 'כללי'}
        </Typography>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScreenWrapper style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ alignItems: 'flex-end' }}>
          <Typography variant="h2">שלום, {profile?.full_name?.split(' ')[0] || 'דייר'}</Typography>
          <Typography variant="body" color={theme.textSecondary}>מה שלום הבניין היום?</Typography>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('CommitteeAnnouncements')}
          style={[styles.messageButton, { borderColor: theme.primary, backgroundColor: theme.primary }]}
          accessibilityRole="button"
          accessibilityLabel="לוח מודעות ועד הבית"
          hitSlop={12}
        >
          <Mail size={24} color="white" />
          {!isAdmin && unreadAnnouncements > 0 && (
            <View style={[styles.badge, { backgroundColor: theme.error }]}>
              <Typography variant="caption" color="white" align="center" style={styles.badgeText}>
                {unreadAnnouncements > 99 ? '99+' : String(unreadAnnouncements)}
              </Typography>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['open', 'in_progress', 'resolved'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setFilter(tab)}
            style={[
              styles.tab,
              filter === tab && { backgroundColor: theme.primary + '20', borderColor: theme.primary }
            ]}
          >
            <Typography 
              variant="label" 
              color={filter === tab ? theme.primary : theme.textSecondary}
              align="center"
            >
              {getStatusLabel(tab)}
            </Typography>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={issues}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          !loading ? (
            <View style={{ alignItems: 'center', marginTop: 60 }}>
              <FileText size={48} color={theme.textSecondary} />
              <Typography variant="body" color={theme.textSecondary} style={{ marginTop: 16 }}>
                אין תקלות בסטטוס זה
              </Typography>
            </View>
          ) : null
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.primary }]}
        onPress={() => navigation.navigate('CreateIssue')}
      >
        <Plus color="white" size={24} />
        <Typography variant="label" color="white" style={{ marginStart: 8 }}>דיווח תקלה</Typography>
      </TouchableOpacity>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, 
  },
  header: {
    padding: 24,
    // RTL header: text on the right, profile icon on the left
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
    justifyContent: 'center',
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
    marginHorizontal: 4,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statusMeta: {
    alignItems: 'flex-start',
    
  },
  dateMeta: {
    alignItems: 'flex-end',
  },
  statusRow: {
    // RTL: dot on the right of the label
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    // With `row-reverse`, a physical left margin creates spacing between the dot (right) and the label (left)
    marginLeft: 6,
  },
  messageButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 2,
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 10,
    marginBottom: 0,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    left: 24, // RTL: left is actually start in RN if I18nManager is set, but usually right. The user said Hebrew UI. I'll put it on the leading side or trailing.
    // Let's put it on the left (Start)
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});

