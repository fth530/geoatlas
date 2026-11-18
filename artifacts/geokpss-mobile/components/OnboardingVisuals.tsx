import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, StyleProp, View, ViewStyle } from 'react-native';
import Svg, { Circle, Defs, Ellipse, LinearGradient as SvgGradient, Path, Stop } from 'react-native-svg';
import { LAYERS } from '@/data/geography';
import { AppText as Text } from '@/components/AppText';

export const ONBOARDING_TEAL = {
  deep: '#052627',
  mid: '#0b3c3e',
  primary: '#0e7c7b',
  deepPrimary: '#006161',
  amber: '#fea619',
  amberText: '#684000',
  fixed: '#98f2f0',
} as const;

const GRADIENT_COLORS = ['#062426', '#0b3c3e', ONBOARDING_TEAL.primary] as const;

function HeroCard({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <LinearGradient
      colors={[...GRADIENT_COLORS]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={[styles.heroCard, style]}
    >
      {children}
    </LinearGradient>
  );
}

function TopBadges({ left, right }: { left: string; right: string }) {
  return (
    <View style={styles.badgeRow}>
      <View style={[styles.badge, styles.badgeDark]}>
        <Feather name="check-circle" size={12} color={ONBOARDING_TEAL.amber} />
        <Text style={styles.badgeCaps}>{left}</Text>
      </View>
      <View style={[styles.badge, styles.badgeGlass]}>
        <View style={styles.liveDot} />
        <Text style={styles.badgeCapsLight}>{right}</Text>
      </View>
    </View>
  );
}

function FloatingPill({
  icon,
  label,
  position,
  amber = false,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  position: 'tl' | 'tr' | 'br';
  amber?: boolean;
}) {
  return (
    <View
      style={[
        styles.floatingPill,
        position === 'tl' && { top: 10, left: 10, transform: [{ rotate: '-2deg' }] },
        position === 'tr' && { top: 52, right: 10, transform: [{ rotate: '2deg' }] },
        position === 'br' && { bottom: 10, right: 10, transform: [{ rotate: '2deg' }] },
        amber && { backgroundColor: ONBOARDING_TEAL.amber },
      ]}
    >
      <Feather name={icon} size={13} color={amber ? ONBOARDING_TEAL.amberText : ONBOARDING_TEAL.primary} />
      <Text style={[styles.floatingPillText, amber && { color: ONBOARDING_TEAL.amberText }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const TURKEY_PATH =
  'M 68 85 C 92 78, 120 70, 142 80 C 160 88, 172 96, 185 88 C 205 76, 218 56, 240 50 C 268 42, 290 62, 320 62 C 350 62, 380 40, 420 48 C 452 54, 480 84, 520 90 C 560 96, 610 88, 642 120 C 655 133, 638 165, 625 186 C 610 210, 595 240, 555 242 C 520 244, 500 215, 470 218 C 430 222, 400 262, 350 258 C 300 254, 280 230, 240 232 C 200 234, 180 258, 150 252 C 120 246, 110 210, 80 198 C 50 186, 32 165, 40 140 C 45 125, 52 90, 68 85 Z';
const TRAKYA_PATH = 'M 52 48 C 70 38, 98 42, 108 58 C 114 68, 102 82, 85 86 C 68 90, 42 75, 45 60 Z';

const PINS: { x: number; y: number; color: string; r: number }[] = [
  { x: 132, y: 80, color: ONBOARDING_TEAL.deepPrimary, r: 6 },
  { x: 372, y: 230, color: ONBOARDING_TEAL.amber, r: 6 },
  { x: 578, y: 162, color: ONBOARDING_TEAL.deepPrimary, r: 5 },
  { x: 85, y: 175, color: ONBOARDING_TEAL.deepPrimary, r: 5 },
];

function Slide1Visual() {
  return (
    <HeroCard>
      <TopBadges left="KPSS 18/18 COĞRAFYA HEDEFİ" right="Canlı Modül" />
      <View style={styles.mapWrap}>
        <Svg viewBox="0 0 680 340" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
          <Defs>
            <SvgGradient id="turkey-land" x1="50" y1="50" x2="620" y2="300" gradientUnits="userSpaceOnUse">
              <Stop offset="0%" stopColor="#FDFBF7" />
              <Stop offset="55%" stopColor="#F4EEDC" />
              <Stop offset="100%" stopColor="#EBE3CD" />
            </SvgGradient>
          </Defs>
          <Path d={TURKEY_PATH} fill="url(#turkey-land)" stroke="rgba(255,255,255,0.7)" strokeWidth={2} />
          <Path d={TRAKYA_PATH} fill="url(#turkey-land)" opacity={0.95} />
          <Path
            d="M 170 218 Q 280 240 380 215 T 510 200"
            opacity={0.6}
            stroke={ONBOARDING_TEAL.primary}
            strokeDasharray="4 4"
            strokeWidth={2.5}
            fill="none"
          />
          <Path
            d="M 230 76 Q 340 70 440 90 T 560 115"
            opacity={0.5}
            stroke={ONBOARDING_TEAL.primary}
            strokeDasharray="3 3"
            strokeWidth={2}
            fill="none"
          />
          <Ellipse cx={575} cy={165} rx={20} ry={12} fill={ONBOARDING_TEAL.primary} opacity={0.55} />
          <Ellipse cx={320} cy={165} rx={14} ry={9} fill={ONBOARDING_TEAL.primary} opacity={0.35} />
          {PINS.map((pin, i) => (
            <React.Fragment key={i}>
              <Circle cx={pin.x} cy={pin.y} r={pin.r + 9} fill={pin.color} opacity={0.3} />
              <Circle cx={pin.x} cy={pin.y} r={pin.r} fill={pin.color} stroke="#FFFFFF" strokeWidth={2} />
            </React.Fragment>
          ))}
        </Svg>
      </View>
      <FloatingPill icon="layers" label={`${LAYERS.length} Tematik Katman`} position="tl" />
      <FloatingPill icon="map-pin" label="81 İl & Havza" position="br" />
      <FloatingPill icon="zap" label="ÖSYM Formatı" position="tr" amber />
      <View style={styles.hintRow}>
        <Feather name="compass" size={13} color="rgba(152,242,240,0.85)" />
        <Text style={styles.hintText}>Haritadaki noktalara dokun ve keşfet</Text>
      </View>
    </HeroCard>
  );
}

const QUIZ_OPTIONS = [
  { key: 'A', label: 'Tektonik', correct: false },
  { key: 'B', label: 'Karma Oluşumlu (Volkanik Set)', correct: true },
  { key: 'C', label: 'Karstik', correct: false },
  { key: 'D', label: 'Buzul (Sirk)', correct: false },
];

function Slide2Visual() {
  return (
    <HeroCard>
      <TopBadges left="KPSS 18/18 DENEME TESTİ" right="15 Dk Süreli" />
      <View style={styles.quizCard}>
        <View style={styles.quizMetaRow}>
          <View style={styles.quizPill}>
            <Text style={styles.quizPillText}>COĞRAFYA · SORU 7/18</Text>
          </View>
          <Feather name="bookmark" size={14} color="rgba(62,73,72,0.5)" />
        </View>
        <Text style={styles.quizQuestion}>Van Gölü hangi göl oluşum tipindedir?</Text>
        {QUIZ_OPTIONS.map((opt) => (
          <View key={opt.key} style={[styles.quizOption, opt.correct && styles.quizOptionCorrect]}>
            <View style={[styles.quizOptionKey, opt.correct && styles.quizOptionKeyCorrect]}>
              <Text style={[styles.quizOptionKeyText, opt.correct && { color: ONBOARDING_TEAL.primary }]}>{opt.key}</Text>
            </View>
            <Text style={[styles.quizOptionText, opt.correct && { color: ONBOARDING_TEAL.deepPrimary }]} numberOfLines={1}>
              {opt.label}
            </Text>
            {opt.correct && <Feather name="check-circle" size={15} color={ONBOARDING_TEAL.primary} />}
          </View>
        ))}
      </View>
      <View style={styles.accuracyBadge}>
        <Text style={styles.accuracyValue}>%87</Text>
        <Text style={styles.accuracyLabel}>Başarı Oranı</Text>
      </View>
    </HeroCard>
  );
}

const WEEK_DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

function Slide3Visual() {
  return (
    <HeroCard>
      <View style={styles.badgeRow}>
        <View style={[styles.badge, { backgroundColor: 'rgba(0,0,0,0.3)' }]}>
          <Feather name="zap" size={12} color={ONBOARDING_TEAL.amber} />
          <Text style={[styles.badgeCaps, { color: ONBOARDING_TEAL.amber }]}>7 Günlük Seri</Text>
        </View>
        <View style={[styles.badge, styles.badgeGlass]}>
          <Feather name="clock" size={12} color={ONBOARDING_TEAL.fixed} />
          <Text style={styles.badgeCapsLight}>Akıllı Tekrar</Text>
        </View>
      </View>
      <View style={styles.weekStrip}>
        {WEEK_DAYS.map((day, i) => {
          const filled = i < 4;
          const today = i === 4;
          return (
            <View key={day} style={styles.weekDay}>
              <Text style={styles.weekDayLabel}>{day}</Text>
              <View
                style={[
                  styles.weekDot,
                  filled && { backgroundColor: ONBOARDING_TEAL.fixed },
                  today && { backgroundColor: ONBOARDING_TEAL.amber },
                ]}
              >
                {filled || today ? (
                  <Feather name="check" size={12} color={today ? '#3d2c00' : ONBOARDING_TEAL.deepPrimary} />
                ) : null}
              </View>
            </View>
          );
        })}
      </View>
      <View style={styles.flashcard}>
        <View style={styles.flashcardPill}>
          <Text style={styles.flashcardPillText}>COĞRAFYA · BİLGİ KARTI</Text>
        </View>
        <Text style={styles.flashcardQuestion}>Türkiye'nin en uzun akarsuyu hangisidir?</Text>
        <View style={styles.flashcardAnswerRow}>
          <Feather name="refresh-cw" size={13} color={ONBOARDING_TEAL.primary} />
          <Text style={styles.flashcardAnswer}>Kızılırmak (1.355 km)</Text>
        </View>
      </View>
      <FloatingPill icon="repeat" label="Tekrar Zamanı Geldi" position="br" />
    </HeroCard>
  );
}

export function OnboardingHero({ index }: { index: number }) {
  if (index === 0) return <Slide1Visual />;
  if (index === 1) return <Slide2Visual />;
  return <Slide3Visual />;
}

const styles = StyleSheet.create({
  heroCard: {
    borderRadius: 24,
    padding: 14,
    overflow: 'hidden',
    gap: 10,
  },
  badgeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeDark: { backgroundColor: 'rgba(0,0,0,0.28)' },
  badgeGlass: { backgroundColor: 'rgba(255,255,255,0.14)' },
  badgeCaps: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8, color: ONBOARDING_TEAL.fixed },
  badgeCapsLight: { fontSize: 9, fontWeight: '700', letterSpacing: 0.6, color: 'rgba(255,255,255,0.85)' },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: ONBOARDING_TEAL.amber },
  mapWrap: { flex: 1, minHeight: 150, alignItems: 'center', justifyContent: 'center' },
  hintRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  hintText: { fontSize: 11, fontWeight: '600', color: 'rgba(152,242,240,0.85)' },
  floatingPill: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  floatingPillText: { fontSize: 9, fontWeight: '800', color: '#191c1c', letterSpacing: 0.2 },
  quizCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  quizMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  quizPill: {
    backgroundColor: '#e6f7f6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  quizPillText: { fontSize: 8, fontWeight: '800', letterSpacing: 0.7, color: ONBOARDING_TEAL.deepPrimary },
  quizQuestion: { fontSize: 13, fontWeight: '800', color: '#191c1c', lineHeight: 18 },
  quizOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f2f4f3',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  quizOptionCorrect: {
    backgroundColor: 'rgba(152,242,240,0.25)',
    borderWidth: 1,
    borderColor: ONBOARDING_TEAL.primary,
  },
  quizOptionKey: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: '#e1e3e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quizOptionKeyCorrect: { backgroundColor: '#ffffff' },
  quizOptionKeyText: { fontSize: 10, fontWeight: '800', color: '#3e4948' },
  quizOptionText: { flex: 1, fontSize: 11, fontWeight: '600', color: '#3e4948' },
  accuracyBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 7,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  accuracyValue: { fontSize: 15, fontWeight: '800', color: ONBOARDING_TEAL.deepPrimary },
  accuracyLabel: { fontSize: 8, fontWeight: '700', color: '#3e4948' },
  weekStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderRadius: 14,
    padding: 8,
  },
  weekDay: { flex: 1, alignItems: 'center', gap: 4 },
  weekDayLabel: { fontSize: 8, fontWeight: '700', color: 'rgba(255,255,255,0.65)', letterSpacing: 0.4 },
  weekDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  flashcard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  flashcardPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#e6f7f6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  flashcardPillText: { fontSize: 8, fontWeight: '800', letterSpacing: 0.7, color: ONBOARDING_TEAL.deepPrimary },
  flashcardQuestion: { fontSize: 13, fontWeight: '800', color: '#191c1c', lineHeight: 18 },
  flashcardAnswerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  flashcardAnswer: { fontSize: 12, fontWeight: '800', color: ONBOARDING_TEAL.primary },
});
