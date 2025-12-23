import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Alert, TouchableOpacity } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Typography } from '../../components/Typography';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Pin } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';

export const AnnouncementsScreen = () => {
  const { theme } = useTheme();
  const { user, isAdmin } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create mode
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      // Mark announcements as seen when user opens the board
      const markSeen = async () => {
        if (!user?.id) return;
        const now = new Date().toISOString();
        await supabase.from('user_settings').upsert(
          { user_id: user.id, announcements_last_seen_at: now, updated_at: now },
          { onConflict: 'user_id' }
        );
      };

      markSeen();
    }, [user?.id])
  );

  const fetchAnnouncements = async () => {
    try {
      const { data: profile } = await supabase.from('profiles').select('building_id').eq('id', user?.id).single();
      if (!profile) return;

      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('building_id', profile.building_id)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!title || !content) return;
    
    try {
      const { data: profile } = await supabase.from('profiles').select('building_id').eq('id', user?.id).single();
      
      const { error } = await supabase.from('announcements').insert({
        building_id: profile.building_id,
        author_id: user?.id,
        title,
        content,
        is_pinned: isPinned,
      });

      if (error) throw error;

      setIsCreating(false);
      setTitle('');
      setContent('');
      fetchAnnouncements();
      Alert.alert('פורסם', 'ההודעה נשלחה לכל הדיירים');
    } catch (error: any) {
      Alert.alert('שגיאה', error.message);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      {item.is_pinned && (
        <View style={{ flexDirection: 'row', marginBottom: 8 }}>
          <Pin size={16} color={theme.primary} />
          <Typography variant="caption" color={theme.primary} style={{ marginLeft: 4 }}>נעוץ</Typography>
        </View>
      )}
      <Typography variant="h3">{item.title}</Typography>
      <Typography variant="body" style={{ marginTop: 8 }}>{item.content}</Typography>
      <Typography variant="caption" color={theme.textSecondary} style={{ marginTop: 12 }}>
        {new Date(item.created_at).toLocaleDateString('he-IL')}
      </Typography>
    </View>
  );

  return (
    <ScreenWrapper style={styles.container}>
      <View style={styles.header}>
        <Typography variant="h2">לוח מודעות ועד הבית</Typography>
      </View>

      {isAdmin && !isCreating && (
        <Button 
          title="כתוב הודעה חדשה" 
          onPress={() => setIsCreating(true)} 
          style={{ marginHorizontal: 24, marginBottom: 16 }}
        />
      )}

      {isCreating ? (
        <View style={styles.createForm}>
          <Input 
            label="כותרת" 
            value={title} 
            onChangeText={setTitle} 
          />
          <Input 
            label="תוכן ההודעה" 
            value={content} 
            onChangeText={setContent} 
            multiline 
            style={{ height: 100, textAlignVertical: 'top' }} 
          />
          
          <TouchableOpacity 
            style={[styles.checkbox, { marginBottom: 16 }]} 
            onPress={() => setIsPinned(!isPinned)}
          >
            <View style={[styles.box, { borderColor: theme.text, backgroundColor: isPinned ? theme.primary : 'transparent' }]} />
            <Typography style={{ marginLeft: 8 }}>נעץ הודעה בראש הלוח</Typography>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row' }}>
            <Button title="ביטול" onPress={() => setIsCreating(false)} variant="ghost" style={{ flex: 1 }} />
            <Button title="פרסם" onPress={handleCreate} style={{ flex: 1 }} />
          </View>
        </View>
      ) : (
        <FlatList
          data={announcements}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 24 }}
          ListEmptyComponent={
            <Typography align="center" color={theme.textSecondary} style={{ marginTop: 40 }}>
              אין הודעות חדשות
            </Typography>
          }
        />
      )}
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
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  createForm: {
    padding: 24,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  box: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderRadius: 4,
  },
});

