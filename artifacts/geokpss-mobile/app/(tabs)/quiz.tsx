import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapItem, MAP_ITEMS } from '@/data/geography';
import { PROVINCES, TurkeyMap } from '@/components/TurkeyMap';
import { useStudy } from '@/context/StudyContext';
import { useColors } from '@/hooks/useColors';

type QuizMode = 'provinces' | 'mountains' | 'lakes';
type AnswerResult = { province: string; correct: boolean };

const PROVINCE_QUESTIONS = ['Ardahan', 'Samsun', 'Şanlıurfa', 'Kars', 'Ağrı', 'Hatay', 'Zonguldak', 'Rize', 'Burdur', 'Kayseri'];
const MODE_OPTIONS: { id: QuizMode; label: string }[] = [
  { id: 'provinces', label: 'İller' },
  { id: 'mountains', label: 'Dağlar' },
  { id: 'lakes', label: 'Göller' },
];

export default function QuizScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { answered, correct, recordQuizAnswer } = useStudy();
  const [mode, setMode] = useState<QuizMode>('provinces');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState<AnswerResult | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);

  const featureQuestions = useMemo<MapItem[]>(
    () => MAP_ITEMS.filter((item) => item.layer === mode),
    [mode],
  );
  const targetItem = mode === 'provinces' ? null : featureQuestions[questionIndex % Math.max(featureQuestions.length, 1)];
  const targetProvince = mode === 'provinces'
    ? PROVINCE_QUESTIONS[questionIndex % PROVINCE_QUESTIONS.length]
    : targetItem?.provinces[0] ?? 'Ankara';
  const targetName = mode === 'provinces' ? targetProvince : targetItem?.name ?? 'Harita özelliği';
  const correctProvinces = answer?.correct ? (mode === 'provinces' ? [targetProvince] : targetItem?.provinces ?? []) : [];
  const wrongProvince = answer && !answer.correct ? answer.province : null;

  const changeMode = (nextMode: QuizMode) => {
    setMode(nextMode);
    setQuestionIndex(0);
    setAnswer(null);
    setSelectedProvince(null);
  };

  const chooseProvince = (province: string) => {
    if (answer) return;
    const isCorrect = mode === 'provinces'
      ? province === targetProvince
      : Boolean(targetItem?.provinces.includes(province));
    setSelectedProvince(province);
    setAnswer({ province, correct: isCorrect });
    recordQuizAnswer(isCorrect);
    if (isCorrect) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  };

  const nextQuestion = () => {
    setQuestionIndex((index) => index + 1);
    setAnswer(null);
    setSelectedProvince(null);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: Platform.OS === 'web' ? 16 : insets.top }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 110 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.eyebrow, { color: colors.primary }]}>HARİTA PRATİĞİ</Text>
            <Text style={[styles.title, { color: colors.foreground }]}>Haritada bul</Text>
          </View>
          <View style={[styles.scorePill, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="target" size={15} color={colors.primary} />
            <Text style={[styles.scoreText, { color: colors.foreground }]}>{correct}/{answered}</Text>
          </View>
        </View>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Doğru yeri dilsiz haritada seç. Yanlış cevap haritada kırmızıyla işaretlenir.</Text>

        <View style={[styles.modeSwitch, { backgroundColor: colors.muted }]}>
          {MODE_OPTIONS.map((option) => {
            const active = mode === option.id;
            return (
              <Pressable key={option.id} onPress={() => changeMode(option.id)} style={[styles.modeOption, active && { backgroundColor: colors.card }]}>
                <Text style={[styles.modeText, { color: active ? colors.foreground : colors.mutedForeground }]}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.promptCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.promptTop}>
            <Text style={[styles.promptEyebrow, { color: colors.mutedForeground }]}>SORU {questionIndex + 1}</Text>
            <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
              <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${Math.min(100, ((questionIndex % 10) + 1) * 10)}%` }]} />
            </View>
          </View>
          <Text style={[styles.question, { color: colors.foreground }]}>
            {mode === 'provinces' ? `${targetName} ilini haritada bul.` : `${targetName} hangi il veya illerde?`}
          </Text>
          <Text style={[styles.instruction, { color: colors.mutedForeground }]}>Cevaplamak için haritadaki doğru ile dokun.</Text>
        </View>

        <View style={[styles.mapWrap, { backgroundColor: colors.card }]}>
          <View style={styles.mapTop}>
            <View style={[styles.mapDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.mapLabel, { color: colors.mutedForeground }]}>TÜRKİYE · DİLSİZ HARİTA</Text>
            <Feather name="maximize-2" size={14} color={colors.mutedForeground} />
          </View>
          <TurkeyMap
            layer={mode === 'provinces' ? 'provinces' : mode}
            items={mode === 'provinces' ? [] : featureQuestions}
            selectedProvince={selectedProvince}
            selectedItemId={answer ? targetItem?.id : null}
            onSelectProvince={chooseProvince}
            quiz
            correctProvinces={correctProvinces}
            wrongProvince={wrongProvince}
          />
          {answer && (
            <View style={[styles.feedback, { backgroundColor: answer.correct ? colors.successBackground : colors.errorBackground }]}>
              <Feather name={answer.correct ? 'check-circle' : 'x-circle'} size={18} color={answer.correct ? colors.success : colors.destructive} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.feedbackTitle, { color: answer.correct ? colors.successForeground : colors.errorForeground }]}>{answer.correct ? 'Doğru cevap' : 'Bu kez olmadı'}</Text>
                <Text style={[styles.feedbackText, { color: answer.correct ? colors.successMuted : colors.errorMuted }]}>
                  {answer.correct ? `${answer.province} doğru konum.` : `Doğru konum: ${mode === 'provinces' ? targetProvince : targetItem?.provinces.join(' / ')}`}
                </Text>
              </View>
            </View>
          )}
        </View>

        {answer && targetItem?.examTip && (
          <View style={[styles.tip, { backgroundColor: colors.accent }]}>
            <Feather name="bookmark" size={15} color={colors.primary} />
            <Text style={[styles.tipText, { color: colors.accentForeground }]}>{targetItem.examTip}</Text>
          </View>
        )}

        {answer ? (
          <Pressable onPress={nextQuestion} style={[styles.primaryButton, { backgroundColor: colors.primary }]} testID="next-question">
            <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>Sonraki soru</Text>
            <Feather name="arrow-right" size={17} color={colors.primaryForeground} />
          </Pressable>
        ) : (
          <View style={[styles.hintRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="info" size={16} color={colors.primary} />
            <Text style={[styles.hintText, { color: colors.mutedForeground }]}>
              {mode === 'provinces' ? `${String(PROVINCES.find((province) => province.name === targetName)?.plate ?? '').padStart(2, '0')} plaka kodlu ili bul.` : 'Önce çalıştığın katmanı seç, sonra hedefi haritada işaretle.'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 18, paddingTop: 16, gap: 15 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  title: { fontSize: 25, fontWeight: '700', marginTop: 4, letterSpacing: -0.4 },
  subtitle: { fontSize: 12, lineHeight: 18, marginTop: -9 },
  scorePill: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 11, paddingVertical: 8, flexDirection: 'row', gap: 6, alignItems: 'center' },
  scoreText: { fontSize: 12, fontWeight: '700' },
  modeSwitch: { borderRadius: 15, padding: 4, flexDirection: 'row', gap: 3 },
  modeOption: { flex: 1, borderRadius: 11, minHeight: 35, alignItems: 'center', justifyContent: 'center' },
  modeText: { fontSize: 11, fontWeight: '600' },
  promptCard: { borderWidth: 1, borderRadius: 21, padding: 15, gap: 8 },
  promptTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  promptEyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },
  progressTrack: { height: 4, borderRadius: 3, flex: 1, overflow: 'hidden' },
  progressFill: { height: 4, borderRadius: 3 },
  question: { fontSize: 18, lineHeight: 24, fontWeight: '700' },
  instruction: { fontSize: 11 },
  mapWrap: { padding: 12, borderRadius: 24, gap: 9 },
  mapTop: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 3 },
  mapDot: { width: 7, height: 7, borderRadius: 4 },
  mapLabel: { flex: 1, fontSize: 8, fontWeight: '700', letterSpacing: 0.8 },
  feedback: { borderRadius: 14, padding: 11, flexDirection: 'row', gap: 9, alignItems: 'center' },
  feedbackTitle: { fontSize: 12, fontWeight: '700' },
  feedbackText: { fontSize: 10, lineHeight: 15, marginTop: 2 },
  tip: { borderRadius: 14, padding: 12, flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  tipText: { flex: 1, fontSize: 11, lineHeight: 17 },
  primaryButton: { minHeight: 48, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  primaryButtonText: { fontSize: 13, fontWeight: '700' },
  hintRow: { borderWidth: 1, borderRadius: 15, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 9 },
  hintText: { flex: 1, fontSize: 11, lineHeight: 17 },
});
