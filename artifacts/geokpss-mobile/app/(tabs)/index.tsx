import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as ScreenOrientation from 'expo-screen-orientation';
import React, { useEffect, useMemo, useState } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LayerId, LAYERS, LAYER_SOURCES, MAP_ITEMS, MapItem, MAP_COLORS, TOPIC_DETAILS } from '@/data/geography';
import { PROVINCE_NOTES } from '@/data/province-notes';
import { PROVINCES, TurkeyMap } from '@/components/TurkeyMap';
import { AppText as Text } from '@/components/AppText';
import { GeographyLayerIcon } from '@/components/GeographyLayerIcon';
import { PressableScale } from '@/components/PressableScale';
import { KeyboardAvoidingViewCompat } from '@/components/KeyboardAvoidingViewCompat';
import { FONT_FAMILY } from '@/constants/typography';
import { useAppTheme } from '@/context/ThemeContext';
import { useStudy } from '@/context/StudyContext';
import { useColors } from '@/hooks/useColors';
import { speakTurkish } from '@/utils/speech';
import { googleMapsSearchUrl } from '@/utils/maps';

function itemMatchesFilter(item: MapItem, layer: LayerId, filter: string): boolean {
  if (item.layer !== layer) return false;
  if (filter === 'all') return true;
  if (filter === 'volcanic' && item.subtype === 'volcanicLake') return true;
  return item.subtype === filter || item.tags?.includes(filter) === true;
}

export default function MapScreen() {
  const colors = useColors();
  const { isDark, toggleTheme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { layer: layerParam, itemId: itemIdParam, province: provinceParam } = useLocalSearchParams<{ layer?: string; itemId?: string; province?: string }>();
  const [layerId, setLayerId] = useState<LayerId>('provinces');
  const [filterId, setFilterId] = useState('all');
  const [selectedProvince, setSelectedProvince] = useState<string | null>('Ankara');
  const [selectedItem, setSelectedItem] = useState<MapItem | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [mapLandscape, setMapLandscape] = useState(false);

  const closeFullscreen = () => {
    setFullscreenOpen(false);
    setMapLandscape(false);
    if (Platform.OS !== 'web') {
      void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    }
  };

  const toggleMapOrientation = async () => {
    if (Platform.OS === 'web') return;
    const next = !mapLandscape;
    setMapLandscape(next);
    try {
      await ScreenOrientation.lockAsync(
        next ? ScreenOrientation.OrientationLock.LANDSCAPE : ScreenOrientation.OrientationLock.PORTRAIT_UP,
      );
    } catch {
      setMapLandscape(!next);
    }
  };
  const [flashcard, setFlashcard] = useState<{ kind: 'item'; item: MapItem } | { kind: 'province'; name: string } | null>(null);
  const [flashcardFlipped, setFlashcardFlipped] = useState(false);
  const [searchText, setSearchText] = useState('');
  const { notes, recordQuizAnswer } = useStudy();

  useEffect(() => {
    if (layerParam && LAYERS.some((layer) => layer.id === layerParam)) {
      setLayerId(layerParam as LayerId);
      setFilterId('all');
    }
  }, [layerParam]);

  useEffect(() => {
    if (!itemIdParam) return;
    const item = MAP_ITEMS.find((mapItem) => mapItem.id === itemIdParam);
    if (!item) return;
    setLayerId(item.layer);
    setFilterId('all');
    setSelectedProvince(item.provinces[0] ?? null);
    setSelectedItem(item);
  }, [itemIdParam]);

  useEffect(() => {
    if (!provinceParam || !PROVINCES.some((province) => province.name === provinceParam)) return;
    setLayerId('provinces');
    setFilterId('all');
    setSelectedItem(null);
    setSelectedProvince(provinceParam);
  }, [provinceParam]);

  const activeLayer = LAYERS.find((layer) => layer.id === layerId) ?? LAYERS[0];
  const visibleItems = useMemo(
    () => MAP_ITEMS.filter((item) => itemMatchesFilter(item, layerId, filterId)),
    [layerId, filterId],
  );
  const layerCounts = useMemo(
    () =>
      new Map(
        LAYERS.map((layer) => [
          layer.id,
          layer.id === 'provinces' ? PROVINCES.length : MAP_ITEMS.filter((item) => item.layer === layer.id).length,
        ]),
      ),
    [],
  );
  const filterCounts = useMemo(
    () => new Map(activeLayer.filters.map((filter) => [filter.id, MAP_ITEMS.filter((item) => itemMatchesFilter(item, layerId, filter.id)).length])),
    [layerId, activeLayer],
  );
  const matchingItems = useMemo(
    () => {
      const query = searchText.trim().toLocaleLowerCase('tr');
      if (!query) return [];
      return MAP_ITEMS.filter((item) =>
        `${item.name} ${item.subtypeLabel} ${item.provinces.join(' ')} ${item.description}`
          .toLocaleLowerCase('tr')
          .includes(query),
      ).slice(0, 5);
    },
    [searchText],
  );
  const matchingProvinces = useMemo(
    () => {
      const query = searchText.trim().toLocaleLowerCase('tr');
      if (!query) return [];
      return PROVINCES.filter((province) =>
        `${province.name} ${province.plate} ${province.region}`.toLocaleLowerCase('tr').includes(query),
      ).slice(0, 6);
    },
    [searchText],
  );
  const matchingTopics = useMemo(
    () => {
      const query = searchText.trim().toLocaleLowerCase('tr');
      if (!query) return [];
      return TOPIC_DETAILS.filter((topic) =>
        `${topic.title} ${topic.subtitle}`.toLocaleLowerCase('tr').includes(query),
      ).slice(0, 4);
    },
    [searchText],
  );
  const matchingNotes = useMemo(
    () => {
      const query = searchText.trim().toLocaleLowerCase('tr');
      if (!query) return [];
      return notes.filter((note) =>
        `${note.title} ${note.body} ${note.category}`.toLocaleLowerCase('tr').includes(query),
      ).slice(0, 4);
    },
    [searchText, notes],
  );
  const provinceData = PROVINCES.find((province) => province.name === selectedProvince);
  const provinceItems = MAP_ITEMS.filter((item) =>
    item.provinces.includes(selectedProvince ?? '') && (layerId === 'provinces' || item.layer === layerId),
  );

  const chooseLayer = (id: LayerId) => {
    setLayerId(id);
    setFilterId('all');
    setSelectedItem(null);
    void Haptics.selectionAsync();
  };
  const renderFilterChip = (filter: { id: string; label: string }) => {
    const active = filterId === filter.id;
    const count = filterCounts.get(filter.id) ?? 0;
    return (
      <Pressable
        key={filter.id}
        onPress={() => chooseFilter(filter.id)}
        style={[
          styles.filterChip,
          {
            backgroundColor: active ? colors.primary : colors.card,
            borderColor: active ? colors.primary : colors.border,
          },
        ]}
      >
        <Text style={[styles.filterLabel, { color: active ? colors.primaryForeground : colors.foreground }]}>{filter.label}</Text>
        <Text style={[styles.filterCount, { color: active ? colors.primaryForeground : colors.mutedForeground, opacity: active ? 0.85 : 0.65 }]}>
          {count}
        </Text>
      </Pressable>
    );
  };

  const chooseFilter = (nextFilterId: string) => {
    setFilterId(nextFilterId);
    if (nextFilterId === 'all') {
      setSelectedItem(null);
    } else {
      const firstMatch = MAP_ITEMS.find((item) => itemMatchesFilter(item, layerId, nextFilterId)) ?? null;
      setSelectedItem(firstMatch);
      if (firstMatch?.provinces[0]) {
        setSelectedProvince(firstMatch.provinces[0]);
      }
    }
    void Haptics.selectionAsync();
  };
  const chooseProvince = (name: string) => {
    setSelectedProvince(name);
    setSelectedItem(null);
    void Haptics.selectionAsync();
  };
  const chooseSearchProvince = (name: string) => {
    chooseLayer('provinces');
    chooseProvince(name);
    setSearchOpen(false);
    setSearchText('');
  };
  const chooseSearchItem = (item: MapItem) => {
    chooseLayer(item.layer);
    setFilterId('all');
    setSelectedProvince(item.provinces[0] ?? null);
    setSelectedItem(item);
    setSearchOpen(false);
    setSearchText('');
  };
  const openFlashcard = (card: NonNullable<typeof flashcard>) => {
    setFlashcard(card);
    setFlashcardFlipped(false);
    void Haptics.selectionAsync();
  };
  const answerFlashcard = (known: boolean) => {
    if (!flashcard) return;
    if (flashcard.kind === 'item') {
      recordQuizAnswer({
        layer: flashcard.item.layer,
        targetId: flashcard.item.id,
        targetName: flashcard.item.name,
        isCorrect: known,
      });
    } else {
      recordQuizAnswer({
        layer: 'provinces',
        targetId: flashcard.name,
        targetName: flashcard.name,
        isCorrect: known,
      });
    }
    void Haptics.notificationAsync(known ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning);
    setFlashcard(null);
    setFlashcardFlipped(false);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: Platform.OS === 'web' ? 16 : insets.top }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 108 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.brand}>
            <View style={[styles.logo, { backgroundColor: colors.primary, borderColor: colors.border }]}>
              <Feather name="map" size={21} color={colors.primaryForeground} />
              <View style={[styles.logoBadge, { backgroundColor: colors.card, borderColor: colors.primary }]}>
                <Feather name="crosshair" size={9} color={colors.primary} />
              </View>
            </View>
            <View>
              <Text style={[styles.brandName, { color: colors.primary }]}>GeoKPSS</Text>
              <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>COĞRAFYA ATLASI</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <Pressable accessibilityLabel="Haritada ara" onPress={() => setSearchOpen(true)} style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="search" size={19} color={colors.foreground} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isDark ? 'Açık temaya geç' : 'Koyu temaya geç'}
              testID="toggle-theme"
              onPress={toggleTheme}
              style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Feather name={isDark ? 'sun' : 'moon'} size={17} color={colors.foreground} />
            </Pressable>
            <Pressable accessibilityLabel="Pro planı görüntüle" onPress={() => router.push('/pro')} style={[styles.iconButton, { backgroundColor: colors.accent, borderColor: colors.accent }]}>
              <Feather name="star" size={18} color={colors.primary} />
            </Pressable>
          </View>
        </View>

        <View style={styles.headlineBlock}>
          <Text style={[styles.headline, { color: colors.foreground }]}>Türkiye’yi haritada keşfet.</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>KPSS coğrafyasını yerinde öğren, bağlantıları aklında tut.</Text>
          <View style={styles.heroPills}>
            <View style={[styles.heroPill, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="layers" size={12} color={colors.primary} />
              <Text style={[styles.heroPillText, { color: colors.foreground }]}>{LAYERS.length} Katman</Text>
            </View>
            <View style={[styles.heroPill, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="compass" size={12} color={colors.primary} />
              <Text style={[styles.heroPillText, { color: colors.foreground }]}>{MAP_ITEMS.length} Coğrafi Özellik</Text>
            </View>
            <View style={[styles.heroPill, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="map-pin" size={12} color={colors.primary} />
              <Text style={[styles.heroPillText, { color: colors.foreground }]}>81 İl Atlası</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeading}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Harita katmanları</Text>
            <Text style={[styles.sectionHint, { color: colors.mutedForeground }]}>İstediğin konuyu seç, haritada incele.</Text>
          </View>
          <Text style={[styles.countBadge, { color: colors.primary, backgroundColor: colors.accent }]}>{LAYERS.length} KATMAN</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.layerRow}>
          {LAYERS.map((layer) => {
            const active = layer.id === layerId;
            return (
              <PressableScale
                key={layer.id}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                testID={`layer-${layer.id}`}
                onPress={() => chooseLayer(layer.id)}
                style={[styles.layerChip, { backgroundColor: active ? colors.primary : colors.card, borderColor: active ? colors.primary : colors.border }]}
              >
                <View style={[styles.layerIconBadge, { backgroundColor: active ? `${colors.primaryForeground}22` : colors.accent }]}>
                  <GeographyLayerIcon
                    type={layer.id}
                    size={18}
                    color={active ? colors.primaryForeground : colors.primary}
                    accentColor={active ? colors.accent : colors.accentForeground}
                  />
                </View>
                <Text style={[styles.layerLabel, { color: active ? colors.primaryForeground : colors.foreground }]}>{layer.label}</Text>
                <View style={[styles.layerCountPill, { backgroundColor: active ? `${colors.primaryForeground}22` : colors.muted }]}>
                  <Text style={[styles.layerCount, { color: active ? colors.primaryForeground : colors.mutedForeground }]}>
                    {layerCounts.get(layer.id) ?? 0}
                  </Text>
                </View>
              </PressableScale>
            );
          })}
        </ScrollView>

        {activeLayer.filters.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {activeLayer.filters.map((filter) => {
              const active = filterId === filter.id;
              const count = filterCounts.get(filter.id) ?? 0;
              return (
                <PressableScale
                  key={filter.id}
                  onPress={() => chooseFilter(filter.id)}
                  style={[styles.filterChip, { backgroundColor: active ? colors.accent : 'transparent', borderColor: active ? colors.accent : colors.border }]}
                >
                  <Text style={[styles.filterLabel, { color: active ? colors.primary : colors.mutedForeground }]}>{filter.label}</Text>
                  <Text style={[styles.filterCount, { color: active ? colors.primary : colors.mutedForeground, opacity: active ? 0.7 : 0.55 }]}>{count}</Text>
                </PressableScale>
              );
            })}
          </ScrollView>
        )}

        <View style={[styles.mapCard, { backgroundColor: colors.card, shadowColor: colors.foreground }]}>
          <View style={styles.mapCardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.mapTitle, { color: colors.foreground }]}>
                {activeLayer.label} haritası
                {filterId !== 'all' ? ` · ${activeLayer.filters.find((f) => f.id === filterId)?.label ?? ''}` : ''}
              </Text>
              <Text style={[styles.mapSubTitle, { color: colors.mutedForeground }]}>{activeLayer.description}</Text>
            </View>
            <View style={[styles.liveTag, { backgroundColor: colors.accent }]}>
              <View style={[styles.liveDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.liveText, { color: colors.primary }]}>{layerId === 'provinces' ? '81 İL' : `${visibleItems.length} ÖZELLİK`}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Haritayı tam ekran aç"
              onPress={() => setFullscreenOpen(true)}
              style={[styles.fullscreenBtn, { backgroundColor: colors.primary }]}
              testID="open-fullscreen-map"
            >
              <Feather name="maximize-2" size={13} color={colors.primaryForeground} />
              <Text style={[styles.fullscreenBtnText, { color: colors.primaryForeground }]}>Tam ekran</Text>
            </Pressable>
          </View>
          <TurkeyMap
            layer={layerId}
            items={visibleItems}
            selectedProvince={selectedProvince}
            selectedItemId={selectedItem?.id}
            onSelectProvince={chooseProvince}
            onSelectItem={(item) => {
              setSelectedItem(item);
              void Haptics.selectionAsync();
            }}
            highlightProvinces={selectedItem?.provinces}
            onToggleFullscreen={() => setFullscreenOpen(true)}
          />
          {layerId !== 'provinces' && filterId !== 'all' && visibleItems.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.fullscreenItemChips}>
              {visibleItems.map((item) => {
                const active = selectedItem?.id === item.id;
                const itemColor = MAP_COLORS[item.subtype] ?? colors.primary;
                return (
                  <PressableScale
                    key={item.id}
                    onPress={() => {
                      setSelectedItem(item);
                      setSelectedProvince(item.provinces[0] ?? null);
                      void Haptics.selectionAsync();
                    }}
                    style={[
                      styles.fullscreenItemChip,
                      {
                        backgroundColor: active ? itemColor : colors.muted,
                        borderColor: active ? itemColor : colors.border,
                      },
                    ]}
                  >
                    <View style={[styles.liveDot, { backgroundColor: active ? colors.primaryForeground : itemColor }]} />
                    <Text style={[styles.fullscreenItemChipText, { color: active ? colors.primaryForeground : colors.foreground }]}>
                      {item.name}
                    </Text>
                  </PressableScale>
                );
              })}
            </ScrollView>
          )}
          <Text style={[styles.mapFootnote, { color: colors.mutedForeground }]}>Haritaya dokun · iki parmağınla yakınlaştır · tam ekran incele</Text>
          <Text style={[styles.attribution, { color: colors.mutedForeground }]}>Sınır geometrileri: OpenStreetMap katkıcıları · ODbL</Text>
        </View>

        {selectedItem ? (
          <Animated.View key={selectedItem.id} entering={FadeInDown.duration(200)} style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.detailTop}>
              <View style={[styles.detailIcon, { backgroundColor: `${MAP_COLORS[selectedItem.subtype] ?? colors.primary}22` }]}>
                <Feather name="map-pin" size={17} color={MAP_COLORS[selectedItem.subtype] ?? colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.detailTitle, { color: colors.foreground }]}>{selectedItem.name}</Text>
                <Text style={[styles.detailSub, { color: colors.mutedForeground }]}>{selectedItem.subtypeLabel} · {selectedItem.provinces.join(' / ')}</Text>
              </View>
              <Pressable accessibilityLabel="İsmi seslendir" onPress={() => void speakTurkish(`${selectedItem.name}. ${selectedItem.provinces.join(', ')}`)} hitSlop={8}>
                <Feather name="volume-2" size={17} color={colors.mutedForeground} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Google Haritalar'da aç"
                onPress={() => void Linking.openURL(googleMapsSearchUrl(`${selectedItem.name} ${selectedItem.provinces[0] ?? ''}`.trim()))}
                hitSlop={8}
              >
                <Feather name="external-link" size={16} color={colors.mutedForeground} />
              </Pressable>
              <Pressable accessibilityLabel="Seçimi temizle" onPress={() => setSelectedItem(null)} hitSlop={10}>
                <Feather name="x" size={19} color={colors.mutedForeground} />
              </Pressable>
            </View>
            {selectedItem.provinces.length > 1 && (
              <View style={styles.provinceChips}>
                {selectedItem.provinces.map((province) => (
                  <View key={province} style={[styles.provinceChip, { backgroundColor: colors.accent, borderColor: colors.border }]}>
                    <Text style={[styles.provinceChipText, { color: colors.accentForeground }]}>{province}</Text>
                  </View>
                ))}
              </View>
            )}
            <Text style={[styles.detailBody, { color: colors.foreground }]}>{selectedItem.description}</Text>
            <View style={styles.statChips}>
              {selectedItem.elevation && (
                <View style={[styles.statChip, { backgroundColor: colors.muted }]}>
                  <Feather name="trending-up" size={12} color={colors.primary} />
                  <Text style={[styles.statChipText, { color: colors.foreground }]}>{selectedItem.elevation}</Text>
                </View>
              )}
              <View style={[styles.statChip, { backgroundColor: colors.muted }]}>
                <Feather name="map-pin" size={12} color={colors.primary} />
                <Text style={[styles.statChipText, { color: colors.foreground }]}>{selectedItem.provinces.length} il</Text>
              </View>
              <View style={[styles.statChip, { backgroundColor: colors.muted }]}>
                <Feather name="layers" size={12} color={colors.primary} />
                <Text style={[styles.statChipText, { color: colors.foreground }]} numberOfLines={1}>{selectedItem.subtypeLabel}</Text>
              </View>
            </View>
            {selectedItem.examTip && (
              <View style={[styles.examTip, { backgroundColor: colors.accent }]}>
                <Feather name="bookmark" size={15} color={colors.primary} />
                <Text style={[styles.examTipText, { color: colors.accentForeground }]}>{selectedItem.examTip}</Text>
              </View>
            )}
            <Text style={[styles.sourceText, { color: colors.mutedForeground }]}>
              Kaynak: {selectedItem.source ?? LAYER_SOURCES[selectedItem.layer]}
            </Text>
            <View style={styles.detailActions}>
              <PressableScale
                accessibilityRole="button"
                onPress={() => openFlashcard({ kind: 'item', item: selectedItem })}
                style={[styles.detailCard2, { backgroundColor: colors.accent }]}
                testID="flashcard-from-item"
              >
                <Feather name="credit-card" size={15} color={colors.primary} />
                <Text style={[styles.noteFromMapText, { color: colors.primary }]} numberOfLines={1}>Kart</Text>
              </PressableScale>
              <PressableScale
                accessibilityRole="button"
                onPress={() => router.push({ pathname: '/quiz', params: { mode: selectedItem.layer } })}
                style={[styles.detailQuiz, { backgroundColor: colors.primary }]}
                testID="quiz-from-item"
              >
                <Feather name="target" size={15} color={colors.primaryForeground} />
                <Text style={[styles.detailQuizText, { color: colors.primaryForeground }]} numberOfLines={1}>Quiz Çöz</Text>
              </PressableScale>
              <PressableScale
                accessibilityRole="button"
                onPress={() => router.push({ pathname: '/notes', params: { create: '1', itemId: selectedItem.id } })}
                style={[styles.noteFromMap, { backgroundColor: colors.accent }]}
                testID="create-note-from-map"
              >
                <Feather name="book-open" size={15} color={colors.primary} />
                <Text style={[styles.noteFromMapText, { color: colors.primary }]} numberOfLines={1}>
                  Not Ekle{notes.some((note) => note.relatedItemId === selectedItem.id) ? ` (${notes.filter((note) => note.relatedItemId === selectedItem.id).length})` : ''}
                </Text>
              </PressableScale>
            </View>
          </Animated.View>
        ) : selectedProvince ? (
          <Animated.View key={selectedProvince} entering={FadeInDown.duration(200)} style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.detailTop}>
              <View style={[styles.detailIcon, { backgroundColor: colors.accent }]}>
                <Feather name="map-pin" size={17} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.detailTitle, { color: colors.foreground }]}>{selectedProvince}</Text>
                <Text style={[styles.detailSub, { color: colors.mutedForeground }]}>
                  {provinceData ? `${String(provinceData.plate).padStart(2, '0')} plaka · ${provinceData.region}` : 'İl bilgisi'}
                </Text>
              </View>
              <Pressable accessibilityLabel="İsmi seslendir" onPress={() => void speakTurkish(selectedProvince)} hitSlop={8}>
                <Feather name="volume-2" size={17} color={colors.mutedForeground} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Google Haritalar'da aç"
                onPress={() => void Linking.openURL(googleMapsSearchUrl(selectedProvince))}
                hitSlop={8}
              >
                <Feather name="external-link" size={16} color={colors.mutedForeground} />
              </Pressable>
              <Pressable accessibilityLabel="Seçimi temizle" onPress={() => setSelectedProvince(null)} hitSlop={10}>
                <Feather name="x" size={19} color={colors.mutedForeground} />
              </Pressable>
            </View>
            <Text style={[styles.detailBody, { color: colors.foreground }]}>
              {PROVINCE_NOTES[selectedProvince] ??
                (provinceData
                  ? `${selectedProvince}, ${provinceData.region} bölgesinde yer alır (${String(provinceData.plate).padStart(2, '0')} plaka). Haritadaki renkli işaretlere dokunarak bu ildeki coğrafi özellikleri inceleyebilirsin.`
                  : 'Haritadaki renkli işaretlere dokunarak bu ildeki coğrafi özellikleri inceleyebilirsin.')}
            </Text>
            {provinceItems.length > 0 && (
              <View style={styles.relatedList}>
                <Text style={[styles.relatedHeading, { color: colors.mutedForeground }]}>BU İLDE ÖNE ÇIKANLAR</Text>
                <View style={styles.relatedChips}>
                  {provinceItems.slice(0, 8).map((item) => (
                    <Pressable key={item.id} onPress={() => { setLayerId(item.layer); setFilterId('all'); setSelectedItem(item); }} style={[styles.relatedChip, { backgroundColor: colors.muted }]}>
                      <Text style={[styles.relatedText, { color: colors.foreground }]}>{item.name}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
            <View style={styles.detailActions}>
              <PressableScale
                accessibilityRole="button"
                onPress={() => openFlashcard({ kind: 'province', name: selectedProvince })}
                style={[styles.detailCard2, { backgroundColor: colors.accent }]}
                testID="flashcard-from-province"
              >
                <Feather name="credit-card" size={15} color={colors.primary} />
                <Text style={[styles.noteFromMapText, { color: colors.primary }]} numberOfLines={1}>Kart</Text>
              </PressableScale>
              <PressableScale
                accessibilityRole="button"
                onPress={() => router.push({ pathname: '/quiz', params: { mode: 'provinces' } })}
                style={[styles.detailQuiz, { backgroundColor: colors.primary }]}
                testID="quiz-from-province"
              >
                <Feather name="target" size={15} color={colors.primaryForeground} />
                <Text style={[styles.detailQuizText, { color: colors.primaryForeground }]}>İl quiz'ini başlat</Text>
                <Feather name="arrow-right" size={14} color={colors.primaryForeground} />
              </PressableScale>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/province', params: { name: selectedProvince } })}
              style={styles.provinceDetailLink}
              testID="open-province-detail"
            >
              <Text style={[styles.provinceDetailText, { color: colors.primary }]}>İl detay sayfası</Text>
              <Feather name="chevron-right" size={14} color={colors.primary} />
            </Pressable>
          </Animated.View>
        ) : (
          <Pressable onPress={() => chooseProvince('Ankara')} style={[styles.emptySelection, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="crosshair" size={18} color={colors.primary} />
            <Text style={[styles.emptySelectionText, { color: colors.foreground }]}>Bir il veya harita işareti seç</Text>
          </Pressable>
        )}

        <PressableScale onPress={() => router.push('/quiz')} style={[styles.quizBanner, { backgroundColor: colors.primary }]} testID="start-quiz">
          <View style={{ flex: 1 }}>
            <Text style={[styles.quizEyebrow, { color: colors.primaryForeground }]}>HARİTADA KENDİNİ DENE</Text>
            <Text style={[styles.quizTitle, { color: colors.primaryForeground }]}>Dilsiz harita quiz’i</Text>
            <Text style={[styles.quizCopy, { color: colors.primaryForeground }]}>İli, dağı veya gölü harita üzerinde bul.</Text>
          </View>
          <View style={[styles.quizArrow, { backgroundColor: colors.accent }]}>
            <Feather name="arrow-up-right" size={19} color={colors.primaryForeground} />
          </View>
        </PressableScale>
        <PressableScale onPress={() => router.push('/pro')} style={[styles.proBanner, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.proIcon, { backgroundColor: colors.premiumBackground }]}><Feather name="star" size={16} color={colors.premium} /></View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.proTitle, { color: colors.foreground }]}>Pro plan taslağı</Text>
            <Text style={[styles.proCopy, { color: colors.mutedForeground }]}>Bu sürümde tüm içerikler açık.</Text>
          </View>
          <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
        </PressableScale>
      </ScrollView>

      <Modal visible={fullscreenOpen} animationType="fade" onRequestClose={closeFullscreen}>
        <View style={[styles.fullscreenModal, { backgroundColor: colors.background, paddingTop: Platform.OS === 'web' ? 14 : insets.top + 6, paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.fullscreenHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.fullscreenTitle, { color: colors.foreground }]}>
                {activeLayer.label} haritası
                {filterId !== 'all' ? ` · ${activeLayer.filters.find((f) => f.id === filterId)?.label ?? ''}` : ''}
              </Text>
              <Text style={[styles.fullscreenSubtitle, { color: colors.mutedForeground }]}>
                {layerId === 'provinces' ? '81 il sınırları, bölgeler ve plaka kodları' : `${visibleItems.length} coğrafi özellik gösteriliyor`}
              </Text>
            </View>
            {Platform.OS !== 'web' && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={mapLandscape ? 'Portre görünüme dön' : 'Haritayı yan çevir'}
                onPress={() => void toggleMapOrientation()}
                style={[styles.fullscreenCloseBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                testID="toggle-map-orientation"
              >
                <MaterialCommunityIcons
                  name={mapLandscape ? 'screen-rotation-lock' : 'screen-rotation'}
                  size={15}
                  color={colors.foreground}
                />
                <Text style={[styles.fullscreenCloseText, { color: colors.foreground }]}>
                  {mapLandscape ? 'Dikey' : 'Yatay'}
                </Text>
              </Pressable>
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Tam ekranı kapat"
              onPress={closeFullscreen}
              style={[styles.fullscreenCloseBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              testID="close-fullscreen-map"
            >
              <Feather name="minimize-2" size={15} color={colors.foreground} />
              <Text style={[styles.fullscreenCloseText, { color: colors.foreground }]}>Küçült</Text>
            </Pressable>
          </View>

          {activeLayer.filters.length > 1 &&
            (mapLandscape ? (
              <ScrollView style={{ flexGrow: 0, maxHeight: 104 }} showsVerticalScrollIndicator={false}>
                <View style={styles.fullscreenFilterWrap}>{activeLayer.filters.map(renderFilterChip)}</View>
              </ScrollView>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={styles.fullscreenFilterRow}>
                {activeLayer.filters.map(renderFilterChip)}
              </ScrollView>
            ))}

          <ScrollView contentContainerStyle={styles.fullscreenScroll} showsVerticalScrollIndicator={false}>
            <TurkeyMap
              layer={layerId}
              items={visibleItems}
              selectedProvince={selectedProvince}
              selectedItemId={selectedItem?.id}
              onSelectProvince={chooseProvince}
              onSelectItem={(item) => {
                setSelectedItem(item);
                void Haptics.selectionAsync();
              }}
              highlightProvinces={selectedItem?.provinces}
              fullscreen
              onToggleFullscreen={closeFullscreen}
            />

            {layerId !== 'provinces' && visibleItems.length > 0 && (
              <View style={styles.fullscreenItemsWrap}>
                <Text style={[styles.relatedHeading, { color: colors.mutedForeground }]}>
                  HARİTADAKİ ÖZELLİKLER ({visibleItems.length}) — SEÇMEK İÇİN DOKUN
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.fullscreenItemChips}>
                  {visibleItems.map((item) => {
                    const active = selectedItem?.id === item.id;
                    const itemColor = MAP_COLORS[item.subtype] ?? colors.primary;
                    return (
                      <Pressable
                        key={item.id}
                        onPress={() => {
                          setSelectedItem(item);
                          setSelectedProvince(item.provinces[0] ?? null);
                          void Haptics.selectionAsync();
                        }}
                        style={[
                          styles.fullscreenItemChip,
                          {
                            backgroundColor: active ? itemColor : colors.card,
                            borderColor: active ? itemColor : colors.border,
                          },
                        ]}
                      >
                        <View style={[styles.liveDot, { backgroundColor: active ? colors.primaryForeground : itemColor }]} />
                        <Text style={[styles.fullscreenItemChipText, { color: active ? colors.primaryForeground : colors.foreground }]}>
                          {item.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {selectedItem ? (
              <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.detailTop}>
                  <View style={[styles.detailIcon, { backgroundColor: `${MAP_COLORS[selectedItem.subtype] ?? colors.primary}22` }]}>
                    <Feather name="map-pin" size={17} color={MAP_COLORS[selectedItem.subtype] ?? colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.detailTitle, { color: colors.foreground }]}>{selectedItem.name}</Text>
                    <Text style={[styles.detailSub, { color: colors.mutedForeground }]}>
                      {selectedItem.subtypeLabel} · {selectedItem.provinces.join(' / ')}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.detailBody, { color: colors.foreground }]}>{selectedItem.description}</Text>
                {selectedItem.examTip && (
                  <View style={[styles.examTip, { backgroundColor: colors.accent }]}>
                    <Feather name="bookmark" size={15} color={colors.primary} />
                    <Text style={[styles.examTipText, { color: colors.accentForeground }]}>{selectedItem.examTip}</Text>
                  </View>
                )}
              </View>
            ) : selectedProvince ? (
              <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.detailTop}>
                  <View style={[styles.detailIcon, { backgroundColor: colors.accent }]}>
                    <Feather name="map-pin" size={17} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.detailTitle, { color: colors.foreground }]}>{selectedProvince}</Text>
                    <Text style={[styles.detailSub, { color: colors.mutedForeground }]}>
                      {provinceData ? `${String(provinceData.plate).padStart(2, '0')} plaka · ${provinceData.region}` : 'İl bilgisi'}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.detailBody, { color: colors.foreground }]}>
                  {PROVINCE_NOTES[selectedProvince] ?? `${selectedProvince} ilindeki coğrafi özellikleri incelemek için işaretlere dokunabilirsin.`}
                </Text>
              </View>
            ) : null}
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={!!flashcard} transparent animationType="fade" onRequestClose={() => setFlashcard(null)}>
        <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
          <Pressable style={styles.flashcardBackdrop} onPress={() => setFlashcard(null)} accessibilityLabel="Kartı kapat" />
          <View style={[styles.flashcardCard, { backgroundColor: colors.card }]}>
            {flashcard && (
              <>
                <View style={styles.flashcardTop}>
                  <View style={[styles.flashcardTag, { backgroundColor: colors.accent }]}>
                    <Text style={[styles.flashcardTagText, { color: colors.primary }]}>
                      {flashcard.kind === 'item'
                        ? LAYERS.find((layer) => layer.id === flashcard.item.layer)?.label.toLocaleUpperCase('tr') ?? 'COĞRAFYA'
                        : 'İL'}
                    </Text>
                  </View>
                  <Pressable accessibilityLabel="Kartı kapat" onPress={() => setFlashcard(null)} hitSlop={8}>
                    <Feather name="x" size={18} color={colors.mutedForeground} />
                  </Pressable>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={flashcardFlipped ? 'Kartı geri çevir' : 'Kartı çevir'}
                  onPress={() => { setFlashcardFlipped((v) => !v); void Haptics.selectionAsync(); }}
                  style={styles.flashcardFace}
                >
                  {!flashcardFlipped ? (
                    <>
                      <Text style={[styles.flashcardHint, { color: colors.mutedForeground }]}>CEVABI GÖRMEK İÇİN DOKUN</Text>
                      <Text style={[styles.flashcardFront, { color: colors.foreground }]}>
                        {flashcard.kind === 'item' ? flashcard.item.name : flashcard.name}
                      </Text>
                      <Text style={[styles.flashcardFrontSub, { color: colors.mutedForeground }]}>
                        {flashcard.kind === 'item' ? flashcard.item.subtypeLabel : `${PROVINCES.find((p) => p.name === flashcard.name)?.plate ?? ''} plaka`}
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text style={[styles.flashcardBackTitle, { color: colors.primary }]}>
                        {flashcard.kind === 'item' ? flashcard.item.name : flashcard.name}
                      </Text>
                      <Text style={[styles.flashcardBackBody, { color: colors.foreground }]}>
                        {flashcard.kind === 'item'
                          ? flashcard.item.description
                          : PROVINCE_NOTES[flashcard.name] ?? `${flashcard.name} il bilgisi.`}
                      </Text>
                      <Text style={[styles.flashcardBackMeta, { color: colors.mutedForeground }]}>
                        {flashcard.kind === 'item'
                          ? `Bulunduğu iller: ${flashcard.item.provinces.join(', ')}`
                          : `${PROVINCES.find((p) => p.name === flashcard.name)?.region ?? ''} bölgesi`}
                        {flashcard.kind === 'item' && flashcard.item.examTip ? `\n${flashcard.item.examTip}` : ''}
                      </Text>
                    </>
                  )}
                </Pressable>
                {flashcardFlipped && (
                  <View style={styles.flashcardActions}>
                    <PressableScale
                      accessibilityRole="button"
                      onPress={() => answerFlashcard(false)}
                      style={[styles.flashcardNo, { backgroundColor: colors.errorBackground }]}
                      testID="flashcard-dont-know"
                    >
                      <Feather name="x" size={15} color={colors.errorForeground} />
                      <Text style={[styles.flashcardNoText, { color: colors.errorForeground }]}>Bilmiyorum</Text>
                    </PressableScale>
                    <PressableScale
                      accessibilityRole="button"
                      onPress={() => answerFlashcard(true)}
                      style={[styles.flashcardYes, { backgroundColor: colors.success }]}
                      testID="flashcard-know"
                    >
                      <Feather name="check" size={15} color={colors.primaryForeground} />
                      <Text style={[styles.flashcardYesText, { color: colors.primaryForeground }]}>Biliyorum</Text>
                    </PressableScale>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={searchOpen} animationType="slide" onRequestClose={() => setSearchOpen(false)}>
          <KeyboardAvoidingViewCompat behavior="padding" style={[styles.modalScreen, { backgroundColor: colors.background, paddingTop: Platform.OS === 'web' ? 16 : insets.top }]}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>Ara</Text>
              <Text style={[styles.modalSubtitle, { color: colors.mutedForeground }]}>İl, özellik, konu veya notun içinde ara.</Text>
            </View>
            <Pressable accessibilityLabel="Aramayı kapat" onPress={() => setSearchOpen(false)} style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="x" size={19} color={colors.foreground} />
            </Pressable>
          </View>
          <View style={[styles.searchInputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="search" size={18} color={colors.mutedForeground} />
            <TextInput
              autoFocus
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Örn. Ardahan, Tendürek, Van Gölü"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.searchInput, { color: colors.foreground }]}
              selectionColor={colors.primary}
              autoCapitalize="none"
              testID="geography-search"
            />
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
            {!searchText.trim() && (
              <View style={styles.quickSearch}>
                <Text style={[styles.quickSearchTitle, { color: colors.mutedForeground }]}>HIZLI BAŞLA</Text>
                <View style={styles.quickSearchRow}>
                  {['Ardahan', 'Samsun', 'Şanlıurfa'].map((name) => (
                    <Pressable key={name} onPress={() => chooseSearchProvince(name)} style={[styles.quickSearchChip, { backgroundColor: colors.accent }]}>
                      <Text style={[styles.quickSearchText, { color: colors.primary }]}>{name}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
            {matchingProvinces.map((province) => (
              <Pressable key={province.plate} onPress={() => chooseSearchProvince(province.name)} style={[styles.searchResult, { borderBottomColor: colors.border }]}>
                <View style={[styles.searchResultIcon, { backgroundColor: colors.accent }]}><Feather name="map-pin" size={16} color={colors.primary} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.searchResultTitle, { color: colors.foreground }]}>{province.name}</Text>
                  <Text style={[styles.searchResultCopy, { color: colors.mutedForeground }]}>{String(province.plate).padStart(2, '0')} plaka · {province.region}</Text>
                </View>
                <Feather name="arrow-up-right" size={16} color={colors.mutedForeground} />
              </Pressable>
            ))}
            {matchingItems.map((item) => (
              <Pressable key={item.id} onPress={() => chooseSearchItem(item)} style={[styles.searchResult, { borderBottomColor: colors.border }]}>
                <View style={[styles.searchResultIcon, { backgroundColor: `${MAP_COLORS[item.subtype] ?? colors.primary}22` }]}><Feather name="map" size={16} color={MAP_COLORS[item.subtype] ?? colors.primary} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.searchResultTitle, { color: colors.foreground }]}>{item.name}</Text>
                  <Text style={[styles.searchResultCopy, { color: colors.mutedForeground }]}>{item.subtypeLabel} · {item.provinces.join(', ')}</Text>
                </View>
                <Feather name="arrow-up-right" size={16} color={colors.mutedForeground} />
              </Pressable>
            ))}
            {matchingTopics.map((topic) => (
              <Pressable
                key={topic.id}
                onPress={() => {
                  chooseLayer(topic.id as LayerId);
                  setSearchOpen(false);
                  setSearchText('');
                }}
                style={[styles.searchResult, { borderBottomColor: colors.border }]}
              >
                <View style={[styles.searchResultIcon, { backgroundColor: colors.accent }]}><Feather name="layers" size={16} color={colors.primary} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.searchResultTitle, { color: colors.foreground }]}>{topic.title}</Text>
                  <Text style={[styles.searchResultCopy, { color: colors.mutedForeground }]}>{topic.subtitle}</Text>
                </View>
                <Feather name="arrow-up-right" size={16} color={colors.mutedForeground} />
              </Pressable>
            ))}
            {matchingNotes.map((note) => (
              <Pressable
                key={note.id}
                onPress={() => {
                  setSearchOpen(false);
                  setSearchText('');
                  router.push('/notes');
                }}
                style={[styles.searchResult, { borderBottomColor: colors.border }]}
              >
                <View style={[styles.searchResultIcon, { backgroundColor: colors.accent }]}><Feather name="book-open" size={16} color={colors.primary} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.searchResultTitle, { color: colors.foreground }]} numberOfLines={1}>{note.title}</Text>
                  <Text style={[styles.searchResultCopy, { color: colors.mutedForeground }]} numberOfLines={1}>{note.category} · defter notu</Text>
                </View>
                <Feather name="arrow-up-right" size={16} color={colors.mutedForeground} />
              </Pressable>
            ))}
            {!!searchText && matchingProvinces.length === 0 && matchingItems.length === 0 && matchingTopics.length === 0 && matchingNotes.length === 0 && (
              <Text style={[styles.noResults, { color: colors.mutedForeground }]}>Bu aramayla eşleşen bir sonuç bulunamadı.</Text>
            )}
          </ScrollView>
          </KeyboardAvoidingViewCompat>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 10, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 46, height: 46, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  logoBadge: { position: 'absolute', right: -4, bottom: -3, width: 17, height: 17, borderRadius: 9, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  brandName: { fontSize: 17, fontWeight: '700', letterSpacing: -0.45 },
  eyebrow: { fontSize: 8, fontWeight: '700', letterSpacing: 1.25, marginTop: 3 },
  headerActions: { flexDirection: 'row', gap: 6 },
  iconButton: { height: 38, width: 38, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  headlineBlock: { gap: 6, paddingTop: 4 },
  headline: { fontSize: 24, lineHeight: 30, fontWeight: '700', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, lineHeight: 19, maxWidth: 325 },
  heroPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 4 },
  heroPill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  heroPillText: { fontSize: 10.5, fontWeight: '700' },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: -5 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  sectionHint: { marginTop: 3, fontSize: 12 },
  countBadge: { fontSize: 9, fontWeight: '700', letterSpacing: 0.8, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 10, overflow: 'hidden' },
  layerRow: { gap: 8, paddingVertical: 3, paddingRight: 16 },
  layerChip: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  layerIconBadge: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  layerLabel: { fontSize: 12, fontWeight: '700' },
  layerCountPill: { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  filterRow: { gap: 7, marginTop: -9, paddingVertical: 2, paddingRight: 15 },
  filterChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 5 },
  filterLabel: { fontSize: 11, fontWeight: '600' },
  filterCount: { fontSize: 9, fontWeight: '700' },
  layerCount: { fontSize: 9, fontWeight: '700' },
  mapCard: { borderRadius: 28, padding: 14, gap: 9, shadowOpacity: 0.06, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
  mapCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mapTitle: { fontSize: 16, fontWeight: '700' },
  mapSubTitle: { fontSize: 11, marginTop: 3 },
  liveTag: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 10 },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  liveText: { fontSize: 8, fontWeight: '700', letterSpacing: 0.7 },
  fullscreenBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10 },
  fullscreenBtnText: { fontSize: 10, fontWeight: '700' },
  fullscreenModal: { flex: 1, paddingHorizontal: 14, gap: 10 },
  fullscreenHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  fullscreenTitle: { fontSize: 18, fontWeight: '700' },
  fullscreenSubtitle: { fontSize: 11, marginTop: 2 },
  fullscreenCloseBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  fullscreenCloseText: { fontSize: 12, fontWeight: '700' },
  fullscreenFilterRow: { gap: 7, paddingVertical: 2, paddingRight: 12 },
  fullscreenFilterWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, paddingVertical: 2, paddingRight: 4 },
  fullscreenScroll: { gap: 12, paddingBottom: 28 },
  fullscreenItemsWrap: { gap: 7 },
  fullscreenItemChips: { gap: 7, paddingRight: 12 },
  fullscreenItemChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 12, paddingHorizontal: 11, paddingVertical: 8 },
  fullscreenItemChipText: { fontSize: 11, fontWeight: '600' },
  mapFootnote: { fontSize: 10, textAlign: 'center', marginTop: -1 },
  attribution: { fontSize: 9, textAlign: 'center', marginTop: -8 },
  detailCard: { borderRadius: 24, borderWidth: 1, padding: 16, gap: 11 },
  provinceChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  provinceChip: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 4 },
  provinceChipText: { fontSize: 10.5, fontWeight: '700' },
  detailTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  detailIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  detailTitle: { fontSize: 15, fontWeight: '700' },
  detailSub: { fontSize: 11, marginTop: 3, lineHeight: 16 },
  detailBody: { fontSize: 13, lineHeight: 19 },
  statChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  statChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 7 },
  statChipText: { fontSize: 11, fontWeight: '700' },
  examTip: { flexDirection: 'row', gap: 8, borderRadius: 14, padding: 11, alignItems: 'flex-start' },
  examTipText: { flex: 1, fontSize: 12, lineHeight: 17, fontWeight: '500' },
  sourceText: { fontSize: 10, lineHeight: 14 },
  detailActions: { flexDirection: 'row', gap: 8 },
  detailQuiz: { flex: 1, minHeight: 44, borderRadius: 999, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  detailQuizText: { fontSize: 12, fontWeight: '700' },
  detailCard2: { minHeight: 44, borderRadius: 999, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  backdrop: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  flashcardBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  flashcardCard: { borderRadius: 24, padding: 18, gap: 12 },
  flashcardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  flashcardTag: { borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4 },
  flashcardTagText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.6 },
  flashcardFace: { minHeight: 180, borderRadius: 18, backgroundColor: 'rgba(127,127,127,0.06)', alignItems: 'center', justifyContent: 'center', padding: 18, gap: 8 },
  flashcardHint: { fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },
  flashcardFront: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  flashcardFrontSub: { fontSize: 11, fontWeight: '600' },
  flashcardBackTitle: { fontSize: 15, fontWeight: '700' },
  flashcardBackBody: { fontSize: 12, lineHeight: 18, textAlign: 'center' },
  flashcardBackMeta: { fontSize: 10, lineHeight: 15, textAlign: 'center' },
  flashcardActions: { flexDirection: 'row', gap: 9 },
  flashcardNo: { flex: 1, minHeight: 46, borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  flashcardNoText: { fontSize: 12, fontWeight: '700' },
  flashcardYes: { flex: 1, minHeight: 46, borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  flashcardYesText: { fontSize: 12, fontWeight: '700' },
  provinceDetailLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8 },
  provinceDetailText: { fontSize: 12, fontWeight: '700' },
  noteFromMap: { flex: 1, minHeight: 44, borderRadius: 999, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  noteFromMapText: { fontSize: 12, fontWeight: '700' },
  relatedList: { gap: 8 },
  relatedHeading: { fontSize: 9, letterSpacing: 0.8, fontWeight: '700' },
  relatedChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  relatedChip: { borderRadius: 11, paddingHorizontal: 9, paddingVertical: 7 },
  relatedText: { fontSize: 10, fontWeight: '600' },
  emptySelection: { borderWidth: 1, borderRadius: 18, padding: 14, flexDirection: 'row', gap: 9, alignItems: 'center' },
  emptySelectionText: { fontSize: 13, fontWeight: '600' },
  quizBanner: { borderRadius: 22, padding: 17, flexDirection: 'row', alignItems: 'center', gap: 12 },
  quizEyebrow: { opacity: 0.76, fontSize: 9, letterSpacing: 1, fontWeight: '700' },
  quizTitle: { fontSize: 17, fontWeight: '700', marginTop: 4 },
  quizCopy: { opacity: 0.82, fontSize: 11, marginTop: 4 },
  quizArrow: { width: 37, height: 37, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  proBanner: { borderRadius: 19, borderWidth: 1, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  proIcon: { width: 33, height: 33, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  proTitle: { fontSize: 12, fontWeight: '700' },
  proCopy: { fontSize: 10, marginTop: 2 },
  modalScreen: { flex: 1, paddingHorizontal: 20 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 18 },
  modalTitle: { fontSize: 22, fontWeight: '700' },
  modalSubtitle: { fontSize: 12, marginTop: 4 },
  searchInputWrap: { height: 48, borderWidth: 1, borderRadius: 15, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 10 },
  searchInput: { flex: 1, height: '100%', fontSize: 13, fontFamily: FONT_FAMILY.regular },
  searchResult: { minHeight: 62, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 9 },
  searchResultIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  searchResultTitle: { fontSize: 13, fontWeight: '600' },
  searchResultCopy: { fontSize: 10, marginTop: 3 },
  noResults: { textAlign: 'center', paddingVertical: 28, fontSize: 13, lineHeight: 20 },
  quickSearch: { paddingTop: 9, paddingBottom: 12, gap: 8 },
  quickSearchTitle: { fontSize: 9, fontWeight: '700', letterSpacing: 0.9 },
  quickSearchRow: { flexDirection: 'row', gap: 8 },
  quickSearchChip: { borderRadius: 12, paddingHorizontal: 11, paddingVertical: 8 },
  quickSearchText: { fontSize: 11, fontWeight: '600' },
});
