import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const ENABLED_KEY = 'geokpss-reminder-v1';
const CHANNEL_ID = 'study-reminder';

export const REMINDER_HOUR = 19;
export const REMINDER_MINUTE = 0;

type NotificationsModule = typeof import('expo-notifications');

async function loadNotifications(): Promise<NotificationsModule | null> {
  if (Platform.OS === 'web') return null;
  try {
    return await import('expo-notifications');
  } catch {
    return null;
  }
}

export async function isReminderEnabled(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(ENABLED_KEY)) === '1';
  } catch {
    return false;
  }
}

async function ensureAndroidChannel(notifications: NotificationsModule): Promise<void> {
  if (Platform.OS !== 'android') return;
  await notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Çalışma hatırlatıcısı',
    importance: notifications.AndroidImportance.DEFAULT,
  });
}

async function scheduleDaily(notifications: NotificationsModule): Promise<void> {
  await ensureAndroidChannel(notifications);
  await notifications.cancelAllScheduledNotificationsAsync();
  await notifications.scheduleNotificationAsync({
    content: {
      title: 'GeoKPSS tekrar zamanı',
      body: 'Bugünkü çalışma hedefini tamamlamayı unutma — birkaç soru çöz.',
      sound: true,
    },
    trigger: {
      type: notifications.SchedulableTriggerInputTypes.DAILY,
      hour: REMINDER_HOUR,
      minute: REMINDER_MINUTE,
    },
  });
}

/** Hatırlatıcıyı açar/kapatır. true dönerse istenen durum uygulandı. */
export async function setReminderEnabled(enabled: boolean): Promise<boolean> {
  const notifications = await loadNotifications();
  if (!notifications) return false;
  try {
    if (enabled) {
      const permission = await notifications.requestPermissionsAsync();
      if (!permission.granted) return false;
      await scheduleDaily(notifications);
    } else {
      await notifications.cancelAllScheduledNotificationsAsync();
    }
    await AsyncStorage.setItem(ENABLED_KEY, enabled ? '1' : '0');
    return true;
  } catch {
    return false;
  }
}
