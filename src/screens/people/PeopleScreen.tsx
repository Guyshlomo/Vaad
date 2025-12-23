import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Typography } from '../../components/Typography';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { User } from 'lucide-react-native';

export const PeopleScreen = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [people, setPeople] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPeople();
  }, []);

  const fetchPeople = async () => {
    try {
      // Get current user's building first
      const { data: myProfile } = await supabase.from('profiles').select('building_id').eq('id', user?.id).single();
      
      if (myProfile?.building_id) {
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            *,
            units (floor, apartment_number)
          `)
          .eq('building_id', myProfile.building_id)
          .order('full_name');
        
        if (error) throw error;
        setPeople(data || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={[styles.avatar, { backgroundColor: theme.primary + '20' }]}>
        <User color={theme.primary} size={20} />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Typography variant="body" weight="bold">{item.full_name || 'דייר'}</Typography>
        <Typography variant="caption" color={theme.textSecondary}>
          {item.role === 'committee' ? '⭐ ועד הבית' : 'דייר'} • {item.units ? `קומה ${item.units.floor}, דירה ${item.units.apartment_number}` : 'לא משויך'}
        </Typography>
      </View>
    </View>
  );

  return (
    <ScreenWrapper style={styles.container}>
      <View style={styles.header}>
        <Typography variant="h2">שכנים</Typography>
        <Typography variant="body" color={theme.textSecondary}>כל הדיירים בבניין</Typography>
      </View>

      <FlatList
        data={people}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
      />
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

