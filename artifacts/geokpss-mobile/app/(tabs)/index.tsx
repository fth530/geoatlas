import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LayerId, LAYERS, MAP_ITEMS, MapItem, MAP_COLORS } from '@/data/geography';
import { PROVINCES, TurkeyMap } from '@/components/TurkeyMap';
import { useColors } from '@/hooks/useColors';

const PROVINCE_NOTES: Record<string, string> = {
  Ardahan: 'Çıldır Gölü, yüksek plato ve kışın donan göl yüzeyiyle öne çıkar.',
  Samsun: 'Bafra ve Çarşamba deltaları, Kızılırmak ve Yeşilırmak ağızlarında gelişmiştir.',
  Şanlıurfa: 'GAP, Harran Ovası ve Karacadağ’ın bazalt lavları bu il çevresinde çalışılır.',
  Ağrı: 'Büyük Ağrı, Türkiye’nin en yüksek dağıdır; Tendürek de Ağrı-Van çevresinde uzanır.',
  Zonguldak: 'Taşkömürü yatakları ve Filyos havzası önemli eşleştirmelerdir.',
};

export default function MapScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { layer: layerParam } = useLocalSearchParams<{ layer?: string }>();
  const [layerId, setLayerId] = useState<LayerId>('provinces');
  const [filterId, setFilterId] = useState('all');
  const [selectedProvince, setSelectedProvince] = useState<string | null>('Ankara');
  const [selectedItem, setSelectedItem] = useState<MapItem | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    if (layerParam && LAYERS.some((layer) => layer.id === layerParam)) {
      setLayerId(layerParam as LayerId);
      setFilterId('all');
    }
  }, [layerParam]);

  const activeLayer = LAYERS.find((layer) => layer.id === layerId) ?? LAYERS[0];
  const visibleItems = useMemo(
    () =>
      MAP_ITEMS.filter((item) => {
        if (item.layer !== layerId) return false;
        if (filterId === 'all') return true;
        if (filterId === 'volcanic' && item.subtype === 'volcanicLake') return true;
        return item.subtype === filterId || item.tags?.includes(filterId) === true;
      }),
    [layerId, filterId],
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
        `${province.name} ${province.plate}`.toLocaleLowerCase('tr').includes(query),
      ).slice(0, 6);
    },
    [searchText],
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

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: Platform.OS === 'web' ? 16 : insets.top }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 108 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.brand}>
            <Image source={require('../../assets/images/icon.png')} style={styles.logo} />
            <View>
              <Text style={[styles.brandName, { color: colors.primary }]}>GeoKPSS</Text>
              <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>COĞRAFYA · HARİTA ATLASI</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <Pressable accessibilityLabel="Haritada ara" onPress={() => setSearchOpen(true)} style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="search" size={19} color={colors.foreground} />
            </Pressable>
            <Pressable accessibilityLabel="Pro planı görüntüle" onPress={() => router.push('/pro')} style={[styles.iconButton, { backgroundColor: colors.accent, borderColor: colors.accent }]}>
              <Feather name="star" size={18} color={colors.primary} />
            </Pressable>
          </View>
        </View>

        <View style={styles.headlineBlock}>
          <Text style={[styles.headline, { color: colors.foreground }]}>Türkiye’yi haritada keşfet.</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>KPSS coğrafyasını yerinde öğren, bağlantıları aklında tut.</Text>
        </View>

        <View style={styles.sectionHeading}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Harita katmanları</Text>
            <Text style={[styles.sectionHint, { color: colors.mutedForeground }]}>İstediğin konuyu seç, haritada incele.</Text>
          </View>
          <Text style={[styles.countBadge, { color: colors.primary, backgroundColor: colors.accent }]}>10 KATMAN</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.layerRow}>
          {LAYERS.map((layer) => {
            const active = layer.id === layerId;
            return (
              <Pressable
                key={layer.id}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                testID={`layer-${layer.id}`}
                onPress={() => chooseLayer(layer.id)}
                style={[styles.layerChip, { backgroundColor: active ? colors.primary : colors.card, borderColor: active ? colors.primary : colors.border }]}
              >
                <Feather name={layer.icon as keyof typeof Feather.glyphMap} size={15} color={active ? colors.primaryForeground : colors.mutedForeground} />
                <Text style={[styles.layerLabel, { color: active ? colors.primaryForeground : colors.foreground }]}>{layer.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {activeLayer.filters.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {activeLayer.filters.map((filter) => {
              const active = filterId === filter.id;
              return (
                <Pressable
                  key={filter.id}
                  onPress={() => {
                    setFilterId(filter.id);
                    setSelectedItem(null);
                    void Haptics.selectionAsync();
                  }}
                  style={[styles.filterChip, { backgroundColor: active ? colors.accent : 'transparent', borderColor: active ? colors.accent : colors.border }]}
                >
                  <Text style={[styles.filterLabel, { color: active ? colors.primary : colors.mutedForeground }]}>{filter.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        <View style={[styles.mapCard, { backgroundColor: colors.card }]}>
          <View style={styles.mapCardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.mapTitle, { color: colors.foreground }]}>{activeLayer.label} haritası</Text>
              <Text style={[styles.mapSubTitle, { color: colors.mutedForeground }]}>{activeLayer.description}</Text>
            </View>
            <View style={[styles.liveTag, { backgroundColor: colors.accent }]}>
              <View style={[styles.liveDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.liveText, { color: colors.primary }]}>ETKİLEŞİMLİ</Text>
            </View>
          </View>
          <TurkeyMap
            layer={layerId}
            items={visibleItems}
            selectedProvince={selectedProvince}
            selectedItemId={selectedItem?.id}
            onSelectProvince={chooseProvince}
            onSelectItem={setSelectedItem}
          />
          <Text style={[styles.mapFootnote, { color: colors.mutedForeground }]}>Haritaya dokun · iki parmağınla yakınlaştır</Text>
          <Text style={[styles.attribution, { color: colors.mutedForeground }]}>Sınır geometrileri: OpenStreetMap katkıcıları · ODbL</Text>
        </View>

        {selectedItem ? (
          <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.detailTop}>
              <View style={[styles.detailIcon, { backgroundColor: `${MAP_COLORS[selectedItem.subtype] ?? colors.primary}22` }]}>
                <Feather name="map-pin" size={17} color={MAP_COLORS[selectedItem.subtype] ?? colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.detailTitle, { color: colors.foreground }]}>{selectedItem.name}</Text>
                <Text style={[styles.detailSub, { color: colors.mutedForeground }]}>{selectedItem.subtypeLabel} · {selectedItem.provinces.join(' / ')}</Text>
              </View>
              <Pressable accessibilityLabel="Seçimi temizle" onPress={() => setSelectedItem(null)} hitSlop={10}>
                <Feather name="x" size={19} color={colors.mutedForeground} />
              </Pressable>
            </View>
            <Text style={[styles.detailBody, { color: colors.foreground }]}>{selectedItem.description}</Text>
            {selectedItem.elevation && (
              <View style={[styles.factPill, { backgroundColor: colors.muted }]}>
                <Feather name="trending-up" size={14} color={colors.primary} />
                <Text style={[styles.factText, { color: colors.foreground }]}>{selectedItem.elevation}</Text>
              </View>
            )}
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
              <Pressable accessibilityLabel="Seçimi temizle" onPress={() => setSelectedProvince(null)} hitSlop={10}>
                <Feather name="x" size={19} color={colors.mutedForeground} />
              </Pressable>
            </View>
            <Text style={[styles.detailBody, { color: colors.foreground }]}>
              {PROVINCE_NOTES[selectedProvince] ?? 'Haritadaki renkli işaretlere dokunarak bu ildeki coğrafi özellikleri inceleyebilirsin.'}
            </Text>
            {provinceItems.length > 0 && (
              <View style={styles.relatedList}>
                <Text style={[styles.relatedHeading, { color: colors.mutedForeground }]}>BU İLDE ÖNE ÇIKANLAR</Text>
                <View style={styles.relatedChips}>
                  {provinceItems.slice(0, 4).map((item) => (
                    <Pressable key={item.id} onPress={() => { setLayerId(item.layer); setFilterId('all'); setSelectedItem(item); }} style={[styles.relatedChip, { backgroundColor: colors.muted }]}>
                      <Text style={[styles.relatedText, { color: colors.foreground }]}>{item.name}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </View>
        ) : (
          <Pressable onPress={() => chooseProvince('Ankara')} style={[styles.emptySelection, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="crosshair" size={18} color={colors.primary} />
            <Text style={[styles.emptySelectionText, { color: colors.foreground }]}>Bir il veya harita işareti seç</Text>
          </Pressable>
        )}

        <Pressable onPress={() => router.push('/quiz')} style={[styles.quizBanner, { backgroundColor: colors.primary }]} testID="start-quiz">
          <View style={{ flex: 1 }}>
            <Text style={[styles.quizEyebrow, { color: colors.primaryForeground }]}>HARİTADA KENDİNİ DENE</Text>
            <Text style={[styles.quizTitle, { color: colors.primaryForeground }]}>Dilsiz harita quiz’i</Text>
            <Text style={[styles.quizCopy, { color: colors.primaryForeground }]}>İli, dağı veya gölü harita üzerinde bul.</Text>
          </View>
          <View style={[styles.quizArrow, { backgroundColor: colors.accent }]}>
            <Feather name="arrow-up-right" size={19} color={colors.primaryForeground} />
          </View>
        </Pressable>
        <Pressable onPress={() => router.push('/pro')} style={[styles.proBanner, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.proIcon, { backgroundColor: colors.premiumBackground }]}><Feather name="star" size={16} color={colors.premium} /></View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.proTitle, { color: colors.foreground }]}>Pro plan taslağı</Text>
            <Text style={[styles.proCopy, { color: colors.mutedForeground }]}>Bu sürümde tüm içerikler açık.</Text>
          </View>
          <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
        </Pressable>
      </ScrollView>

      <Modal visible={searchOpen} animationType="slide" onRequestClose={() => setSearchOpen(false)}>
        <KeyboardAvoidingView behavior="padding" style={[styles.modalScreen, { backgroundColor: colors.background, paddingTop: Platform.OS === 'web' ? 16 : insets.top }]}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>Haritada ara</Text>
              <Text style={[styles.modalSubtitle, { color: colors.mutedForeground }]}>İl, dağ, göl veya coğrafi terim yaz.</Text>
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
            {!!searchText && matchingProvinces.length === 0 && matchingItems.length === 0 && (
              <Text style={[styles.noResults, { color: colors.mutedForeground }]}>Bu aramayla eşleşen bir il veya coğrafi özellik bulunamadı.</Text>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 18, paddingTop: 10, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 42, height: 42, borderRadius: 13 },
  brandName: { fontSize: 16, fontWeight: '700', letterSpacing: 0.1 },
  eyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 1.1, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconButton: { height: 40, width: 40, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  headlineBlock: { gap: 5, paddingTop: 4 },
  headline: { fontSize: 24, lineHeight: 30, fontWeight: '700', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, lineHeight: 19, maxWidth: 325 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: -5 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  sectionHint: { marginTop: 3, fontSize: 12 },
  countBadge: { fontSize: 9, fontWeight: '700', letterSpacing: 0.8, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 10, overflow: 'hidden' },
  layerRow: { gap: 8, paddingVertical: 3, paddingRight: 16 },
  layerChip: { flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderRadius: 15, paddingHorizontal: 12, paddingVertical: 9 },
  layerLabel: { fontSize: 12, fontWeight: '600' },
  filterRow: { gap: 7, marginTop: -9, paddingVertical: 2, paddingRight: 15 },
  filterChip: { borderWidth: 1, borderRadius: 13, paddingHorizontal: 11, paddingVertical: 7 },
  filterLabel: { fontSize: 11, fontWeight: '600' },
  mapCard: { borderRadius: 26, padding: 14, gap: 9, shadowColor: '#253A31', shadowOpacity: 0.045, shadowRadius: 14, shadowOffset: { width: 0, height: 5 }, elevation: 2 },
  mapCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mapTitle: { fontSize: 16, fontWeight: '700' },
  mapSubTitle: { fontSize: 11, marginTop: 3 },
  liveTag: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 10 },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  liveText: { fontSize: 8, fontWeight: '700', letterSpacing: 0.7 },
  mapFootnote: { fontSize: 10, textAlign: 'center', marginTop: -1 },
  attribution: { fontSize: 9, textAlign: 'center', marginTop: -8 },
  detailCard: { borderRadius: 22, borderWidth: 1, padding: 15, gap: 11 },
  detailTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  detailIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  detailTitle: { fontSize: 15, fontWeight: '700' },
  detailSub: { fontSize: 11, marginTop: 3, lineHeight: 16 },
  detailBody: { fontSize: 13, lineHeight: 19 },
  factPill: { flexDirection: 'row', alignSelf: 'flex-start', alignItems: 'center', gap: 7, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 12 },
  factText: { fontSize: 12, fontWeight: '700' },
  examTip: { flexDirection: 'row', gap: 8, borderRadius: 14, padding: 11, alignItems: 'flex-start' },
  examTipText: { flex: 1, fontSize: 12, lineHeight: 17, fontWeight: '500' },
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
  searchInput: { flex: 1, height: '100%', fontSize: 13 },
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
