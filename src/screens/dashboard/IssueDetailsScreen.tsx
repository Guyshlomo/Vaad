import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Typography } from '../../components/Typography';
import { Button } from '../../components/Button';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { supabase, supabaseUrl } from '../../lib/supabase';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../types/navigation';
import { ArrowRight, Clock, CheckCircle, AlertCircle } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system/legacy';

type IssueDetailsRouteProp = RouteProp<RootStackParamList, 'IssueDetails'>;

export const IssueDetailsScreen = () => {
  const { theme } = useTheme();
  const { user, isAdmin } = useAuth();
  const navigation = useNavigation();
  const route = useRoute<IssueDetailsRouteProp>();
  const { issueId } = route.params;

  const [issue, setIssue] = useState<any>(null);
  const [updates, setUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cachedImages, setCachedImages] = useState<Record<string, string>>({});
  const [caching, setCaching] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchIssueDetails();
  }, [issueId]);

  const storagePathFromUrlOrPath = (urlOrPath: string) => {
    if (!urlOrPath) return null;
    if (!urlOrPath.startsWith('http')) return urlOrPath;

    // Supports both public URLs and already-signed URLs.
    const publicMarker = '/storage/v1/object/public/issue-images/';
    const signedMarker = '/storage/v1/object/sign/issue-images/';

    if (urlOrPath.includes(publicMarker)) {
      return decodeURIComponent(urlOrPath.split(publicMarker)[1].split('?')[0]);
    }
    if (urlOrPath.includes(signedMarker)) {
      return decodeURIComponent(urlOrPath.split(signedMarker)[1].split('?')[0]);
    }
    // If it's some other http URL (e.g., external), we leave it as-is.
    return null;
  };

  const resolveIssueImageUrl = async (urlOrPath: string) => {
    const storagePath = storagePathFromUrlOrPath(urlOrPath);
    if (!storagePath) return urlOrPath;

    // 1) Prefer signed URL (works for private buckets when policies allow).
    try {
      const { data, error } = await supabase.storage
        .from('issue-images')
        .createSignedUrl(storagePath, 60 * 60); // 1 hour
      if (!error && data?.signedUrl) return data.signedUrl;
    } catch {
      // ignore
    }

    // 2) Fallback to public URL (works only if bucket is public)
    try {
      const { data: publicData } = supabase.storage.from('issue-images').getPublicUrl(storagePath);
      if (publicData?.publicUrl) return publicData.publicUrl;
    } catch {
      // ignore
    }

    return urlOrPath;
  };

  const hydrateMediaUrls = async (media: any[]) => {
    if (!Array.isArray(media) || media.length === 0) return media;

    const hydrated = await Promise.all(
      media.map(async (m) => {
        const rawUrl = m?.url;
        if (!rawUrl || typeof rawUrl !== 'string') return m;

        const resolved = await resolveIssueImageUrl(rawUrl);
        return { ...m, url: resolved };
      })
    );

    return hydrated;
  };

  const hashString = (s: string) => {
    // Small stable hash for filenames
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
    return (h >>> 0).toString(16);
  };

  const cacheRemoteImage = async (remoteUrl: string) => {
    if (!remoteUrl || typeof remoteUrl !== 'string') return;
    if (cachedImages[remoteUrl]) return;
    if (caching[remoteUrl]) return;

    setCaching((prev) => ({ ...prev, [remoteUrl]: true }));
    try {
      if (!FileSystem.cacheDirectory) return;
      const fileUri = `${FileSystem.cacheDirectory}issue-image-${hashString(remoteUrl)}.img`;
      const res = await FileSystem.downloadAsync(remoteUrl, fileUri);
      if (res.status >= 200 && res.status < 300) {
        setCachedImages((prev) => ({ ...prev, [remoteUrl]: res.uri }));
      } else {
        console.log('Issue image download failed:', remoteUrl, 'status=', res.status);
      }
    } catch (e) {
      console.log('Issue image cache failed:', remoteUrl, e);
    } finally {
      setCaching((prev) => ({ ...prev, [remoteUrl]: false }));
    }
  };

  const fetchIssueDetails = async () => {
    try {
      const { data: issueData, error } = await supabase
        .from('issues')
        .select(`
          *,
          reporter:profiles(full_name),
          media:issue_media(url)
        `)
        .eq('id', issueId)
        .single();
      
      if (error) throw error;

      // Sometimes embedded relations can be missing depending on PostgREST/RLS settings.
      // If so, fall back to querying issue_media directly.
      let mediaRows = issueData?.media;
      if (!Array.isArray(mediaRows)) {
        const { data: directMedia } = await supabase
          .from('issue_media')
          .select('url')
          .eq('issue_id', issueId)
          .order('created_at', { ascending: true });
        mediaRows = directMedia || [];
      }

      const hydratedMedia = await hydrateMediaUrls(mediaRows || []);
      setIssue({ ...issueData, media: hydratedMedia });

      const { data: updatesData } = await supabase
        .from('issue_updates')
        .select('*, author:profiles(full_name)')
        .eq('issue_id', issueId)
        .order('created_at', { ascending: false });

      setUpdates(updatesData || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    try {
      // 1. Update issue
      const { error } = await supabase
        .from('issues')
        .update({ status: newStatus })
        .eq('id', issueId);

      if (error) throw error;

      // 2. Add history record
      await supabase.from('issue_updates').insert({
        issue_id: issueId,
        author_id: user?.id,
        new_status: newStatus,
        comment: `הסטטוס שונה ל-${getStatusLabel(newStatus)}`,
      });

      // Refresh
      fetchIssueDetails();
      Alert.alert('עודכן', 'סטטוס התקלה עודכן בהצלחה');
    } catch (error: any) {
      Alert.alert('שגיאה', error.message);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'נפתחה';
      case 'in_progress': return 'בטיפול';
      case 'resolved': return 'טופלה';
      default: return status;
    }
  };

  if (loading) return <ScreenWrapper><View /></ScreenWrapper>;

  return (
    <ScreenWrapper style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowRight color={theme.text} size={24} />
        </TouchableOpacity>
        <Typography variant="h3" style={{ marginLeft: 16 }}>פרטי תקלה</Typography>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: theme.status[issue.status as keyof typeof theme.status] }]}>
          <Typography variant="label" color="white">{getStatusLabel(issue.status)}</Typography>
        </View>

        <Typography variant="h1" style={{ marginTop: 16 }}>{issue.category}</Typography>
        <Typography variant="caption" color={theme.textSecondary}>
          דווח ב-{new Date(issue.created_at).toLocaleDateString('he-IL')} • {issue.location}
        </Typography>

        <Typography variant="body" style={{ marginTop: 16, lineHeight: 24 }}>
          {issue.description}
        </Typography>

        {issue.media && issue.media.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 16 }}>
            {issue.media.map((m: any, idx: number) => (
              <Image
                key={`${m.url || 'media'}-${idx}`}
                source={{ uri: cachedImages[m?.url] || m.url }}
                style={styles.image}
                onError={(e) => {
                  console.log('Failed to load issue image:', m?.url, e?.nativeEvent?.error);
                  console.log('Supabase URL:', supabaseUrl);
                  cacheRemoteImage(m?.url);
                }}
              />
            ))}
          </ScrollView>
        )}

        <View style={styles.divider} />

        <Typography variant="h3" style={{ marginBottom: 16 }}>היסטוריית טיפול</Typography>
        
        {updates.map((update) => (
          <View key={update.id} style={styles.timelineItem}>
            <View style={[styles.timelineDot, { backgroundColor: theme.primary }]} />
            <View style={{ flex: 1 }}>
              <Typography variant="body" weight="bold">
                {update.author?.full_name || 'מערכת'}
              </Typography>
              <Typography variant="body">{update.comment}</Typography>
              <Typography variant="caption" color={theme.textSecondary}>
                {new Date(update.created_at).toLocaleString('he-IL')}
              </Typography>
            </View>
          </View>
        ))}

        {updates.length === 0 && (
          <Typography variant="body" color={theme.textSecondary}>טרם בוצעו עדכונים</Typography>
        )}

        {/* Admin Actions */}
        {isAdmin && (
          <View style={styles.adminActions}>
            <Typography variant="h3" style={{ marginBottom: 12 }}>ניהול (ועד)</Typography>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {issue.status !== 'in_progress' && (
                <Button 
                  title="בטיפול" 
                  onPress={() => updateStatus('in_progress')} 
                  style={{ flex: 1, backgroundColor: theme.status.in_progress }}
                />
              )}
              {issue.status !== 'resolved' && (
                <Button 
                  title="טופלה" 
                  onPress={() => updateStatus('resolved')} 
                  style={{ flex: 1, backgroundColor: theme.status.resolved }}
                />
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    padding: 24,
    paddingTop: 0,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  image: {
    height: 200,
    borderRadius: 12,
    width: 260,
    marginRight: 12,
    backgroundColor: '#eee',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 24,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
    borderRightWidth: 2,
    borderRightColor: '#E5E7EB',
    paddingRight: 16,
    marginRight: 6,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    position: 'absolute',
    right: -21, // Adjust for RTL border
    top: 6,
  },
  adminActions: {
    marginTop: 32,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 12,
  },
});

