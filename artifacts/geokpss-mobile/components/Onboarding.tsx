import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText as Text } from '@/components/AppText';
import { PressableScale } from '@/components/PressableScale';
import { OnboardingHero, ONBOARDING_TEAL } from '@/components/OnboardingVisuals';
import { LAYERS, MAP_ITEMS } from '@/data/geography';
import { itemMcqs, PROVINCE_MCQ } from '@/data/questions';
import { useColors } from '@/hooks/useColors';

const STORAGE_KEY = 'geokpss-onboarded-v2';
const TOTAL_MCQS = PROVINCE_MCQ.length + MAP_ITEMS.reduce((acc, item) => acc + itemMcqs(item).length, 0);

const SLIDES = [
  {
    before: "Türkiye'yi ",
    accent: 'Haritada',
    after: ' Öğren',
    body: `81 il, ${LAYERS.length} interaktif coğrafya katmanı ve ÖSYM formatında ${TOTAL_MCQS}+ soruyla KPSS konularını görsel hafızana kazı.`,
    pills: [
      { icon: 'map' as const, label: 'Dağlar, Ovalar & Platolar' },
      { icon: 'droplet' as const, label: 'Akarsu & Göller' },
      { icon: 'target' as const, label: 'ÖSYM Soru Tipleri', amber: true },
    ],
    cta: 'Başla',
  },
  {
    before: 'Kendini ',
    accent: 'sınav gibi',
    after: ' test et',
    body: 'Dilsiz harita soruları, şıklı çoktan seçmeli sorular ve 15 dakikalık KPSS formatında denemelerle gerçek sınav temposunu yakala.',
    pills: [
      { icon: 'map-pin' as const, label: 'Dilsiz harita modu' },
      { icon: 'clock' as const, label: '15 dk deneme' },
      { icon: 'bar-chart-2' as const, label: 'Anlık geri bildirim', amber: true },
    ],
    cta: 'İleri',
  },
  {
    before: 'Tekrarı ',
    accent: 'şansa bırakma',
    after: '',
    body: 'Yanlış bildiklerin otomatik tekrara düşer; hazır KPSS kodlamaları, il notları ve günlük hatırlatıcılarla unutma eğrisini yen.',
    pills: [
      { icon: 'repeat' as const, label: 'Spaced repetition' },
      { icon: 'bookmark' as const, label: '15+ kodlama' },
      { icon: 'bell' as const, label: 'Hatırlatıcı', amber: true },
    ],
    cta: 'Hemen Başla',
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
            { backgroundColor: colors.background, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 },
          ]}
        >
          <View style={styles.topBar}>
            <View style={styles.brandRow}>
              <View style={[styles.logo, { backgroundColor: ONBOARDING_TEAL.primary }]}>
                <Feather name="compass" size={19} color="#ffffff" />
              </View>
              <Text style={[styles.brand, { color: colors.foreground }]}>GeoKPSS</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Tanıtımı atla"
              onPress={finish}
              hitSlop={10}
              style={({ pressed }) => [styles.skipButton, { backgroundColor: colors.muted, opacity: pressed ? 0.7 : 1 }]}
              testID="onboarding-skip"
            >
              <Text style={[styles.skipText, { color: colors.mutedForeground }]}>Atla</Text>
            </Pressable>
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
            {SLIDES.map((slide, index) => (
              <View key={slide.accent} style={[styles.slidePage, { width }]}>
                <OnboardingHero index={index} />
                <Text style={[styles.slideTitle, { color: colors.foreground }]}>
                  {slide.before}
                  <Text style={[styles.slideTitleAccent, { color: ONBOARDING_TEAL.deepPrimary }]}>{slide.accent}</Text>
                  {slide.after}
                </Text>
                <Text style={[styles.slideBody, { color: colors.mutedForeground }]}>{slide.body}</Text>
                <View style={styles.pillRow}>
                  {slide.pills.map((pill) => (
                    <View
                      key={pill.label}
                      style={[
                        styles.pill,
                        { backgroundColor: 'amber' in pill && pill.amber ? '#fef3e2' : colors.muted },
                      ]}
                    >
                      <Feather
                        name={pill.icon}
                        size={11}
                        color={'amber' in pill && pill.amber ? '#b45309' : colors.mutedForeground}
                      />
                      <Text
                        style={[
                          styles.pillText,
                          { color: 'amber' in pill && pill.amber ? '#b45309' : colors.foreground },
                        ]}
                        numberOfLines={1}
                      >
                        {pill.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.dots}>
              {SLIDES.map((slide, index) => (
                <View
                  key={slide.accent}
                  style={[
                    styles.dot,
                    index === page
                      ? { backgroundColor: ONBOARDING_TEAL.primary, width: 26, height: 8 }
                      : { backgroundColor: colors.muted, width: 8, height: 8 },
                  ]}
                />
              ))}
            </View>
            <PressableScale
              onPress={() => (isLast ? finish() : goTo(page + 1))}
              style={styles.primaryButton}
              testID="onboarding-next"
            >
              <Text style={styles.primaryText}>{SLIDES[page].cta}</Text>
              <Feather name="arrow-right" size={17} color="#ffffff" />
            </PressableScale>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  logo: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  brand: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  skipButton: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999 },
  skipText: { fontSize: 12, fontWeight: '700' },
  pager: { flex: 1 },
  slidePage: { flex: 1, paddingHorizontal: 20, paddingTop: 4 },
  slideTitle: {
    fontSize: 23,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
    marginTop: 12,
  },
  slideTitleAccent: {
    borderBottomWidth: 3,
    borderBottomColor: ONBOARDING_TEAL.amber,
    paddingBottom: 1,
  },
  slideBody: { fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 8, paddingHorizontal: 14 },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    maxWidth: '100%',
  },
  pillText: { fontSize: 10, fontWeight: '700' },
  footer: { paddingHorizontal: 20, paddingTop: 10, gap: 12, alignItems: 'center' },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { borderRadius: 5 },
  primaryButton: {
    alignSelf: 'stretch',
    height: 52,
    borderRadius: 999,
    backgroundColor: ONBOARDING_TEAL.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#0A5A59',
    shadowOpacity: 0.35,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  primaryText: { fontSize: 15, fontWeight: '800', color: '#ffffff' },
  footnote: { fontSize: 10, textAlign: 'center' },
});
