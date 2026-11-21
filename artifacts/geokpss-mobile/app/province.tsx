import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import React, { useMemo } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LAYERS, MAP_COLORS, MAP_ITEMS } from '@/data/geography';
import { PROVINCE_NOTES } from '@/data/province-notes';
import { PROVINCES } from '@/components/TurkeyMap';
import { AppText as Text } from '@/components/AppText';
import { PressableScale } from '@/components/PressableScale';
import { useColors } from '@/hooks/useColors';
import { speakTurkish } from '@/utils/speech';

export default function ProvinceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { name } = useLocalSearchParams<{ name?: string }>();
  const province = PROVINCES.find((entry) => entry.name === name);
  const items = useMemo(
    () => (province ? MAP_ITEMS.filter((item) => item.provinces.includes(province.name)) : []),
    [province],
  );
  const itemsByLayer = useMemo(() => {
    const groups = new Map<string, typeof items>();
    for (const item of items) {
      const list = groups.get(item.layer) ?? [];
      list.push(item);
      groups.set(item.layer, list);
    }
    return [...groups.entries()];
  }, [items]);

  if (!province) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: Platform.OS === 'web' ? 16 : insets.top, paddingHorizontal: 20 }]}>
        <Pressable accessibilityLabel="Geri" onPress={() => router.back()} style={[styles.back, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="arrow-left" size={18} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.missing, { color: colors.mutedForeground }]}>İl bulunamadı.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: Platform.OS === 'web' ? 16 : insets.top }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
        <Pressable accessibilityLabel="Geri" onPress={() => router.back()} style={[styles.back, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="arrow-left" size={18} color={colors.foreground} />
        </Pressable>

        <View style={styles.hero}>
          <View style={[styles.plateBadge, { backgroundColor: colors.primary }]}>
            <Text style={[styles.plateText, { color: colors.primaryForeground }]}>{String(province.plate).padStart(2, '0')}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.foreground }]}>{province.name}</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{province.region} bölgesi · {items.length} coğrafi özellik</Text>
          </View>
          <Pressable accessibilityLabel="İsmi seslendir" onPress={() => void speakTurkish(province.name)} hitSlop={8}>
            <Feather name="volume-2" size={18} color={colors.mutedForeground} />
          </Pressable>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Kimlik notu</Text>
          <Text style={[styles.cardBody, { color: colors.foreground }]}>
            {PROVINCE_NOTES[province.name] ?? `${province.name}, ${province.region} bölgesinde yer alır.`}
          </Text>
        </View>

        {itemsByLayer.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Bu ildeki özellikler</Text>
            {itemsByLayer.map(([layerId, layerItems]) => {
              const layer = LAYERS.find((entry) => entry.id === layerId);
              return (
                <View key={layerId} style={[styles.layerGroup, { borderTopColor: colors.border }]}>
                  <Text style={[styles.layerTitle, { color: colors.primary }]}>{layer?.label ?? layerId}</Text>
                  {layerItems.map((item) => (
                    <PressableScale
                      key={item.id}
                      accessibilityRole="button"
                      onPress={() => {
                        void Haptics.selectionAsync();
                        router.push({ pathname: '/', params: { layer: item.layer, itemId: item.id } });
                      }}
                      style={[styles.itemRow, { backgroundColor: colors.muted }]}
                    >
                      <View style={[styles.itemDot, { backgroundColor: MAP_COLORS[item.subtype] ?? colors.primary }]} />
                      <Text style={[styles.itemName, { color: colors.foreground }]} numberOfLines={1}>{item.name}</Text>
                      <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
                    </PressableScale>
                  ))}
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.actions}>
          <PressableScale
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/quiz', params: { mode: 'provinces' } })}
            style={[styles.actionPrimary, { backgroundColor: colors.primary }]}
            testID="province-quiz"
          >
            <Feather name="target" size={15} color={colors.primaryForeground} />
            <Text style={[styles.actionPrimaryText, { color: colors.primaryForeground }]}>İl quiz'ini çöz</Text>
          </PressableScale>
          <PressableScale
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/', params: { province: province.name } })}
            style={[styles.actionSecondary, { backgroundColor: colors.accent }]}
            testID="province-open-map"
          >
            <Feather name="map" size={15} color={colors.primary} />
            <Text style={[styles.actionSecondaryText, { color: colors.primary }]}>Haritada aç</Text>
          </PressableScale>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 12, gap: 14 },
  back: { height: 38, width: 38, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start' },
  missing: { marginTop: 30, fontSize: 14, textAlign: 'center' },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  plateBadge: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  plateText: { fontSize: 17, fontWeight: '700' },
  title: { fontSize: 24, fontWeight: '700', letterSpacing: -0.4 },
  subtitle: { fontSize: 12, marginTop: 3 },
  card: { borderWidth: 1, borderRadius: 20, padding: 15, gap: 8 },
  cardTitle: { fontSize: 13, fontWeight: '700' },
  cardBody: { fontSize: 12, lineHeight: 18 },
  layerGroup: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 10, gap: 7 },
  layerTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 0.7 },
  itemRow: { minHeight: 42, borderRadius: 12, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 9 },
  itemDot: { width: 8, height: 8, borderRadius: 4 },
  itemName: { flex: 1, fontSize: 12, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 9 },
  actionPrimary: { flex: 1, minHeight: 50, borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  actionPrimaryText: { fontSize: 13, fontWeight: '700' },
  actionSecondary: { flex: 1, minHeight: 50, borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  actionSecondaryText: { fontSize: 13, fontWeight: '700' },
});
