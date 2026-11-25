import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText as Text } from '@/components/AppText';
import { FONT_FAMILY } from '@/constants/typography';
import { useColors } from '@/hooks/useColors';
import {
  CURATED_PLAYLISTS,
  fetchPlaylistMeta,
  loadCustomPlaylists,
  loadMetaCache,
  makeCustomPlaylistId,
  parsePlaylistId,
  PlaylistMeta,
  saveCustomPlaylists,
  saveMetaCache,
  YouTubePlaylist,
} from '@/services/youtube-service';

const YT_RED = '#FF0000';

export default function YouTubeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [customPlaylists, setCustomPlaylists] = useState<YouTubePlaylist[]>([]);
  const [meta, setMeta] = useState<Record<string, PlaylistMeta>>({});
  const [loading, setLoading] = useState(true);
  const [linkInput, setLinkInput] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');

  const allPlaylists = [...CURATED_PLAYLISTS, ...customPlaylists];

  useEffect(() => {
    let active = true;
    Promise.all([loadCustomPlaylists(), loadMetaCache()])
      .then(([items, cache]) => {
        if (!active) return;
        setCustomPlaylists(items);
        setMeta(cache);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    // Resolve missing playlist metadata (title/channel/thumbnail) lazily.
    const missing = [...CURATED_PLAYLISTS, ...customPlaylists].filter(
      (p) => !meta[p.playlistId],
    );
    if (missing.length > 0) {
      void (async () => {
        const next = { ...meta };
        let changed = false;
        // Limit concurrency to avoid hammering oEmbed.
        for (const playlist of missing.slice(0, 4)) {
          const result = await fetchPlaylistMeta(playlist.playlistId);
          if (result) {
            next[playlist.playlistId] = result;
            changed = true;
          }
        }
        if (active && changed) {
          setMeta(next);
          void saveMetaCache(next);
        }
      })();
    }
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persist = useCallback(async (next: YouTubePlaylist[]) => {
    setCustomPlaylists(next);
    await saveCustomPlaylists(next);
  }, []);

  const handleAdd = async () => {
    const playlistId = parsePlaylistId(linkInput);
    if (!playlistId) {
      setAddError('Geçerli bir YouTube playlist linki yapıştır.');
      return;
    }
    const duplicate = allPlaylists.some((item) => item.playlistId === playlistId);
    if (duplicate) {
      setAddError('Bu playlist zaten listede var.');
      return;
    }
    await persist([
      ...customPlaylists,
      {
        id: makeCustomPlaylistId(),
        title: 'Özel Playlist',
        channel: 'YouTube',
        playlistId,
        builtin: false,
      },
    ]);
    setLinkInput('');
    setAddError('');
    setAdding(false);
    // Kick off metadata fetch for the new playlist.
    void fetchPlaylistMeta(playlistId).then((result) => {
      if (result) {
        setMeta((prev) => {
          const next = { ...prev, [playlistId]: result };
          void saveMetaCache(next);
          return next;
        });
      }
    });
  };

  const handleRemove = (playlist: YouTubePlaylist) => {
    Alert.alert('Playlist kaldırılsın mı?', 'Yalnızca bu uygulamadan kaldırılır; YouTube’daki listeye dokunulmaz.', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Kaldır',
        style: 'destructive',
        onPress: () => {
          void persist(customPlaylists.filter((item) => item.id !== playlist.id));
        },
      },
    ]);
  };

  const openPlaylist = (playlist: YouTubePlaylist) => {
    const m = meta[playlist.playlistId];
    router.push({
      pathname: '/watch',
      params: {
        list: playlist.playlistId,
        title: m?.title ?? playlist.title,
        channel: m?.channel || playlist.channel,
      },
    });
  };

  const renderCard = (playlist: YouTubePlaylist) => {
    const m = meta[playlist.playlistId];
    const displayTitle = m?.title ?? playlist.title;
    const displayChannel = m?.channel || playlist.channel;
    return (
      <Pressable
        key={playlist.id}
        accessibilityRole="button"
        accessibilityLabel={`${displayTitle} playlistini aç`}
        onPress={() => openPlaylist(playlist)}
        style={({ pressed }) => [
          styles.card,
          { opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <View style={styles.thumbWrap}>
          {m?.thumbnailUrl ? (
            <Image
              source={{ uri: m.thumbnailUrl }}
              style={styles.thumb}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={[styles.thumb, styles.thumbFallback, { backgroundColor: colors.muted }]}>
              <Feather name="youtube" size={26} color={YT_RED} />
            </View>
          )}
          <View style={styles.playOverlay}>
            <View style={styles.playCircle}>
              <Feather name="play" size={18} color="#fff" />
            </View>
          </View>
          <View style={[styles.liveBadge, { backgroundColor: YT_RED }]}>
            <Text style={styles.liveBadgeText}>YouTube</Text>
          </View>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.cardText}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={2}>
              {displayTitle}
            </Text>
            <Text style={[styles.cardChannel, { color: colors.mutedForeground }]} numberOfLines={1}>
              {displayChannel}
            </Text>
          </View>
          {!playlist.builtin && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Playlisti kaldır"
              onPress={() => handleRemove(playlist)}
              hitSlop={8}
              style={styles.removeButton}
            >
              <Feather name="trash-2" size={15} color={colors.mutedForeground} />
            </Pressable>
          )}
          <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: Platform.OS === 'web' ? 16 : insets.top }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 108 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.eyebrow, { color: colors.primary }]}>ÇEVRİMİÇİ İÇERİK</Text>
            <Text style={[styles.title, { color: colors.foreground }]}>Video Dersler</Text>
          </View>
          <View style={[styles.onlinePill, { backgroundColor: colors.accent }]}>
            <View style={[styles.onlineDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.onlineText, { color: colors.primary }]}>İnternet gerekli</Text>
          </View>
        </View>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          KPSS coğrafya playlist'leri — Yunus Hoca öne çıkıyor. Videolar YouTube'da oynatılır.
        </Text>

        <View style={[styles.addBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {adding ? (
            <>
              <TextInput
                value={linkInput}
                onChangeText={(text) => {
                  setLinkInput(text);
                  if (addError) setAddError('');
                }}
                placeholder="youtube.com/playlist?list=…"
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
              />
              {addError ? <Text style={[styles.errorText, { color: colors.destructive }]}>{addError}</Text> : null}
              <View style={styles.addActions}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setAdding(false);
                    setLinkInput('');
                    setAddError('');
                  }}
                  style={[styles.addButton, { backgroundColor: colors.muted }]}
                >
                  <Text style={[styles.addButtonText, { color: colors.foreground }]}>Vazgeç</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => void handleAdd()}
                  style={[styles.addButton, { backgroundColor: colors.primary }]}
                >
                  <Text style={[styles.addButtonText, { color: colors.primaryForeground }]}>Ekle</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={() => setAdding(true)}
              style={styles.addRow}
            >
              <View style={[styles.addIcon, { backgroundColor: YT_RED }]}>
                <Feather name="plus" size={16} color="#fff" />
              </View>
              <Text style={[styles.addRowText, { color: colors.foreground }]}>Kendi playlist linkini ekle</Text>
              <Feather name="link" size={15} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
        ) : (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Öne Çıkan — Yunus Hoca</Text>
            {CURATED_PLAYLISTS.slice(0, 4).map(renderCard)}
            {CURATED_PLAYLISTS.length > 4 && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Diğer Öğretmenler</Text>
                {CURATED_PLAYLISTS.slice(4).map(renderCard)}
              </>
            )}
            {customPlaylists.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Senin Playlistlerin</Text>
                {customPlaylists.map(renderCard)}
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { fontFamily: FONT_FAMILY.bold, fontSize: 11, letterSpacing: 1.4 },
  title: { fontSize: 25, fontWeight: '700', marginTop: 4, letterSpacing: -0.4 },
  subtitle: { fontSize: 12, lineHeight: 18, marginTop: 8, marginBottom: 18 },
  onlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  onlineDot: { width: 7, height: 7, borderRadius: 4 },
  onlineText: { fontFamily: FONT_FAMILY.bold, fontSize: 11, letterSpacing: 0.4 },
  addBox: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 18,
  },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
  addIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addRowText: { flex: 1, fontFamily: FONT_FAMILY.semibold, fontSize: 14 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: FONT_FAMILY.regular,
  },
  errorText: { fontSize: 12, marginTop: 6, fontFamily: FONT_FAMILY.medium },
  addActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 10 },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
  addButtonText: { fontFamily: FONT_FAMILY.semibold, fontSize: 13 },
  sectionTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 15,
    marginTop: 6,
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  card: {
    marginBottom: 16,
  },
  thumbWrap: {
    borderRadius: 14,
    overflow: 'hidden',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    position: 'relative',
  },
  thumb: { width: '100%', height: '100%' },
  thumbFallback: { alignItems: 'center', justifyContent: 'center' },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  liveBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  liveBadgeText: {
    color: '#fff',
    fontFamily: FONT_FAMILY.bold,
    fontSize: 9,
    letterSpacing: 0.8,
  },
  cardBody: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 4 },
  cardText: { flex: 1 },
  cardTitle: {
    fontFamily: FONT_FAMILY.semibold,
    fontSize: 14,
    lineHeight: 19,
  },
  cardChannel: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 12,
    marginTop: 3,
  },
  removeButton: { padding: 6 },
});
