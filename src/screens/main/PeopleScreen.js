import React, { useEffect, useState } from 'react';
import { View, SectionList, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SearchBar from '../../components/SearchBar';
import ResidentRow from '../../components/ResidentRow';
import EmptyState from '../../components/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { colors, spacing, typography } from '../../theme/tokens';

export default function PeopleScreen() {
  const { profile } = useAuth();
  const [residents, setResidents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResidents();
  }, []);

  async function fetchResidents() {
    if (!profile?.building_id) return;
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('building_id', profile.building_id)
      .order('floor', { ascending: true });
    if (data) setResidents(data);
    setLoading(false);
  }

  const filtered = residents.filter((r) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      r.full_name?.toLowerCase().includes(q) ||
      String(r.apartment).includes(q)
    );
  });

  const grouped = filtered.reduce((acc, r) => {
    const floor = r.floor ?? 0;
    if (!acc[floor]) acc[floor] = [];
    acc[floor].push(r);
    return acc;
  }, {});

  const sections = Object.keys(grouped)
    .sort((a, b) => Number(b) - Number(a))
    .map((floor) => ({
      title: `קומה ${floor}`,
      data: grouped[floor],
    }));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.screenTitle}>אנשים בבניין</Text>
      <SearchBar
        value={search}
        onChangeText={setSearch}
        placeholder="חיפוש לפי שם או דירה"
      />

      {!loading && sections.length === 0 ? (
        <EmptyState
          icon="account-group-outline"
          title="אין דיירים להצגה כרגע"
          subtitle="אם זה נראה לא נכון, בדקו שהתחברתם לבניין הנכון"
        />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionTitle}>{section.title}</Text>
          )}
          renderItem={({ item }) => (
            <ResidentRow
              name={item.full_name}
              apartment={item.apartment}
              isAdmin={item.admin}
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
        />
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
  sectionTitle: {
    fontFamily: typography.fontFamily,
    ...typography.h2,
    color: colors.secondary,
    textAlign: 'right',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    paddingBottom: spacing.xs,
    backgroundColor: colors.background,
  },
  list: {
    paddingBottom: spacing.xxl,
  },
});
