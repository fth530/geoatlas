import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { DimensionValue } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AppText as Text } from '@/components/AppText';
import { useColors } from '@/hooks/useColors';
import { CTA_HEIGHT, ONBOARDING_PALETTE as P, ONBOARDING_STEPS, SCREEN_PADDING } from './theme';

export type OnboardingTone = 'dark' | 'light';

const TICK_LEFT = (step: number) => `${(step / ONBOARDING_STEPS) * 100}%` as DimensionValue;

/** Brand row used on the welcome screen. */
export function BrandBar({ onSkip }: { onSkip: () => void }) {
  return (
    <View style={styles.bar}>
      <View style={styles.brand}>
        <View style={styles.mark}>
          <Feather name="compass" size={15} color={P.cream} />
        </View>
        <Text style={styles.brandName}>GeoKPSS</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Tanıtımı atla"
        onPress={onSkip}
        hitSlop={8}
        style={styles.skipHit}
        testID="onboarding-skip"
      >
        <Text style={styles.skipDark}>Atla</Text>
      </Pressable>
    </View>
  );
}

/** Back + skip row used on the two step screens. */
export function BackBar({ onBack, onSkip }: { onBack: () => void; onSkip?: () => void }) {
  const colors = useColors();
  return (
    <View style={styles.bar}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Önceki adım"
        onPress={onBack}
        style={[styles.backButton, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <Feather name="chevron-left" size={16} color={colors.foreground} />
      </Pressable>
      {onSkip ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tanıtımı atla"
          onPress={onSkip}
          hitSlop={8}
          style={styles.skipHit}
          testID="onboarding-skip"
        >
          <Text style={[styles.skipLight, { color: colors.mutedForeground }]}>Atla</Text>
        </Pressable>
      ) : (
        <View style={styles.barSpacer} />
      )}
    </View>
  );
}

/**
 * Cartographic scale-bar progress: one thin rule, three ticks, amber only up to
 * the step you are on.
 */
export function ScaleProgress({ page, tone }: { page: number; tone: OnboardingTone }) {
  const colors = useColors();
  const track = tone === 'dark' ? P.creamTrack : colors.border;
  const tick = tone === 'dark' ? P.creamTick : '#CBD2DE';
  const isLast = page === ONBOARDING_STEPS - 1;

  return (
    <View
      style={styles.progress}
      accessibilityRole="progressbar"
      accessibilityLabel={`Adım ${page + 1} / ${ONBOARDING_STEPS}`}
      accessibilityValue={{ min: 1, max: ONBOARDING_STEPS, now: page + 1 }}
    >
      <View style={[styles.progressTrack, { backgroundColor: track }]} />
      <View
        style={[
          styles.progressFill,
          { backgroundColor: P.amber, width: `${((page + 1) / ONBOARDING_STEPS) * 100}%` as DimensionValue },
          isLast && styles.progressFillLast,
        ]}
      />
      {Array.from({ length: ONBOARDING_STEPS }, (_, index) => (
        <View key={index} style={[styles.progressTick, { backgroundColor: tick, left: TICK_LEFT(index + 1) }]} />
      ))}
    </View>
  );
}

type FooterProps = {
  page: number;
  tone: OnboardingTone;
  label: string;
  onPress: () => void;
  bottomInset: number;
  testID?: string;
};

export function SlideFooter({ page, tone, label, onPress, bottomInset, testID }: FooterProps) {
  const colors = useColors();
  const isDark = tone === 'dark';

  return (
    <View style={[styles.footer, { paddingBottom: bottomInset + 12 }]}>
      <ScaleProgress page={page} tone={tone} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        style={({ pressed }) => [
          styles.cta,
          isDark
            ? { backgroundColor: P.cream, shadowColor: '#000' }
            : { backgroundColor: colors.primary, shadowColor: colors.primary },
          pressed && styles.ctaPressed,
        ]}
        testID={testID}
      >
        <Text style={[styles.ctaText, { color: isDark ? P.bottom : colors.primaryForeground }]}>{label}</Text>
        <Feather name="arrow-right" size={17} color={isDark ? P.bottom : colors.primaryForeground} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: 2,
    height: 46,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  mark: {
    width: 29,
    height: 29,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(244,238,220,0.34)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: { fontSize: 15.5, fontWeight: '600', letterSpacing: -0.2, color: P.cream },
  skipHit: { minWidth: 44, height: 44, alignItems: 'flex-end', justifyContent: 'center' },
  skipDark: { fontSize: 13, fontWeight: '600', color: 'rgba(244,238,220,0.62)' },
  skipLight: { fontSize: 13, fontWeight: '600' },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#202539',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  barSpacer: { width: 34, height: 34 },
  progress: { height: 7, marginBottom: 14 },
  progressTrack: { position: 'absolute', left: 0, right: 0, top: 3, height: 1 },
  progressFill: { position: 'absolute', left: 0, top: 2, height: 3, borderRadius: 99 },
  progressFillLast: { right: 0 },
  progressTick: { position: 'absolute', top: 0, width: 1, height: 7 },
  footer: { paddingHorizontal: SCREEN_PADDING, paddingTop: 14 },
  cta: {
    height: CTA_HEIGHT,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  ctaPressed: { transform: [{ scale: 0.985 }], opacity: 0.92 },
  ctaText: { fontSize: 15, fontWeight: '600', letterSpacing: -0.1 },
});
