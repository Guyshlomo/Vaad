import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { supabase } from '../lib/supabase';
import { ActivityIndicator, View } from 'react-native';
import { STORAGE_KEYS } from '../utils/storageKeys';

// Screens
import { OnboardingScreen } from '../screens/auth/OnboardingScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { ProfileSetupScreen } from '../screens/auth/ProfileSetupScreen';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { CreateIssueScreen } from '../screens/dashboard/CreateIssueScreen';
import { IssueDetailsScreen } from '../screens/dashboard/IssueDetailsScreen';
import { PeopleScreen } from '../screens/people/PeopleScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { CommitteePanelScreen } from '../screens/committee/CommitteePanelScreen';
import { AnnouncementsScreen } from '../screens/committee/AnnouncementsScreen';

import { RootStackParamList, AuthStackParamList, MainTabParamList } from '../types/navigation';
import { Home, Users, User } from 'lucide-react-native';

const Stack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabs = () => {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      id="main-tabs"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
      }}
    >
      <Tab.Screen 
        name="People" 
        component={PeopleScreen} 
        options={{ 
          tabBarLabel: 'שכנים',
          tabBarIcon: ({ color }) => <Users color={color} size={24} />
        }} 
      />
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{ 
          tabBarLabel: 'תקלות',
          tabBarIcon: ({ color }) => <Home color={color} size={24} />
        }} 
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ 
          tabBarLabel: 'אני',
          tabBarIcon: ({ color }) => <User color={color} size={24} />
        }} 
      />
    </Tab.Navigator>
  );
};

export const RootNavigator = () => {
  const { session, loading: authLoading } = useAuth();
  const { theme } = useTheme();
  const [onboardingSeen, setOnboardingSeen] = useState<boolean | null>(null);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [checkLoading, setCheckLoading] = useState(true);

  useEffect(() => {
    const checkState = async () => {
      try {
        // Check onboarding
        const seen = await AsyncStorage.getItem(STORAGE_KEYS.onboardingSeen);
        setOnboardingSeen(seen === 'true');

        // Check profile if session exists
        if (session?.user) {
          const { data } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', session.user.id)
            .single();
          setHasProfile(!!data);
        } else {
          setHasProfile(false);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setCheckLoading(false);
      }
    };
    checkState();
  }, [session]);

  if (authLoading || checkLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        id="root-stack"
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.background } }}
      >
        {!session ? (
          <Stack.Group>
            {!onboardingSeen && (
              <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            )}
            <Stack.Screen name="Login" component={LoginScreen} />
          </Stack.Group>
        ) : !hasProfile ? (
          <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
        ) : (
          <Stack.Group>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="CreateIssue" component={CreateIssueScreen} options={{ presentation: 'modal' }} />
            <Stack.Screen name="IssueDetails" component={IssueDetailsScreen} />
            <Stack.Screen name="CommitteePanel" component={CommitteePanelScreen} />
            <Stack.Screen name="CommitteeAnnouncements" component={AnnouncementsScreen} />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

