import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText as Text } from '@/components/AppText';
import { useColors } from '@/hooks/useColors';
import { QUIZ_DEMO } from './content';
import { BackBar, SlideFooter } from './OnboardingChrome';
import { CARD_RADIUS, ONBOARDING_PALETTE as P, SCREEN_PADDING } from './theme';
import { TurkeyPlate } from './TurkeyPlate';

type QuizSlideProps = {
  onBack: () => void;
  onSkip: () => void;
  onNext: () => void;
};

const OPTION_KEYS = ['A', 'B', 'C', 'D'];

/** Slide 2 — a real question, already answered, so the quiz explains itself. */
export function QuizSlide({ onBack, onSkip, onNext }: QuizSlideProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.body, { paddingTop: insets.top }]}>
        <BackBar onBack={onBack} onSkip={onSkip} />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={[styles.headline, { color: colors.foreground }]}>Dilsiz harita quizi</Text>
          <Text style={[styles.lead, { color: colors.secondaryForeground }]}>
            İşaretli yeri haritada bul, dört şıktan seç. Cevaptan sonra doğrusu ve kısa açıklaması görünür.
          </Text>

          <View
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            accessible
            accessibilityLabel={`Örnek soru. ${QUIZ_DEMO.question} Doğru cevap: ${QUIZ_DEMO.options[QUIZ_DEMO.answerIndex]}. ${QUIZ_DEMO.tip}`}
          >
            <View
              style={[styles.mapBand, { backgroundColor: P.platePaper, borderBottomColor: colors.border }]}
            >
              <TurkeyPlate width={270} pin />
            </View>

            <View style={styles.cardBody}>
              <View style={styles.meta}>
                <View style={[styles.chip, { backgroundColor: colors.secondary }]}>
                  <Feather name="map-pin" size={12} color={colors.primary} />
                  <Text style={[styles.chipText, { color: colors.foreground }]}>{QUIZ_DEMO.layer}</Text>
                </View>
                <Text style={[styles.counter, { color: colors.mutedForeground }]}>{QUIZ_DEMO.counter}</Text>
              </View>

              <Text style={[styles.question, { color: colors.foreground }]}>{QUIZ_DEMO.question}</Text>

              {QUIZ_DEMO.options.map((option, index) => {
                const isCorrect = index === QUIZ_DEMO.answerIndex;
                return (
                  <View
                    key={option}
                    style={[
                      styles.option,
                      {
                        backgroundColor: isCorrect ? colors.accent : colors.secondary,
                        borderColor: isCorrect ? colors.primary : 'transparent',
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.key,
                        {
                          backgroundColor: isCorrect ? colors.primary : colors.card,
                          borderColor: isCorrect ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.keyText,
                          { color: isCorrect ? colors.primaryForeground : colors.secondaryForeground },
                        ]}
                      >
                        {OPTION_KEYS[index]}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.optionText,
                        {
                          color: isCorrect ? colors.accentForeground : colors.foreground,
                          fontWeight: isCorrect ? '600' : '500',
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {option}
                    </Text>
                    {isCorrect ? <Feather name="check" size={16} color={colors.primary} /> : null}
                  </View>
                );
              })}

              <View style={[styles.tip, { borderTopColor: colors.border }]}>
                <Feather name="info" size={14} color={colors.primary} style={styles.tipIcon} />
                <Text style={[styles.tipText, { color: colors.secondaryForeground }]}>{QUIZ_DEMO.tip}</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <SlideFooter
          page={1}
          tone="light"
          label="İleri"
          onPress={onNext}
          bottomInset={insets.bottom}
          testID="onboarding-next"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { flex: 1 },
  content: { paddingHorizontal: SCREEN_PADDING, paddingTop: 14, paddingBottom: 10 },
  headline: { fontSize: 30, lineHeight: 35, fontWeight: '700', letterSpacing: -0.85 },
  lead: { marginTop: 9, fontSize: 13.5, lineHeight: 20, maxWidth: 330 },
  card: {
    marginTop: 16,
    borderWidth: 1,
    borderRadius: CARD_RADIUS,
    overflow: 'hidden',
    shadowColor: '#202539',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  mapBand: {
    height: 148,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderBottomWidth: 1,
  },
  cardBody: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 13 },
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 22, paddingHorizontal: 8, borderRadius: 7 },
  chipText: { fontSize: 11, fontWeight: '600' },
  counter: { fontSize: 11, fontWeight: '600', letterSpacing: 0.2 },
  question: { marginBottom: 11, fontSize: 16, lineHeight: 22, fontWeight: '600', letterSpacing: -0.2 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 45,
    paddingHorizontal: 11,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 7,
  },
  key: {
    width: 21,
    height: 21,
    borderRadius: 7,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: { fontSize: 10.5, fontWeight: '700' },
  optionText: { flex: 1, fontSize: 13.5 },
  tip: {
    flexDirection: 'row',
    gap: 7,
    marginTop: 12,
    paddingTop: 11,
    borderTopWidth: 1,
  },
  tipIcon: { marginTop: 1 },
  tipText: { flex: 1, fontSize: 11.5, lineHeight: 16, fontWeight: '500' },
});
