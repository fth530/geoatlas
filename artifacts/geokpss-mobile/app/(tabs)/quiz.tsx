import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { BounceIn, FadeInDown, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LayerId, LAYERS, MapItem, MAP_ITEMS } from '@/data/geography';
import { itemMcqs, McqQuestion, PROVINCE_MCQ } from '@/data/questions';
import { PROVINCES, TurkeyMap } from '@/components/TurkeyMap';
import { AppText as Text } from '@/components/AppText';
import { PressableScale } from '@/components/PressableScale';
import { useStudy } from '@/context/StudyContext';
import { useColors } from '@/hooks/useColors';

type QuizMode = LayerId | 'mixed' | 'bank' | 'exam';
type QuizQuestion = { kind: 'province'; name: string } | { kind: 'item'; item: MapItem };
type AnswerResult = { province: string; correct: boolean };
type BankEntry = { item: MapItem | null; provinceName: string | null; mcq: McqQuestion };

const PROVINCE_QUESTIONS = PROVINCES.map((province) => province.name);
const MIXED_QUESTIONS: QuizQuestion[] = (() => {
  const list: QuizQuestion[] = [];
  const length = Math.max(PROVINCE_QUESTIONS.length, MAP_ITEMS.length);
  for (let index = 0; index < length; index += 1) {
    if (index < PROVINCE_QUESTIONS.length) list.push({ kind: 'province', name: PROVINCE_QUESTIONS[index] });
    if (index < MAP_ITEMS.length) list.push({ kind: 'item', item: MAP_ITEMS[index] });
  }
  return list;
})();
const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const;
const BANK_QUESTIONS: BankEntry[] = [
  ...MAP_ITEMS.flatMap((item) =>
    itemMcqs(item).map((mcq) => ({ item, provinceName: null, mcq })),
  ),
  ...PROVINCE_MCQ.map((entry) => ({ item: null, provinceName: entry.name, mcq: entry.mcq })),
];
const MODE_GROUPS: { label: string; options: { id: QuizMode; label: string }[] }[] = [
  {
    label: 'HARİTA',
    options: [
      ...LAYERS.map((layer) => ({ id: layer.id as QuizMode, label: layer.label })),
      { id: 'mixed', label: 'Karışık' },
    ],
  },
  {
    label: 'SINAV',
    options: [
      { id: 'bank', label: 'Soru bankası' },
      { id: 'exam', label: 'Deneme' },
    ],
  },
];

const EXAM_LENGTH = 18;
const EXAM_SECONDS = 15 * 60;
const EXAM_RING_RADIUS = 36;
const EXAM_RING_CIRCUMFERENCE = 2 * Math.PI * EXAM_RING_RADIUS;
const EMPTY_MAP_ITEMS: MapItem[] = [];

function isQuizMode(value?: string): value is QuizMode {
  return value === 'mixed' || value === 'bank' || value === 'exam' || LAYERS.some((layer) => layer.id === value);
}

function shuffle<T>(list: T[]): T[] {
  const copy = [...list];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

export default function QuizScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { answered, correct, hydrated, reviewItems, recordQuizAnswer } = useStudy();
  const { mode: modeParam, reviewIds: reviewIdsParam } = useLocalSearchParams<{ mode?: string; reviewIds?: string }>();
  const routeReviewIds = useMemo(
    () => (typeof reviewIdsParam === 'string' ? reviewIdsParam.split(',').filter(Boolean) : []),
    [reviewIdsParam],
  );
  const [mode, setMode] = useState<QuizMode>('provinces');
  const [layerQuizFormat, setLayerQuizFormat] = useState<'map' | 'mcq'>('map');
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewComplete, setReviewComplete] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState<AnswerResult | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [mcqPick, setMcqPick] = useState<{ index: number; correct: boolean } | null>(null);
  const [examSeed, setExamSeed] = useState(0);
  const [examDone, setExamDone] = useState(false);
  const [examSecondsLeft, setExamSecondsLeft] = useState(EXAM_SECONDS);
  const [examStats, setExamStats] = useState({ correct: 0, wrong: 0 });
  const [examLayers, setExamLayers] = useState<Record<string, { correct: number; wrong: number }>>({});

  useEffect(() => {
    const resolvedMode = isQuizMode(modeParam) ? modeParam : 'provinces';
    setMode(resolvedMode);
    setReviewMode(routeReviewIds.length > 0 && resolvedMode !== 'mixed' && resolvedMode !== 'bank' && resolvedMode !== 'exam');
    setReviewComplete(false);
    setQuestionIndex(0);
    setAnswer(null);
    setSelectedProvince(null);
    setMcqPick(null);
    if (resolvedMode === 'exam') {
      setExamSeed((seed) => seed + 1);
      setExamDone(false);
      setExamSecondsLeft(EXAM_SECONDS);
      setExamStats({ correct: 0, wrong: 0 });
      setExamLayers({});
    }
  }, [modeParam, reviewIdsParam]);

  const weakKeys = useMemo(
    () => new Set(reviewItems.filter((item) => !item.lastCorrect).map((item) => item.id)),
    [reviewItems],
  );
  const isWeakKey = (layer: LayerId, targetId: string) => weakKeys.has(`${layer}:${targetId}`);

  // Soru sıraları mod başına bir kez hesaplanır; quiz sırasında gelen
  // recordQuizAnswer çağrıları weakKeys'i değiştirse bile sıra sabit kalır.
  // Aksi halde aynı soru tekrar sorulabilir veya sorular atlanabilir.
  const featureQuestions = useMemo<MapItem[]>(() => {
    const items = MAP_ITEMS.filter((item) => item.layer === mode);
    return [
      ...items.filter((item) => isWeakKey(mode as LayerId, item.id)),
      ...items.filter((item) => !isWeakKey(mode as LayerId, item.id)),
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, hydrated]);
  const provinceQuestions = useMemo(
    () => [
      ...PROVINCE_QUESTIONS.filter((name) => isWeakKey('provinces', name)),
      ...PROVINCE_QUESTIONS.filter((name) => !isWeakKey('provinces', name)),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mode, hydrated],
  );
  const orderedMixedQuestions = useMemo(() => {
    const isWeakQuestion = (question: QuizQuestion) =>
      question.kind === 'province'
        ? isWeakKey('provinces', question.name)
        : isWeakKey(question.item.layer, question.item.id);
    return [
      ...MIXED_QUESTIONS.filter(isWeakQuestion),
      ...MIXED_QUESTIONS.filter((question) => !isWeakQuestion(question)),
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, hydrated]);
  const reviewSession = useMemo(
    () => routeReviewIds.flatMap((id) => {
      const item = reviewItems.find((reviewItem) => reviewItem.id === id);
      return item?.layer === mode ? [item] : [];
    }),
    [mode, reviewItems, routeReviewIds],
  );
  const orderedBankQuestions = useMemo(() => {
    const isLayerSpecific = mode !== 'mixed' && mode !== 'bank' && mode !== 'exam';
    const pool = isLayerSpecific
      ? BANK_QUESTIONS.filter((entry) =>
          mode === 'provinces' ? entry.provinceName !== null : entry.item?.layer === mode,
        )
      : BANK_QUESTIONS;
    const isWeak = (entry: BankEntry) =>
      entry.item
        ? isWeakKey(entry.item.layer, entry.item.id)
        : isWeakKey('provinces', entry.provinceName ?? '');
    return [...pool.filter(isWeak), ...pool.filter((entry) => !isWeak(entry))];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, hydrated]);
  const isMixed = mode === 'mixed';
  const isBank = mode === 'bank';
  const isExam = mode === 'exam';
  const isLayerMode = !isMixed && !isBank && !isExam;
  const isMcq = isBank || isExam || (isLayerMode && !reviewMode && layerQuizFormat === 'mcq');
  const examQuestions = useMemo(
    () => (isExam ? shuffle(BANK_QUESTIONS).slice(0, EXAM_LENGTH) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isExam, examSeed],
  );
  const bankEntry = isMcq && !reviewMode && !examDone
    ? isExam
      ? examQuestions[questionIndex]
      : orderedBankQuestions[questionIndex % Math.max(orderedBankQuestions.length, 1)]
    : undefined;
  const mixedQuestion =
    isMixed && !reviewMode ? orderedMixedQuestions[questionIndex % orderedMixedQuestions.length] : undefined;
  const reviewTarget = reviewMode && !isMixed
    ? reviewSession[questionIndex % Math.max(reviewSession.length, 1)]
    : undefined;
  const targetItem = isMcq
    ? bankEntry?.item ?? null
    : isMixed
    ? mixedQuestion?.kind === 'item'
      ? mixedQuestion.item
      : null
    : mode === 'provinces'
      ? null
      : reviewMode
        ? MAP_ITEMS.find((item) => item.id === reviewTarget?.targetId) ?? null
        : featureQuestions[questionIndex % Math.max(featureQuestions.length, 1)];
  const isProvinceQuestion = isMcq
    ? false
    : isMixed
    ? mixedQuestion?.kind === 'province'
    : mode === 'provinces';
  const targetProvince = isProvinceQuestion
    ? isMixed
      ? mixedQuestion?.kind === 'province'
        ? mixedQuestion.name
        : targetItem?.provinces[0] ?? 'Ankara'
      : reviewTarget?.targetName ?? provinceQuestions[questionIndex % provinceQuestions.length]
    : targetItem?.provinces[0] ?? 'Ankara';
  const targetName = isProvinceQuestion
    ? targetProvince
    : isMcq
      ? bankEntry?.item?.name ?? bankEntry?.provinceName ?? 'Soru'
      : targetItem?.name ?? 'Harita özelliği';
  const hasTarget = reviewMode
    ? !isMixed && !isMcq && (mode === 'provinces' ? Boolean(reviewTarget) : Boolean(reviewTarget && targetItem))
    : isMcq
      ? Boolean(bankEntry)
      : isMixed
      ? Boolean(mixedQuestion)
      : mode === 'provinces'
        ? true
        : featureQuestions.length > 0;
  const correctProvinces = useMemo(
    () => (answer ? (isProvinceQuestion ? [targetProvince] : targetItem?.provinces ?? []) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [answer, isProvinceQuestion, targetProvince, targetItem],
  );
  const wrongProvince = answer && !answer.correct ? answer.province : null;
  const answeredCorrect = Boolean(answer?.correct || mcqPick?.correct);
  const promptScale = useSharedValue(1);
  const promptStyle = useAnimatedStyle(() => ({ transform: [{ scale: promptScale.value }] }));
  useEffect(() => {
    if (answeredCorrect) {
      promptScale.value = withSequence(
        withTiming(1.045, { duration: 120 }),
        withSpring(1, { damping: 9, stiffness: 240 }),
      );
    } else {
      promptScale.value = 1;
    }
  }, [answeredCorrect, promptScale]);
  const answerLayer: LayerId = isProvinceQuestion
    ? 'provinces'
    : targetItem?.layer ?? (mode === 'mixed' || mode === 'bank' || mode === 'exam' ? 'provinces' : mode);
  const totalQuestions = reviewMode
    ? reviewSession.length
    : isExam
      ? EXAM_LENGTH
      : isMcq
      ? orderedBankQuestions.length
      : isMixed
      ? orderedMixedQuestions.length
      : mode === 'provinces'
        ? provinceQuestions.length
        : featureQuestions.length;
  const progress = totalQuestions > 0
    ? Math.min(100, ((questionIndex % totalQuestions + 1) / totalQuestions) * 100)
    : 0;

  useEffect(() => {
    if (!isExam || examDone || reviewMode) return;
    const timer = setInterval(() => {
      setExamSecondsLeft((seconds) => {
        if (seconds <= 1) {
          setExamDone(true);
          return 0;
        }
        return seconds - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isExam, examDone, reviewMode]);

  useEffect(() => {
    if (!isExam || !examDone || examSecondsLeft > 0) return;
    const answeredCount = examStats.correct + examStats.wrong;
    if (answeredCount >= EXAM_LENGTH) return;
    const remainingEntries = examQuestions.slice(answeredCount, EXAM_LENGTH);
    for (const entry of remainingEntries) {
      recordQuizAnswer({
        layer: entry.item?.layer ?? 'provinces',
        targetId: entry.item?.id ?? entry.provinceName ?? '',
        targetName: entry.item?.name ?? entry.provinceName ?? 'Soru',
        isCorrect: false,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examDone, examSecondsLeft, isExam]);

  const examTimeLabel = `${Math.floor(examSecondsLeft / 60)}:${String(examSecondsLeft % 60).padStart(2, '0')}`;
  const examAnswered = examStats.correct + examStats.wrong;
  // Süre dolduğunda cevaplanmayan sorular yanlış sayılır.
  const examUnanswered = examDone ? Math.max(0, EXAM_LENGTH - examAnswered) : 0;
  const examAccuracy = examDone ? Math.round((examStats.correct / EXAM_LENGTH) * 100) : 0;

  const changeMode = (nextMode: QuizMode) => {
    setMode(nextMode);
    setReviewMode(false);
    setReviewComplete(false);
    setQuestionIndex(0);
    setAnswer(null);
    setSelectedProvince(null);
    setMcqPick(null);
    if (nextMode === 'exam') {
      setExamSeed((seed) => seed + 1);
      setExamDone(false);
      setExamSecondsLeft(EXAM_SECONDS);
      setExamStats({ correct: 0, wrong: 0 });
      setExamLayers({});
    }
    router.setParams({ mode: nextMode, reviewIds: undefined });
  };

  const chooseOption = (index: number) => {
    if (mcqPick || !bankEntry) return;
    const isCorrect = index === bankEntry.mcq.answer;
    setMcqPick({ index, correct: isCorrect });
    const layerId = bankEntry.item?.layer ?? 'provinces';
    if (isExam) {
      setExamStats((stats) => (isCorrect
        ? { correct: stats.correct + 1, wrong: stats.wrong }
        : { correct: stats.correct, wrong: stats.wrong + 1 }));
      setExamLayers((layers) => ({
        ...layers,
        [layerId]: {
          correct: (layers[layerId]?.correct ?? 0) + (isCorrect ? 1 : 0),
          wrong: (layers[layerId]?.wrong ?? 0) + (isCorrect ? 0 : 1),
        },
      }));
    }
    recordQuizAnswer({
      layer: bankEntry.item?.layer ?? 'provinces',
      targetId: bankEntry.item?.id ?? bankEntry.provinceName ?? '',
      targetName: bankEntry.item?.name ?? bankEntry.provinceName ?? 'Soru',
      isCorrect,
    });
    if (isCorrect) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  };

  const chooseProvince = (province: string) => {
    if (answer) return;
    const isCorrect = isProvinceQuestion
      ? province === targetProvince
      : Boolean(targetItem?.provinces.includes(province));
    setSelectedProvince(province);
    setAnswer({ province, correct: isCorrect });
    recordQuizAnswer({
      layer: answerLayer,
      targetId: isProvinceQuestion ? targetProvince : targetItem?.id ?? targetName,
      targetName,
      isCorrect,
    });
    if (isCorrect) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  };

  const nextQuestion = () => {
    if (isExam && questionIndex + 1 >= EXAM_LENGTH) {
      setMcqPick(null);
      setExamDone(true);
      return;
    }
    if (reviewMode && questionIndex + 1 >= reviewSession.length) {
      setAnswer(null);
      setSelectedProvince(null);
      setMcqPick(null);
      setReviewComplete(true);
      return;
    }
    setQuestionIndex((index) => index + 1);
    setAnswer(null);
    setSelectedProvince(null);
    setMcqPick(null);
  };

  const finishReview = () => {
    setReviewMode(false);
    setReviewComplete(false);
    setQuestionIndex(0);
    setAnswer(null);
    setSelectedProvince(null);
    setMcqPick(null);
    router.setParams({ reviewIds: undefined });
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: Platform.OS === 'web' ? 16 : insets.top }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 110 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.eyebrow, { color: colors.primary }]}>{reviewMode ? 'ARALIKLI TEKRAR' : 'HARİTA PRATİĞİ'}</Text>
            <Text style={[styles.title, { color: colors.foreground }]}>{isExam ? 'Deneme sınavı' : isBank ? 'Soru bankası' : 'Haritada bul'}</Text>
          </View>
          <View style={[styles.scorePill, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="target" size={15} color={colors.primary} />
            <Text style={[styles.scoreText, { color: colors.foreground }]}>{correct}/{answered}</Text>
          </View>
        </View>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {reviewMode
            ? 'Tekrar sırası gelen konuları dilsiz haritada yeniden hatırla.'
            : isExam
              ? `${EXAM_LENGTH} soruluk süreli deneme — ${examTimeLabel} kaldı.`
              : isBank
              ? 'Çoktan seçmeli sorularla bilgini pekiştir; her cevap ilgili konuya işlenir.'
              : 'Doğru yeri dilsiz haritada seç. Yanlış cevap kırmızı, doğru yer yeşil görünür.'}
        </Text>

        <View style={styles.modeGroups}>
          {MODE_GROUPS.map((group) => {
            const isScrollableGroup = group.options.length > 3;
            const buttons = group.options.map((option) => {
              const active = mode === option.id;
              return (
                <Pressable
                  key={option.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => changeMode(option.id)}
                  style={[
                    styles.modeOption,
                    !isScrollableGroup && styles.modeOptionFlex,
                    active && { backgroundColor: colors.card },
                  ]}
                  testID={`quiz-mode-${option.id}`}
                >
                  <Text
                    numberOfLines={1}
                    style={[styles.modeText, { color: active ? colors.foreground : colors.mutedForeground }]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            });

            return (
              <View key={group.label} style={styles.modeGroup}>
                <Text style={[styles.modeGroupLabel, { color: colors.mutedForeground }]}>{group.label}</Text>
                {isScrollableGroup ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={[styles.modeSwitchScroll, { backgroundColor: colors.muted }]}
                    contentContainerStyle={styles.modeSwitchScrollContent}
                  >
                    {buttons}
                  </ScrollView>
                ) : (
                  <View style={[styles.modeSwitch, { backgroundColor: colors.muted }]}>
                    {buttons}
                  </View>
                )}
              </View>
            );
          })}
          {isLayerMode && !reviewMode && (
            <View style={styles.modeGroup}>
              <Text style={[styles.modeGroupLabel, { color: colors.mutedForeground }]}>
                {LAYERS.find((l) => l.id === mode)?.label.toLocaleUpperCase('tr') ?? 'KONU'} SORU TİPİ
              </Text>
              <View style={[styles.modeSwitch, { backgroundColor: colors.muted }]}>
                {(
                  [
                    { id: 'map', label: 'Haritada Bul' },
                    { id: 'mcq', label: 'Çoktan Seçmeli Test' },
                  ] as const
                ).map((fmt) => {
                  const active = layerQuizFormat === fmt.id;
                  return (
                    <Pressable
                      key={fmt.id}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      onPress={() => {
                        setLayerQuizFormat(fmt.id);
                        setQuestionIndex(0);
                        setAnswer(null);
                        setSelectedProvince(null);
                        setMcqPick(null);
                      }}
                      style={[
                        styles.modeOption,
                        styles.modeOptionFlex,
                        active && { backgroundColor: colors.card },
                      ]}
                      testID={`quiz-format-${fmt.id}`}
                    >
                      <Text style={[styles.modeText, { color: active ? colors.primary : colors.mutedForeground }]}>
                        {fmt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        <Animated.View
          key={`${mode}-${questionIndex}-${reviewMode ? 'r' : 'n'}`}
          entering={FadeInDown.duration(160)}
          style={[styles.promptCard, promptStyle, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={styles.promptTop}>
            <Text style={[styles.promptEyebrow, { color: colors.mutedForeground }]}>
              {reviewComplete
                ? 'TAMAMLANDI'
                : isExam
                  ? `DENEME · ${examTimeLabel}`
                  : `SORU ${questionIndex + 1}${reviewMode && totalQuestions ? ` / ${totalQuestions}` : ''}`}
            </Text>
            <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
              <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${progress}%` }]} />
            </View>
          </View>
          <Text style={[styles.question, { color: colors.foreground }]}>
            {reviewComplete
              ? 'Bugünkü tekrar turunu tamamladın.'
              : isExam && examDone
                ? 'Deneme bitti — sonucun aşağıda.'
                : !hasTarget
                ? reviewMode && !hydrated ? 'Tekrar öğeleri yükleniyor.' : 'Bu katmanda tekrar bekleyen öğe bulunamadı.'
                : isMcq && bankEntry
                  ? bankEntry.mcq.q
                  : isProvinceQuestion
                    ? `${targetName} ilini haritada bul.`
                    : `${targetName} hangi il veya illerde?`}
          </Text>
          <Text style={[styles.instruction, { color: colors.mutedForeground }]}>
            {reviewComplete
              ? 'Tekrar listen güncellendi.'
              : isExam && examDone
                ? 'Yeni deneme için soruları karıştır.'
                : hasTarget
                ? isMcq
                  ? 'Şıklardan doğru cevabı seç.'
                  : !isProvinceQuestion && (targetItem?.provinces.length ?? 0) > 1
                    ? `Bu özellik ${targetItem?.provinces.length} ili kapsar; haritada bu illerden birine dokun.`
                    : 'Cevaplamak için haritadaki doğru ile dokun.'
                : 'Konu Takibi bölümünden diğer tekrarlarını açabilirsin.'}
          </Text>
        </Animated.View>

        {reviewComplete ? (
          <View style={[styles.reviewNotice, { backgroundColor: colors.successBackground }]}>
            <Feather name="check-circle" size={21} color={colors.success} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.feedbackTitle, { color: colors.successForeground }]}>Tekrar tamamlandı</Text>
              <Text style={[styles.feedbackText, { color: colors.successMuted }]}>Bu sorular sonraki çalışma aralığına taşındı.</Text>
            </View>
          </View>
        ) : isExam && examDone ? (
          <View style={[styles.optionsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.examResult}>
              <View style={styles.ringWrap}>
                <Svg width={88} height={88} viewBox="0 0 88 88">
                  <Circle cx={44} cy={44} r={EXAM_RING_RADIUS} stroke={colors.muted} strokeWidth={8} fill="none" />
                  <Circle
                    cx={44}
                    cy={44}
                    r={EXAM_RING_RADIUS}
                    stroke={examAccuracy >= 70 ? colors.success : examAccuracy >= 40 ? colors.primary : colors.destructive}
                    strokeWidth={8}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${(examAccuracy / 100) * EXAM_RING_CIRCUMFERENCE} ${EXAM_RING_CIRCUMFERENCE}`}
                    rotation={-90}
                    origin="44, 44"
                  />
                </Svg>
                <View style={styles.ringCenter} pointerEvents="none">
                  <Text style={[styles.ringPercent, { color: colors.foreground }]}>%{examAccuracy}</Text>
                </View>
              </View>
              <Text style={[styles.examScore, { color: colors.foreground }]}>{examStats.correct}/{EXAM_LENGTH} doğru</Text>
              <Text style={[styles.examAccuracy, { color: colors.mutedForeground }]}>
                Kalan süre: {examTimeLabel}{examUnanswered > 0 ? ` · ${examUnanswered} soruya yetişilemedi` : ''}
              </Text>
              {Object.keys(examLayers).length > 0 && (
                <View style={[styles.layerBreakdown, { borderTopColor: colors.border }]}>
                  {Object.entries(examLayers)
                    .sort(([, a], [, b]) => (b.correct + b.wrong) - (a.correct + a.wrong))
                    .map(([layerId, stats]) => {
                      const total = stats.correct + stats.wrong;
                      const layerLabel = LAYERS.find((layer) => layer.id === layerId)?.label ?? layerId;
                      return (
                        <View key={layerId} style={styles.layerRow}>
                          <Text style={[styles.layerRowLabel, { color: colors.foreground }]} numberOfLines={1}>{layerLabel}</Text>
                          <View style={[styles.layerRowTrack, { backgroundColor: colors.muted }]}>
                            <View style={[styles.layerRowFill, { backgroundColor: colors.success, width: `${(stats.correct / total) * 100}%` }]} />
                          </View>
                          <Text style={[styles.layerRowCount, { color: colors.mutedForeground }]}>{stats.correct}/{total}</Text>
                        </View>
                      );
                    })}
                </View>
              )}
            </View>
            <PressableScale
              onPress={() => {
                setExamSeed((seed) => seed + 1);
                setExamDone(false);
                setExamSecondsLeft(EXAM_SECONDS);
                setExamStats({ correct: 0, wrong: 0 });
                setExamLayers({});
                setQuestionIndex(0);
                setMcqPick(null);
              }}
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
              testID="restart-exam"
            >
              <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>Yeni deneme</Text>
              <Feather name="rotate-cw" size={16} color={colors.primaryForeground} />
            </PressableScale>
          </View>
        ) : isMcq ? (
          bankEntry ? (
            <View style={[styles.optionsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {bankEntry.mcq.tag && (
                <View style={[styles.tagChip, { backgroundColor: colors.accent }]}>
                  <Text style={[styles.tagChipText, { color: colors.primary }]}>{bankEntry.mcq.tag}</Text>
                </View>
              )}
              {bankEntry.mcq.options.map((option, index) => {
                const isAnswer = index === bankEntry.mcq.answer;
                const isPicked = mcqPick?.index === index;
                const borderColor = !mcqPick
                  ? colors.border
                  : isAnswer
                    ? colors.success
                    : isPicked
                      ? colors.destructive
                      : colors.border;
                const optionBg = !mcqPick
                  ? 'transparent'
                  : isAnswer
                    ? colors.successBackground
                    : isPicked
                      ? colors.errorBackground
                      : 'transparent';
                const badgeBg = mcqPick && (isAnswer || isPicked)
                  ? isAnswer
                    ? colors.success
                    : colors.destructive
                  : colors.muted;
                return (
                  <Pressable
                    key={index}
                    accessibilityRole="button"
                    disabled={Boolean(mcqPick)}
                    onPress={() => chooseOption(index)}
                    style={[styles.optionRow, { borderColor, backgroundColor: optionBg }]}
                    testID={`mcq-option-${index}`}
                  >
                    <View style={[styles.optionBadge, { backgroundColor: badgeBg }]}>
                      <Text style={[styles.optionBadgeText, { color: mcqPick && (isAnswer || isPicked) ? colors.primaryForeground : colors.mutedForeground }]}>
                        {OPTION_LETTERS[index]}
                      </Text>
                    </View>
                    <Text style={[styles.optionText, { color: colors.foreground }]}>{option}</Text>
                    {mcqPick && isAnswer && <Feather name="check" size={16} color={colors.success} />}
                  </Pressable>
                );
              })}
              {mcqPick && (
                <Animated.View
                  entering={mcqPick.correct ? BounceIn.duration(480) : FadeInDown.duration(160)}
                  style={[styles.feedback, { backgroundColor: mcqPick.correct ? colors.successBackground : colors.errorBackground }]}
                >
                  <Feather name={mcqPick.correct ? 'check-circle' : 'x-circle'} size={18} color={mcqPick.correct ? colors.success : colors.destructive} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.feedbackTitle, { color: mcqPick.correct ? colors.successForeground : colors.errorForeground }]}>{mcqPick.correct ? 'Doğru cevap' : 'Bu kez olmadı'}</Text>
                    <Text style={[styles.feedbackText, { color: mcqPick.correct ? colors.successMuted : colors.errorMuted }]}>
                      {mcqPick.correct
                        ? `${bankEntry.item?.name ?? bankEntry.provinceName ?? 'Cevap'} doğru.`
                        : `Doğru cevap: ${bankEntry.mcq.options[bankEntry.mcq.answer]}`}
                    </Text>
                  </View>
                </Animated.View>
              )}
            </View>
          ) : (
            <View style={[styles.reviewNotice, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="help-circle" size={19} color={colors.primary} />
              <Text style={[styles.hintText, { color: colors.mutedForeground }]}>Soru bankasında henüz soru yok.</Text>
            </View>
          )
        ) : hasTarget ? (
          <View style={[styles.mapWrap, { backgroundColor: colors.card }]}>
            <View style={styles.mapTop}>
              <View style={[styles.mapDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.mapLabel, { color: colors.mutedForeground }]}>TÜRKİYE · DİLSİZ HARİTA</Text>
              <Feather name="maximize-2" size={14} color={colors.mutedForeground} />
            </View>
            <TurkeyMap
              layer={isMixed || mode === 'provinces' ? 'provinces' : (mode as LayerId)}
              items={EMPTY_MAP_ITEMS}
              selectedProvince={selectedProvince}
              onSelectProvince={chooseProvince}
              quiz
              correctProvinces={correctProvinces}
              wrongProvince={wrongProvince}
            />
            {answer && (
              <Animated.View
                entering={answer.correct ? BounceIn.duration(480) : FadeInDown.duration(160)}
                style={[styles.feedback, { backgroundColor: answer.correct ? colors.successBackground : colors.errorBackground }]}
              >
                <Feather name={answer.correct ? 'check-circle' : 'x-circle'} size={18} color={answer.correct ? colors.success : colors.destructive} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.feedbackTitle, { color: answer.correct ? colors.successForeground : colors.errorForeground }]}>{answer.correct ? 'Doğru cevap' : 'Bu kez olmadı'}</Text>
                  <Text style={[styles.feedbackText, { color: answer.correct ? colors.successMuted : colors.errorMuted }]}>
                    {answer.correct
                      ? !isProvinceQuestion && (targetItem?.provinces.length ?? 0) > 1
                        ? `${answer.province} doğru! Kapsadığı tüm iller: ${targetItem?.provinces.join(', ')}`
                        : `${answer.province} doğru konum.`
                      : `Doğru konum: ${isProvinceQuestion ? targetProvince : targetItem?.provinces.join(' / ')}`}
                  </Text>
                </View>
              </Animated.View>
            )}
          </View>
        ) : (
          <View style={[styles.reviewNotice, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="clock" size={19} color={colors.primary} />
            <Text style={[styles.hintText, { color: colors.mutedForeground }]}>
              {hydrated ? 'Bu katmanda şu an tekrar sırası gelen soru yok.' : 'Tekrar listesi yükleniyor.'}
            </Text>
          </View>
        )}

        {(answer || mcqPick) && (targetItem?.examTip || targetItem?.description) && (
          <View style={[styles.tip, { backgroundColor: colors.accent }]}>
            <Feather name="bookmark" size={15} color={colors.primary} />
            <Text style={[styles.tipText, { color: colors.accentForeground }]}>
              {targetItem.examTip ? `${targetItem.examTip} ` : ''}
              {targetItem.description}
            </Text>
          </View>
        )}

        {reviewComplete ? (
          <PressableScale onPress={finishReview} style={[styles.primaryButton, { backgroundColor: colors.primary }]} testID="finish-review">
            <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>Quizlere dön</Text>
            <Feather name="arrow-right" size={17} color={colors.primaryForeground} />
          </PressableScale>
        ) : answer || mcqPick ? (
          <PressableScale onPress={nextQuestion} style={[styles.primaryButton, { backgroundColor: colors.primary }]} testID="next-question">
            <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>
              {reviewMode && questionIndex + 1 >= reviewSession.length
                ? 'Tekrarı tamamla'
                : isExam && questionIndex + 1 >= EXAM_LENGTH
                  ? 'Denemeyi bitir'
                  : 'Sonraki soru'}
            </Text>
            <Feather name="arrow-right" size={17} color={colors.primaryForeground} />
          </PressableScale>
        ) : reviewMode && !hasTarget ? (
          <PressableScale onPress={finishReview} style={[styles.primaryButton, { backgroundColor: colors.primary }]} testID="finish-empty-review">
            <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>Quizlere dön</Text>
            <Feather name="arrow-right" size={17} color={colors.primaryForeground} />
          </PressableScale>
        ) : (
          <View style={[styles.hintRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="info" size={16} color={colors.primary} />
            <Text style={[styles.hintText, { color: colors.mutedForeground }]}>
              {isMcq
                ? 'Şıklardan doğru cevabı seç.'
                : isProvinceQuestion
                ? `${String(PROVINCES.find((province) => province.name === targetName)?.plate ?? '').padStart(2, '0')} plaka kodlu ili bul.`
                : 'Haritada özelliğin bulunduğu il veya illere dokun.'}
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
  modeGroups: { flexDirection: 'column', gap: 8 },
  modeGroup: { gap: 4 },
  modeGroupLabel: { fontSize: 8, fontWeight: '700', letterSpacing: 1, paddingLeft: 4 },
  modeSwitch: { borderRadius: 15, padding: 4, flexDirection: 'row', gap: 4 },
  modeSwitchScroll: { borderRadius: 15, flexGrow: 0 },
  modeSwitchScrollContent: { padding: 4, flexDirection: 'row', gap: 4 },
  modeOption: { borderRadius: 11, minHeight: 44, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  modeOptionFlex: { flex: 1 },
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
  reviewNotice: { borderRadius: 18, borderWidth: 1, padding: 16, flexDirection: 'row', gap: 10, alignItems: 'center' },
  feedbackTitle: { fontSize: 12, fontWeight: '700' },
  feedbackText: { fontSize: 10, lineHeight: 15, marginTop: 2 },
  tip: { borderRadius: 14, padding: 12, flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  tipText: { flex: 1, fontSize: 11, lineHeight: 17 },
  primaryButton: { minHeight: 48, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  primaryButtonText: { fontSize: 13, fontWeight: '700' },
  hintRow: { borderWidth: 1, borderRadius: 15, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 9 },
  optionsCard: { borderWidth: 1, borderRadius: 21, padding: 12, gap: 9 },
  optionRow: { minHeight: 48, borderRadius: 14, borderWidth: 1, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  optionBadge: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  optionBadgeText: { fontSize: 11, fontWeight: '700' },
  optionText: { flex: 1, fontSize: 13, fontWeight: '600' },
  tagChip: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  tagChipText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  examResult: { alignItems: 'center', gap: 8, paddingVertical: 10 },
  ringWrap: { width: 88, height: 88, alignItems: 'center', justifyContent: 'center' },
  ringCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  ringPercent: { fontSize: 20, fontWeight: '700' },
  examScore: { fontSize: 16, fontWeight: '700' },
  examAccuracy: { fontSize: 12, fontWeight: '600' },
  layerBreakdown: { borderTopWidth: 1, marginTop: 8, paddingTop: 10, alignSelf: 'stretch', gap: 7 },
  layerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  layerRowLabel: { width: 74, fontSize: 9, fontWeight: '700' },
  layerRowTrack: { flex: 1, height: 5, borderRadius: 3, overflow: 'hidden' },
  layerRowFill: { height: 5, borderRadius: 3 },
  layerRowCount: { width: 30, fontSize: 9, fontWeight: '700', textAlign: 'right' },
  hintText: { flex: 1, fontSize: 11, lineHeight: 17 },
});
