import React from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Switch } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Typography } from '../../components/Typography';
import { Button } from '../../components/Button';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { Moon, Sun, User, LogOut, Trash2, Shield } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../../utils/storageKeys';
import { AUTH_MODE } from '../../lib/config';

export const ProfileScreen = () => {
  const { theme, themeType, toggleTheme } = useTheme();
  const { user, isAdmin, signOut } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleLogout = () => {
    Alert.alert('התנתקות', 'האם אתם בטוחים שברצונכם להתנתק?', [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'התנתק',
        style: 'destructive',
        onPress: async () => {
          try {
            await AsyncStorage.removeItem(STORAGE_KEYS.profileReadyUserId);
          } catch {}
          await signOut();
        },
      },
    ]);
  };

  return (
    <ScreenWrapper style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
          <User color="white" size={40} />
        </View>
        <Typography variant="h2" style={{ marginTop: 16 }}>
          {/* We might want to store user details in context to avoid fetching every time */}
          פרופיל אישי
        </Typography>
        <Typography variant="body" color={theme.textSecondary}>
           {user?.phone || user?.email}
        </Typography>
      </View>

      <View style={styles.section}>
        <Typography variant="h3" style={{ marginBottom: 16 }}>הגדרות</Typography>
        
        <View style={styles.row}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {themeType === 'dark' ? <Moon size={20} color={theme.text} /> : <Sun size={20} color={theme.text} />}
            <Typography style={{ marginLeft: 12 }}>מצב לילה</Typography>
          </View>
          <Switch 
            value={themeType === 'dark'} 
            onValueChange={toggleTheme}
            trackColor={{ false: '#767577', true: theme.primary }}
          />
        </View>

        {/* Committee Access */}
        {isAdmin && (
           <TouchableOpacity 
             style={styles.row} 
             onPress={() => navigation.navigate('CommitteePanel')}
           >
             <View style={{ flexDirection: 'row', alignItems: 'center' }}>
               <Shield size={20} color={theme.primary} />
               <Typography style={{ marginLeft: 12 }} color={theme.primary} weight="bold">ניהול ועד בית</Typography>
             </View>
           </TouchableOpacity>
        )}
      </View>

      <View style={styles.footer}>
        {AUTH_MODE === 'anonymous' && (
          <Typography variant="caption" align="center" color={theme.textSecondary} style={{ marginBottom: 12 }}>
            מצב בדיקות פעיל (anonymous): התנתקות/התחברות יכולה ליצור משתמש חדש ולכן ייתכן שתידרש השלמת פרופיל מחדש.
          </Typography>
        )}

        <Button 
          title="התנתק" 
          onPress={handleLogout} 
          variant="outline"
          style={{ marginBottom: 12 }}
        />
        
        <TouchableOpacity style={{ alignItems: 'center', padding: 12 }}>
          <Typography variant="caption" color={theme.error}>מחק חשבון</Typography>
        </TouchableOpacity>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 32,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    padding: 24,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  footer: {
    padding: 24,
    marginTop: 'auto',
  },
});

