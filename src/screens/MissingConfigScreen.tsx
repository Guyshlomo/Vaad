import React from 'react';
import { View, StyleSheet, Linking } from 'react-native';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { Typography } from '../components/Typography';
import { Button } from '../components/Button';
import { supabaseUrl } from '../lib/supabase';

export const MissingConfigScreen = () => {
  const openDocs = () => {
    Linking.openURL('https://supabase.com/docs/guides/getting-started');
  };

  return (
    <ScreenWrapper style={styles.container}>
      <View style={styles.content}>
        <Typography variant="h1" align="center">
          חסרה הגדרה
        </Typography>
        <Typography variant="body" align="center" style={{ marginBottom: 16 }}>
          חסר לנו מפתח Supabase (anon key), ולכן האפליקציה לא יכולה להתחבר לשרת.
        </Typography>
        <Typography variant="body" align="center" style={{ marginBottom: 16 }}>
          הוסיפו בקובץ <Typography weight="bold">.env</Typography> את:
        </Typography>
        <Typography variant="body" align="center">
          EXPO_PUBLIC_SUPABASE_URL={supabaseUrl}
        </Typography>
        <Typography variant="body" align="center" style={{ marginBottom: 16 }}>
          EXPO_PUBLIC_SUPABASE_ANON_KEY=הדביקו_כאן_את_הAnonKey
        </Typography>

        <Typography variant="caption" align="center" style={{ marginBottom: 24 }}>
          אחרי שמירה: סגרו את Expo והפעילו שוב עם ‎npx expo start --clear‎
        </Typography>

        <Button title="פתח מסמכי Supabase" onPress={openDocs} />
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  content: { flex: 1, justifyContent: 'center' },
});


