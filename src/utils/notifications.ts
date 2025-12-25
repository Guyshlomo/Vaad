import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from '../lib/supabase';

export async function registerForPushNotificationsAsync(userId: string) {
  const Notifications = await import('expo-notifications');
  const Device = await import('expo-device');

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      return;
    }
    
    // Get Expo Push Token
    try {
      // If you use EAS, set EXPO_PUBLIC_PROJECT_ID, or we’ll try to derive it.
      const projectId =
        process.env.EXPO_PUBLIC_PROJECT_ID ||
        (Constants.expoConfig as any)?.extra?.eas?.projectId ||
        (Constants.easConfig as any)?.projectId;

      token = (await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : (undefined as any))).data;
    } catch (e) {
      console.log('Error getting token', e);
      // Expo Go may fail to get a usable token (SDK 53+). We'll just skip saving.
      return;
    }
  } else {
    // alert('Must use physical device for Push Notifications');
  }

  if (token) {
    await savePushToken(userId, token);
  }
}

async function savePushToken(userId: string, token: string) {
  const { error } = await supabase
    .from('push_tokens')
    .upsert({ 
      user_id: userId, 
      token: token,
      device_type: Platform.OS 
    }, { onConflict: 'user_id, token' });

  if (error) console.error('Error saving push token:', error);
}

