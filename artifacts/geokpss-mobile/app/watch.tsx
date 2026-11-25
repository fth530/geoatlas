import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React from 'react';
import { Linking, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { AppText as Text } from '@/components/AppText';
import { FONT_FAMILY } from '@/constants/typography';
import { useColors } from '@/hooks/useColors';
import { buildPlaylistEmbedUrl, buildPlaylistUrl } from '@/services/youtube-service';

export default function WatchScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ list?: string; title?: string; channel?: string }>();
  const playlistId = typeof params.list === 'string' ? params.list : '';
  const title = typeof params.title === 'string' ? params.title : 'Playlist';
  const channel = typeof params.channel === 'string' ? params.channel : '';

  const openInYouTube = async () => {
    const url = buildPlaylistUrl(playlistId);
    if (Platform.OS === 'web') {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      await WebBrowser.openBrowserAsync(url);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: '#000' }]}>
      <View style={[styles.header, { paddingTop: Platform.OS === 'web' ? 12 : insets.top + 8 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Geri dön"
          onPress={() => router.back()}
          style={[styles.iconButton, { backgroundColor: 'rgba(255,255,255,0.12)' }]}
          hitSlop={8}
        >
          <Feather name="arrow-left" size={20} color="#fff" />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
          {channel ? <Text style={styles.headerChannel} numberOfLines={1}>{channel}</Text> : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="YouTube'da aç"
          onPress={() => void openInYouTube()}
          style={[styles.iconButton, { backgroundColor: 'rgba(255,255,255,0.12)' }]}
          hitSlop={8}
        >
          <Feather name="external-link" size={18} color="#fff" />
        </Pressable>
      </View>

      {playlistId ? (
        <WebView
          source={{ uri: buildPlaylistEmbedUrl(playlistId) }}
          style={styles.webview}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled
          domStorageEnabled
          allowsFullscreenVideo
          setSupportMultipleWindows={false}
        />
      ) : (
        <View style={styles.empty}>
          <Feather name="youtube" size={40} color="rgba(255,255,255,0.4)" />
          <Text style={styles.emptyText}>Playlist bulunamadı.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 10,
    gap: 10,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  headerTitle: {
    color: '#fff',
    fontFamily: FONT_FAMILY.semibold,
    fontSize: 15,
    letterSpacing: -0.2,
  },
  headerChannel: {
    color: 'rgba(255,255,255,0.55)',
    fontFamily: FONT_FAMILY.regular,
    fontSize: 12,
    marginTop: 1,
  },
  webview: { flex: 1, backgroundColor: '#000' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { color: 'rgba(255,255,255,0.6)', fontFamily: FONT_FAMILY.medium, fontSize: 14 },
});
