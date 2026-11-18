import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText as Text } from '@/components/AppText';
import { LAYERS, MAP_ITEMS } from '@/data/geography';
import { itemMcqs, PROVINCE_MCQ } from '@/data/questions';
import { useColors } from '@/hooks/useColors';

const STORAGE_KEY = 'geokpss-onboarded-v1';
const TOTAL_MCQS = PROVINCE_MCQ.length + MAP_ITEMS.reduce((acc, item) => acc + itemMcqs(item).length, 0);

const SLIDES = [
  {
    icon: 'map' as const,
    title: 'Haritada keşfet',
    body: `${LAYERS.length} coğrafya katmanında ${MAP_ITEMS.length} harita öğesini ve 81 ili interaktif Türkiye haritasında incele.`,
  },
  {
    icon: 'target' as const,
    title: 'Quiz ve deneme çöz',
    body: `Dilsiz harita soruları, ${TOTAL_MCQS} çoktan seçmeli soru ve 18 soruluk KPSS denemeleriyle kendini test et.`,
  },
  {
    icon: 'trending-up' as const,
    title: 'Tekrarı şansa bırakma',
    body: 'Yanlış bildiklerin otomatik tekrara düşer; hazır KPSS kodlamaları, not defteri ve günlük hatırlatıcıyla takip et.',
  },
];

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [visible, setVisible] = useState(false);
  const [page, setPage] = useState(0);
  const pagerRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const isLast = page === SLIDES.length - 1;

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (active && saved !== '1') setVisible(true);
      })
      .catch(() => {
        if (active) setVisible(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const finish = () => {
    setVisible(false);
    void AsyncStorage.setItem(STORAGE_KEY, '1');
  };

  const goTo = (index: number) => {
    const clamped = Math.max(0, Math.min(SLIDES.length - 1, index));
    pagerRef.current?.scrollTo({ x: clamped * width, animated: true });
    setPage(clamped);
  };

  const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setPage(Math.round(event.nativeEvent.contentOffset.x / width));
  };

  return (
    <>
      {children}
      <Modal visible={visible} animationType="fade" onRequestClose={finish}>
        <View
          style={[
            styles.screen,
            { backgroundColor: colors.background, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 20 },
          ]}
        >
          <View style={styles.topBar}>
            <View style={styles.brandRow}>
              <View style={[styles.logo, { backgroundColor: colors.primary }]}>
                <Feather name="map" size={20} color={colors.primaryForeground} />
              </View>
              <Text style={[styles.brand, { color: colors.primary }]}>GeoKPSS</Text>
            </View>
            {!isLast && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Tanıtımı atla"
                onPress={finish}
                hitSlop={10}
                style={({ pressed }) => [styles.skipButton, { opacity: pressed ? 0.6 : 1 }]}
                testID="onboarding-skip"
              >
                <Text style={[styles.skipText, { color: colors.mutedForeground }]}>Atla</Text>
              </Pressable>
            )}
          </View>

          <ScrollView
            ref={pagerRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onScrollEnd}
            scrollEventThrottle={16}
            style={styles.pager}
            contentContainerStyle={{ width: width * SLIDES.length }}
          >
            {SLIDES.map((slide) => (
              <View key={slide.title} style={[styles.slidePage, { width }]}>
                <View style={[styles.slideArt, { backgroundColor: colors.accent }]}>
                  <View style={[styles.slideRing, { borderColor: colors.primary }]} />
                  <Feather name={slide.icon} size={30} color={colors.primary} />
                </View>
                <Text style={[styles.slideTitle, { color: colors.foreground }]}>{slide.title}</Text>
                <Text style={[styles.slideBody, { color: colors.mutedForeground }]}>{slide.body}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.dots}>
              {SLIDES.map((slide, index) => (
                <View
                  key={slide.title}
                  style={[
                    styles.dot,
                    {
                      backgroundColor: index === page ? colors.primary : colors.muted,
                      width: index === page ? 20 : 7,
                    },
                  ]}
                />
              ))}
            </View>
            <Pressable
              onPress={() => (isLast ? finish() : goTo(page + 1))}
              style={({ pressed }) => [
                styles.primaryButton,
                { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
              ]}
              testID="onboarding-next"
            >
              <Text style={[styles.primaryText, { color: colors.primaryForeground }]}>
                {isLast ? 'Keşfetmeye başla' : 'İleri'}
              </Text>
              <Feather name={isLast ? 'arrow-right' : 'chevron-right'} size={18} color={colors.primaryForeground} />
            </Pressable>
            {isLast && (
              <Text style={[styles.footnote, { color: colors.mutedForeground }]}>
                Tüm içerik çevrimdışı çalışır; verilerin bu cihazda saklanır.
              </Text>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  brand: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
  skipButton: { paddingHorizontal: 10, paddingVertical: 8 },
  skipText: { fontSize: 13, fontWeight: '600' },
  pager: { flex: 1, marginTop: Platform.OS === 'web' ? 40 : 24 },
  slidePage: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 34, gap: 14 },
  slideArt: {
    width: 108,
    height: 108,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  slideRing: {
    position: 'absolute',
    width: 132,
    height: 132,
    borderRadius: 44,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    opacity: 0.5,
  },
  slideTitle: { fontSize: 24, fontWeight: '700', letterSpacing: -0.5, textAlign: 'center' },
  slideBody: { fontSize: 13, lineHeight: 20, textAlign: 'center', maxWidth: 300 },
  footer: { paddingHorizontal: 24, gap: 16, alignItems: 'center' },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { height: 7, borderRadius: 4 },
  primaryButton: {
    alignSelf: 'stretch',
    minHeight: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryText: { fontSize: 15, fontWeight: '700' },
  footnote: { fontSize: 10, textAlign: 'center' },
});
