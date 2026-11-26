import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText as Text } from '@/components/AppText';
import { KeyboardAvoidingViewCompat } from '@/components/KeyboardAvoidingViewCompat';
import { PressableScale } from '@/components/PressableScale';
import colors from '@/constants/colors';
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

/**
 * Teachers are configured by playlist id, not by parsing the live channel name:
 * YouTube's oEmbed can spell a channel differently than the curated record.
 */
type Teacher = {
  id: string;
  name: string;
  playlistIds: string[];
};

const TEACHERS: Teacher[] = [
  {
    id: 'yunus',
    name: 'Yunus Hoca',
    playlistIds: [
      'yunus-konu-anlatimi',
      'yunus-genel-tekrar',
      'yunus-soru-cozumu',
      'yunus-deneme-cozumu',
    ],
  },
  {
    id: 'bayram',
    name: 'Bayram Meral',
    playlistIds: ['bayram-meral-2027', 'bayram-meral-turkiye'],
  },
  { id: 'engin', name: 'Engin Eraydın', playlistIds: ['engin-eraydin-2025'] },
  { id: 'turgay', name: 'Turgay Kocakaya', playlistIds: ['turgay-kocakaya-2025'] },
  { id: 'hakan', name: 'Hakan Bileyen', playlistIds: ['hakan-bileyen-osym'] },
];

/** Curated records added later still surface under the first teacher. */
const UNASSIGNED_IDS = CURATED_PLAYLISTS.filter(
  (playlist) => !TEACHERS.some((teacher) => teacher.playlistIds.includes(playlist.id)),
).map((playlist) => playlist.id);

type CollectionTab = 'curated' | 'mine';

const RADIUS = colors.radius;

export default function YouTubeScreen() {
  const theme = useColors();
  const insets = useSafeAreaInsets();
  const [customPlaylists, setCustomPlaylists] = useState<YouTubePlaylist[]>([]);
  const [meta, setMeta] = useState<Record<string, PlaylistMeta>>({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<CollectionTab>('curated');
  const [teacherId, setTeacherId] = useState(TEACHERS[0].id);
  const [teacherSheet, setTeacherSheet] = useState(false);
  const [addSheet, setAddSheet] = useState(false);
  const [linkInput, setLinkInput] = useState('');
  const [addError, setAddError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    void (async () => {
      const [items, cache] = await Promise.all([loadCustomPlaylists(), loadMetaCache()]);
      if (!active) return;

      setCustomPlaylists(items);
      setMeta(cache);
      setLoading(false);

      // Resolve missing playlist metadata lazily, four at a time to stay gentle
      // on the oEmbed endpoint.
      const missing = [...CURATED_PLAYLISTS, ...items]
        .filter((playlist) => !cache[playlist.playlistId])
        .slice(0, 4);
      if (missing.length === 0) return;

      let next = { ...cache };
      let changed = false;
      for (const playlist of missing) {
        const result = await fetchPlaylistMeta(playlist.playlistId);
        if (!active) return;
        if (result) {
          next[playlist.playlistId] = result;
          changed = true;
        }
      }
      if (changed) {
        setMeta(next);
        void saveMetaCache(next);
      }
    })().catch(() => {
      if (active) setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const persist = useCallback(async (next: YouTubePlaylist[]) => {
    await saveCustomPlaylists(next);
    setCustomPlaylists(next);
  }, []);

  const teacher = TEACHERS.find((item) => item.id === teacherId) ?? TEACHERS[0];

  const teacherPlaylists = useMemo(() => {
    const ids =
      teacher.id === TEACHERS[0].id ? [...teacher.playlistIds, ...UNASSIGNED_IDS] : teacher.playlistIds;
    return ids
      .map((id) => CURATED_PLAYLISTS.find((playlist) => playlist.id === id))
      .filter((playlist): playlist is YouTubePlaylist => Boolean(playlist));
  }, [teacher]);

  // Covers for the teacher on screen, so switching teachers never leaves a
  // row without its thumbnail for the rest of the session.
  const requestedMeta = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (loading) return;
    const missing = teacherPlaylists
      .filter((playlist) => !meta[playlist.playlistId] && !requestedMeta.current.has(playlist.playlistId))
      .slice(0, 4);
    if (missing.length === 0) return;

    missing.forEach((playlist) => requestedMeta.current.add(playlist.playlistId));
    void (async () => {
      for (const playlist of missing) {
        const result = await fetchPlaylistMeta(playlist.playlistId);
        if (!result) continue;
        setMeta((prev) => {
          const next = { ...prev, [playlist.playlistId]: result };
          void saveMetaCache(next);
          return next;
        });
      }
    })();
  }, [loading, meta, teacherPlaylists]);

  const hero = teacherPlaylists[0];
  const rest = teacherPlaylists.slice(1);

  const coverFor = (playlist: YouTubePlaylist) => meta[playlist.playlistId]?.thumbnailUrl;

  const openPlaylist = (playlist: YouTubePlaylist) => {
    const live = meta[playlist.playlistId];
    router.push({
      pathname: '/watch',
      params: {
        list: playlist.playlistId,
        title: live?.title ?? playlist.title,
        channel: live?.channel || playlist.channel,
      },
    });
  };

  const closeAddSheet = () => {
    if (saving) return;
    setAddSheet(false);
    setAddError('');
  };

  const handleAdd = async () => {
    if (saving) return;
    const playlistId = parsePlaylistId(linkInput);
    if (!playlistId) {
      setAddError('Geçerli bir YouTube playlist bağlantısı gir.');
      return;
    }
    const duplicate = [...CURATED_PLAYLISTS, ...customPlaylists].some(
      (item) => item.playlistId === playlistId,
    );
    if (duplicate) {
      setAddError('Bu playlist zaten listede.');
      return;
    }

    setSaving(true);
    try {
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
      setAddSheet(false);
      setTab('mine');
      // Metadata arrives in the background; a failure here is not a save failure.
      void fetchPlaylistMeta(playlistId).then((result) => {
        if (!result) return;
        setMeta((prev) => {
          const next = { ...prev, [playlistId]: result };
          void saveMetaCache(next);
          return next;
        });
      });
    } catch {
      setAddError('Playlist kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = (playlist: YouTubePlaylist) => {
    Alert.alert(
      'Playlist kaldırılsın mı?',
      'Yalnızca bu uygulamadan kaldırılır; YouTube’daki listeye dokunulmaz.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Kaldır',
          style: 'destructive',
          onPress: () => {
            void persist(customPlaylists.filter((item) => item.id !== playlist.id)).catch(() => {
              Alert.alert('Kaldırılamadı', 'Playlist listeden çıkarılamadı. Tekrar dene.');
            });
          },
        },
      ],
    );
  };

  const renderCover = (playlist: YouTubePlaylist, sized: 'hero' | 'row') => {
    const uri = coverFor(playlist);
    const box = sized === 'hero' ? styles.heroCover : styles.rowCover;
    return (
      <View style={[box, { backgroundColor: theme.muted }]}>
        {uri ? (
          <Image source={{ uri }} style={styles.coverImage} contentFit="cover" transition={180} />
        ) : (
          <Feather name="list" size={sized === 'hero' ? 22 : 18} color={theme.mutedForeground} />
        )}
      </View>
    );
  };

  const renderRow = (playlist: YouTubePlaylist, personal = false) => {
    const live = meta[playlist.playlistId];
    const title = live?.title ?? playlist.title;
    const channel = live?.channel || playlist.channel;
    return (
      <View key={playlist.id} style={styles.row}>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={`${title} playlistini aç`}
          onPress={() => openPlaylist(playlist)}
          scaleTo={0.985}
          style={styles.rowMain}
        >
          {renderCover(playlist, 'row')}
          <View style={styles.rowText}>
            <Text style={[styles.rowTitle, { color: theme.foreground }]} numberOfLines={2}>
              {title}
            </Text>
            <Text style={[styles.rowChannel, { color: theme.mutedForeground }]} numberOfLines={1}>
              {channel}
            </Text>
          </View>
        </PressableScale>
        {personal ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${title} için seçenekler`}
            onPress={() => handleRemove(playlist)}
            hitSlop={8}
            style={styles.rowMenu}
          >
            <Feather name="more-vertical" size={18} color={theme.mutedForeground} />
          </Pressable>
        ) : null}
      </View>
    );
  };

  const heroCard = hero ? (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${meta[hero.playlistId]?.title ?? hero.title} playlistini aç`}
      onPress={() => openPlaylist(hero)}
      haptic
      style={[styles.hero, { backgroundColor: theme.accent }]}
    >
      <View
        pointerEvents="none"
        style={[styles.plateCorner, styles.plateCornerOuter, { borderColor: theme.primary }]}
      />
      <View
        pointerEvents="none"
        style={[styles.plateCorner, styles.plateCornerInner, { borderColor: theme.primary }]}
      />

      <View style={styles.heroTop}>
        {renderCover(hero, 'hero')}
        <View style={styles.heroCopy}>
          <Text
            style={[styles.heroTitle, { color: theme.accentForeground }]}
            numberOfLines={4}
          >
            {meta[hero.playlistId]?.title ?? hero.title}
          </Text>
        </View>
      </View>

      <View style={styles.heroFoot}>
        <Text style={[styles.heroChannel, { color: theme.primary }]} numberOfLines={1}>
          {meta[hero.playlistId]?.channel || hero.channel}
        </Text>
        <View style={[styles.playBadge, { backgroundColor: theme.primary }]}>
          <Feather name="play" size={17} color={theme.primaryForeground} style={styles.playGlyph} />
        </View>
      </View>
    </PressableScale>
  ) : null;

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: theme.background,
          paddingTop: Platform.OS === 'web' ? 16 : insets.top,
        },
      ]}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 108 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.foreground }]}>Video dersler</Text>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Playlist ekle"
            haptic
            onPress={() => setAddSheet(true)}
            style={styles.addAction}
          >
            <Feather name="plus" size={16} color={theme.primary} />
            <Text style={[styles.addActionText, { color: theme.primary }]}>Playlist ekle</Text>
          </PressableScale>
        </View>
        <Text style={[styles.subtitle, { color: theme.mutedForeground }]}>
          Videolar YouTube’da oynatılır.
        </Text>

        <View style={[styles.segments, { backgroundColor: theme.muted }]}>
          {(
            [
              { key: 'curated' as const, label: 'Hazır listeler' },
              {
                key: 'mine' as const,
                label:
                  customPlaylists.length > 0
                    ? `Listelerim (${customPlaylists.length})`
                    : 'Listelerim',
              },
            ]
          ).map((item) => {
            const active = tab === item.key;
            return (
              <Pressable
                key={item.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                onPress={() => setTab(item.key)}
                style={[
                  styles.segment,
                  active && { backgroundColor: theme.accent },
                ]}
              >
                <Text
                  style={[
                    styles.segmentText,
                    { color: active ? theme.accentForeground : theme.mutedForeground },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {loading ? (
          <ActivityIndicator color={theme.primary} style={styles.loader} />
        ) : tab === 'curated' ? (
          <>
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={`Öğretmen: ${teacher.name}. Değiştir`}
              onPress={() => setTeacherSheet(true)}
              style={styles.teacherRow}
            >
              <Text style={[styles.teacherName, { color: theme.foreground }]}>{teacher.name}</Text>
              <Text style={[styles.teacherCount, { color: theme.mutedForeground }]}>
                {teacherPlaylists.length} playlist
              </Text>
              <View style={styles.spacer} />
              <Feather name="chevron-down" size={17} color={theme.mutedForeground} />
            </PressableScale>

            {heroCard}

            <View style={styles.rows}>{rest.map((playlist) => renderRow(playlist))}</View>
          </>
        ) : customPlaylists.length > 0 ? (
          <View style={styles.rows}>
            {customPlaylists.map((playlist) => renderRow(playlist, true))}
          </View>
        ) : (
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: theme.muted }]}>
              <Feather name="list" size={22} color={theme.mutedForeground} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.foreground }]}>
              Henüz playlist eklemedin
            </Text>
            <PressableScale
              accessibilityRole="button"
              onPress={() => setAddSheet(true)}
              haptic
              style={[styles.emptyButton, { backgroundColor: theme.primary }]}
            >
              <Text style={[styles.emptyButtonText, { color: theme.primaryForeground }]}>
                Playlist ekle
              </Text>
            </PressableScale>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={teacherSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setTeacherSheet(false)}
      >
        <View style={styles.sheetRoot}>
          <Pressable
            accessibilityLabel="Öğretmen panelini kapat"
            style={[StyleSheet.absoluteFill, { backgroundColor: theme.overlay }]}
            onPress={() => setTeacherSheet(false)}
          />
          <View
            style={[
              styles.sheet,
              { backgroundColor: theme.card, paddingBottom: insets.bottom + 20 },
            ]}
          >
            <View style={[styles.sheetGrabber, { backgroundColor: theme.border }]} />
            <Text style={[styles.sheetTitle, { color: theme.foreground }]}>Öğretmen</Text>
            {TEACHERS.map((item) => {
              const selected = item.id === teacher.id;
              const count = item.playlistIds.filter((id) =>
                CURATED_PLAYLISTS.some((playlist) => playlist.id === id),
              ).length;
              return (
                <PressableScale
                  key={item.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => {
                    setTeacherId(item.id);
                    setTeacherSheet(false);
                  }}
                  style={[
                    styles.teacherOption,
                    selected && { backgroundColor: theme.accent },
                  ]}
                >
                  <Text
                    style={[
                      styles.teacherOptionName,
                      { color: selected ? theme.accentForeground : theme.foreground },
                    ]}
                  >
                    {item.name}
                  </Text>
                  <Text style={[styles.teacherOptionCount, { color: theme.mutedForeground }]}>
                    {count} playlist
                  </Text>
                  {selected ? (
                    <Feather name="check" size={17} color={theme.primary} />
                  ) : null}
                </PressableScale>
              );
            })}
          </View>
        </View>
      </Modal>

      <Modal
        visible={addSheet}
        transparent
        animationType="slide"
        onRequestClose={closeAddSheet}
      >
        <View style={styles.sheetRoot}>
          <Pressable
            accessibilityLabel="Ekleme panelini kapat"
            style={[StyleSheet.absoluteFill, { backgroundColor: theme.overlay }]}
            onPress={closeAddSheet}
          />
          <KeyboardAvoidingViewCompat behavior="padding">
            <View
              style={[
                styles.sheet,
                { backgroundColor: theme.card, paddingBottom: insets.bottom + 20 },
              ]}
            >
              <View style={[styles.sheetGrabber, { backgroundColor: theme.border }]} />
              <View style={styles.sheetHead}>
                <Text style={[styles.sheetTitle, { color: theme.foreground }]}>Playlist ekle</Text>
                <Pressable
                  accessibilityLabel="Paneli kapat"
                  onPress={closeAddSheet}
                  hitSlop={10}
                >
                  <Feather name="x" size={20} color={theme.mutedForeground} />
                </Pressable>
              </View>

              <Text style={[styles.fieldLabel, { color: theme.secondaryForeground }]}>
                YouTube playlist bağlantısı
              </Text>
              <TextInput
                value={linkInput}
                onChangeText={(text) => {
                  setLinkInput(text);
                  if (addError) setAddError('');
                }}
                placeholder="https://youtube.com/playlist?list=…"
                placeholderTextColor={theme.mutedForeground}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                autoFocus
                style={[
                  styles.input,
                  {
                    color: theme.foreground,
                    borderColor: addError ? theme.destructive : theme.input,
                    backgroundColor: theme.background,
                  },
                ]}
              />
              {addError ? (
                <Text style={[styles.errorText, { color: theme.destructive }]}>{addError}</Text>
              ) : null}

              <PressableScale
                accessibilityRole="button"
                disabled={saving}
                onPress={() => void handleAdd()}
                style={[
                  styles.primaryButton,
                  { backgroundColor: saving ? theme.muted : theme.primary },
                ]}
              >
                {saving ? (
                  <ActivityIndicator color={theme.mutedForeground} />
                ) : (
                  <Text style={[styles.primaryButtonText, { color: theme.primaryForeground }]}>
                    Playlist ekle
                  </Text>
                )}
              </PressableScale>
            </View>
          </KeyboardAvoidingViewCompat>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 8 },

  header: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 },
  title: { flex: 1, fontSize: 25, fontWeight: '700', letterSpacing: -0.4 },
  addAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: 44,
    paddingLeft: 6,
  },
  addActionText: { fontSize: 13, fontWeight: '600', letterSpacing: -0.1 },
  subtitle: { marginTop: 4, fontSize: 12, fontWeight: '400' },

  segments: {
    flexDirection: 'row',
    borderRadius: RADIUS,
    padding: 3,
    marginTop: 14,
    marginBottom: 6,
  },
  segment: {
    flex: 1,
    minHeight: 38,
    borderRadius: RADIUS - 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  segmentText: { fontSize: 13, fontWeight: '600', letterSpacing: -0.1 },

  teacherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    marginTop: 6,
  },
  teacherName: { fontSize: 15, fontWeight: '600', letterSpacing: -0.2 },
  teacherCount: { fontSize: 12, fontWeight: '500' },
  spacer: { flex: 1 },

  hero: {
    borderRadius: RADIUS,
    padding: 16,
    marginTop: 4,
  },
  heroTop: { flexDirection: 'row', gap: 14 },
  heroCover: {
    width: 144,
    height: 81,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverImage: { width: '100%', height: '100%' },
  heroCopy: { flex: 1, minWidth: 0 },
  heroTitle: { fontSize: 15, lineHeight: 19, fontWeight: '600', letterSpacing: -0.2 },
  heroFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
  },
  heroChannel: { flex: 1, fontSize: 13, fontWeight: '500' },
  playBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playGlyph: { marginLeft: 2 },
  plateCorner: {
    position: 'absolute',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    opacity: 0.32,
  },
  plateCornerOuter: { top: 7, left: 7, width: 11, height: 11 },
  plateCornerInner: { top: 12, left: 12, width: 6, height: 6 },

  rows: { marginTop: 6 },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  rowCover: {
    width: 96,
    height: 54,
    borderRadius: 10,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 14, lineHeight: 19, fontWeight: '600', letterSpacing: -0.1 },
  rowChannel: { marginTop: 2, fontSize: 12.5, fontWeight: '400' },
  rowMenu: {
    width: 40,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loader: { marginTop: 40 },

  empty: { alignItems: 'flex-start', paddingTop: 44 },
  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { marginTop: 14, fontSize: 15, fontWeight: '600', letterSpacing: -0.2 },
  emptyButton: {
    marginTop: 16,
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyButtonText: { fontSize: 13.5, fontWeight: '600' },

  sheetRoot: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: RADIUS,
    borderTopRightRadius: RADIUS,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  sheetGrabber: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    marginBottom: 12,
  },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sheetTitle: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3, marginBottom: 4 },

  teacherOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 52,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginTop: 6,
  },
  teacherOptionName: { flex: 1, fontSize: 15, fontWeight: '600', letterSpacing: -0.2 },
  teacherOptionCount: { fontSize: 12, fontWeight: '500' },

  fieldLabel: { marginTop: 14, marginBottom: 8, fontSize: 12, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '400',
  },
  errorText: { marginTop: 8, fontSize: 12, fontWeight: '500' },
  primaryButton: {
    marginTop: 16,
    minHeight: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { fontSize: 15, fontWeight: '600' },
});
