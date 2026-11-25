import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText as Text } from '@/components/AppText';
import { useColors } from '@/hooks/useColors';
import { isReminderEnabled, setReminderEnabled } from '@/utils/reminders';
import { REVIEW_DEMO, REVIEW_QUEUE, REVIEW_QUEUE_TOTAL } from './content';
import { BackBar, SlideFooter } from './OnboardingChrome';
import { CARD_RADIUS, ONBOARDING_PALETTE as P, SCREEN_PADDING } from './theme';

type ReviewSlideProps = {
  onBack: () => void;
  onFinish: () => void;
};

/** Slide 3 — one answered card, the interval ladder and today's review queue. */
export function ReviewSlide({ onBack, onFinish }: ReviewSlideProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [reminderOn, setReminderOn] = useState(false);
  const [reminderBusy, setReminderBusy] = useState(false);

  useEffect(() => {
    let active = true;
    isReminderEnabled()
      .then((enabled) => {
        if (active) setReminderOn(enabled);
      })
      .catch(() => {
        // A missing notification module leaves the switch off.
      });
    return () => {
      active = false;
    };
  }, []);

  const toggleReminder = useCallback(
    (next: boolean) => {
      if (reminderBusy) return;
      setReminderBusy(true);
      setReminderOn(next);
      setReminderEnabled(next)
        .then((applied) => {
          if (!applied) setReminderOn(!next);
        })
        .catch(() => setReminderOn(!next))
        .finally(() => setReminderBusy(false));
    },
    [reminderBusy],
  );

  const cardSurface = { backgroundColor: colors.card, borderColor: colors.border };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.body, { paddingTop: insets.top }]}>
        <BackBar onBack={onBack} />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={[styles.headline, { color: colors.foreground }]}>Tekrar takvimi</Text>
          <Text style={[styles.lead, { color: colors.secondaryForeground }]}>
            Doğru cevap 1, 3, 7, 14 ve 30 gün sonra yeniden sorulur. Yanlış cevap 1 güne döner.
          </Text>

          <View style={[styles.card, cardSurface]}>
            <View style={styles.cardHead}>
              <View style={[styles.chip, { backgroundColor: colors.secondary }]}>
                <Feather name="map-pin" size={12} color={colors.primary} />
                <Text style={[styles.chipText, { color: colors.foreground }]}>{REVIEW_DEMO.layer}</Text>
              </View>
              <Text style={[styles.repeatCount, { color: colors.mutedForeground }]}>{REVIEW_DEMO.repeat}</Text>
            </View>

            <View style={styles.cardBody}>
              <Text style={[styles.question, { color: colors.foreground }]}>{REVIEW_DEMO.question}</Text>

              <View
                style={[
                  styles.answer,
                  { backgroundColor: colors.accent, borderColor: colors.primary },
                ]}
              >
                <Feather name="check" size={16} color={colors.primary} />
                <Text style={[styles.answerText, { color: colors.accentForeground }]}>{REVIEW_DEMO.answer}</Text>
                <Text style={[styles.answerMeta, { color: colors.primary }]}>{REVIEW_DEMO.area}</Text>
              </View>

              <View style={[styles.nextRow, { borderTopColor: colors.border }]}>
                <Text style={[styles.nextLabel, { color: colors.mutedForeground }]}>Sonraki tekrar</Text>
                <Text style={[styles.nextValue, { color: colors.accentForeground }]}>{REVIEW_DEMO.next}</Text>
              </View>

              <View
                style={styles.ladder}
                accessibilityLabel={`Tekrar aralıkları: ${REVIEW_DEMO.intervals.join(', ')} gün`}
              >
                {REVIEW_DEMO.intervals.map((interval, index) => {
                  const isActive = index === REVIEW_DEMO.activeIndex;
                  return (
                    <View key={interval} style={[styles.step, { borderTopColor: colors.border }]}>
                      <View
                        style={[
                          styles.stepTick,
                          { backgroundColor: isActive ? P.amber : colors.border },
                          isActive && styles.stepTickActive,
                        ]}
                      />
                      <Text
                        style={[
                          styles.stepText,
                          { color: isActive ? colors.foreground : colors.mutedForeground },
                          isActive && styles.stepTextActive,
                        ]}
                      >
                        {interval}
                      </Text>
                    </View>
                  );
                })}
                <Text style={[styles.unit, { color: colors.mutedForeground }]}>gün</Text>
              </View>
            </View>
          </View>

          <View style={[styles.card, styles.queue, cardSurface]}>
            <View style={styles.queueHead}>
              <Text style={[styles.queueTitle, { color: colors.foreground }]}>Bugünkü kuyruk</Text>
              <Text style={[styles.queueTotal, { color: colors.primary }]}>{REVIEW_QUEUE_TOTAL} öğe</Text>
            </View>
            {REVIEW_QUEUE.map((row) => (
              <View key={row.name} style={[styles.queueRow, { borderTopColor: colors.border }]}>
                <View style={styles.queueInfo}>
                  <Text style={[styles.queueName, { color: colors.foreground }]} numberOfLines={1}>
                    {row.name}
                  </Text>
                  <Text style={[styles.queueLayer, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {row.layer}
                  </Text>
                </View>
                <View style={[styles.when, { backgroundColor: colors.secondary }]}>
                  <Text style={[styles.whenText, { color: colors.secondaryForeground }]}>{row.due}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={[styles.card, styles.reminder, cardSurface]}>
            <View style={[styles.bell, { backgroundColor: colors.accent }]}>
              <Feather name="bell" size={17} color={colors.primary} />
            </View>
            <View style={styles.reminderText}>
              <Text style={[styles.reminderTitle, { color: colors.foreground }]}>Günlük hatırlatıcı</Text>
              <Text style={[styles.reminderTime, { color: colors.mutedForeground }]}>19:00</Text>
            </View>
            <Switch
              accessibilityLabel="Günlük hatırlatıcı"
              value={reminderOn}
              onValueChange={toggleReminder}
              disabled={reminderBusy}
              trackColor={{ false: colors.secondary, true: colors.primary }}
              thumbColor="#FFFFFF"
              ios_backgroundColor={colors.secondary}
            />
          </View>
        </ScrollView>

        <SlideFooter
          page={2}
          tone="light"
          label="Haritayı aç"
          onPress={onFinish}
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
  lead: { marginTop: 9, fontSize: 13.5, lineHeight: 20, maxWidth: 334 },
  card: {
    marginTop: 16,
    borderWidth: 1,
    borderRadius: CARD_RADIUS,
    shadowColor: '#202539',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 13,
  },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 22, paddingHorizontal: 8, borderRadius: 7 },
  chipText: { fontSize: 11, fontWeight: '600' },
  repeatCount: { fontSize: 11, fontWeight: '600', letterSpacing: 0.2 },
  cardBody: { paddingHorizontal: 14, paddingTop: 11, paddingBottom: 14 },
  question: { marginBottom: 11, fontSize: 17, lineHeight: 23, fontWeight: '600', letterSpacing: -0.25 },
  answer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    height: 46,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  answerText: { flex: 1, fontSize: 14, fontWeight: '600' },
  answerMeta: { fontSize: 11, fontWeight: '600' },
  nextRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 13,
    paddingTop: 11,
    borderTopWidth: 1,
  },
  nextLabel: { fontSize: 11.5, fontWeight: '600', letterSpacing: 0.15 },
  nextValue: { fontSize: 13, fontWeight: '600' },
  ladder: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 11 },
  step: { flex: 1, alignItems: 'center', paddingTop: 9, borderTopWidth: 1 },
  stepTick: { position: 'absolute', top: -1, left: '50%', marginLeft: -0.5, width: 1, height: 9 },
  stepTickActive: { width: 2, marginLeft: -1, height: 14 },
  stepText: { fontSize: 11, fontWeight: '600' },
  stepTextActive: { fontWeight: '700' },
  unit: { marginLeft: 6, marginBottom: 1, fontSize: 10.5, fontWeight: '600', letterSpacing: 0.2 },
  queue: { overflow: 'hidden' },
  queueHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
  },
  queueTitle: { fontSize: 13.5, fontWeight: '600', letterSpacing: -0.1 },
  queueTotal: { fontSize: 11, fontWeight: '600' },
  queueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderTopWidth: 1,
  },
  queueInfo: { flex: 1, minWidth: 0 },
  queueName: { fontSize: 13, fontWeight: '600', letterSpacing: -0.1 },
  queueLayer: { marginTop: 1, fontSize: 10.5, fontWeight: '500' },
  when: { height: 22, paddingHorizontal: 8, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  whenText: { fontSize: 10.5, fontWeight: '600' },
  reminder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 6,
  },
  bell: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  reminderText: { flex: 1 },
  reminderTitle: { fontSize: 13.5, fontWeight: '600', letterSpacing: -0.1 },
  reminderTime: { marginTop: 1, fontSize: 11.5, fontWeight: '500' },
});
