import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText as Text } from '@/components/AppText';
import { ONBOARDING_STATS, WELCOME_COPY } from './content';
import { BrandBar, SlideFooter } from './OnboardingChrome';
import { ONBOARDING_PALETTE as P, PLATE_RADIUS, SCREEN_PADDING } from './theme';
import { TurkeyPlate } from './TurkeyPlate';

type WelcomeSlideProps = {
  onNext: () => void;
  onSkip: () => void;
};

/**
 * Slide 1 — the whole country on one pafta plate. Everything else is quiet so
 * the map and the single amber marker carry the screen.
 */
export function WelcomeSlide({ onNext, onSkip }: WelcomeSlideProps) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={[P.glow, P.deep, P.bottom]}
      locations={[0, 0.48, 1]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.screen}
    >
      <View style={[styles.body, { paddingTop: insets.top }]}>
        <BrandBar onSkip={onSkip} />

        <View style={styles.copy}>
          <Text style={styles.headline}>{WELCOME_COPY.headline}</Text>
          <Text style={styles.lead}>{WELCOME_COPY.body}</Text>
        </View>

        <View style={styles.plate}>
          <View style={styles.plateMap}>
            <TurkeyPlate showLabels pin />
          </View>
          <View style={styles.plateFoot}>
            <View style={styles.scaleRow}>
              <View style={styles.scaleBar}>
                <View style={styles.scaleBarTick} />
              </View>
              <Text style={styles.scaleLabel}>200 km</Text>
            </View>
            <View style={styles.legend}>
              {ONBOARDING_STATS.map((stat, index) => (
                <View key={stat.label} style={[styles.legendCell, index > 0 && styles.legendCellDivider]}>
                  <Text style={styles.legendValue}>{stat.value}</Text>
                  <Text style={styles.legendLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <SlideFooter
          page={0}
          tone="dark"
          label="İleri"
          onPress={onNext}
          bottomInset={insets.bottom}
          testID="onboarding-next"
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { flex: 1 },
  copy: { paddingHorizontal: SCREEN_PADDING, paddingTop: 12 },
  headline: {
    fontSize: 30,
    lineHeight: 35,
    fontWeight: '700',
    letterSpacing: -0.9,
    color: P.cream,
  },
  lead: {
    marginTop: 10,
    fontSize: 13.5,
    lineHeight: 20,
    color: P.creamBody,
    maxWidth: 322,
  },
  plate: {
    flex: 1,
    marginHorizontal: SCREEN_PADDING,
    marginTop: 16,
    borderWidth: 1,
    borderColor: P.creamLine,
    borderRadius: PLATE_RADIUS,
    overflow: 'hidden',
  },
  plateMap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
  plateFoot: {
    borderTopWidth: 1,
    borderTopColor: P.creamLineSoft,
    paddingHorizontal: 16,
    paddingTop: 11,
    paddingBottom: 13,
  },
  scaleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  scaleBar: {
    width: 52,
    height: 7,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: 'rgba(244,238,220,0.4)',
    justifyContent: 'flex-start',
  },
  scaleBarTick: {
    position: 'absolute',
    left: '50%',
    top: 0,
    width: 1,
    height: 7,
    backgroundColor: 'rgba(244,238,220,0.4)',
  },
  scaleLabel: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: P.creamMuted,
  },
  legend: { flexDirection: 'row' },
  legendCell: { flex: 1 },
  legendCellDivider: { borderLeftWidth: 1, borderLeftColor: P.creamLineSoft, paddingLeft: 14 },
  legendValue: { fontSize: 15.5, fontWeight: '600', letterSpacing: -0.3, color: P.cream },
  legendLabel: {
    marginTop: 1,
    fontSize: 9.5,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: 'rgba(244,238,220,0.48)',
  },
});
