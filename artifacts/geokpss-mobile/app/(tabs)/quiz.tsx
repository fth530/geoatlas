import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { BounceIn, FadeInDown, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LayerId, LAYERS, MapItem, MAP_ITEMS } from '@/data/geography';
import { itemMcqs, itemTfQuestion, McqQuestion, PROVINCE_MCQ } from '@/data/questions';
import { PROVINCES, TurkeyMap } from '@/components/TurkeyMap';
import { AppText as Text } from '@/components/AppText';
import { PressableScale } from '@/components/PressableScale';
import { useStudy } from '@/context/StudyContext';
import { useColors } from '@/hooks/useColors';
import { speakTurkish } from '@/utils/speech';
import { localDayKey } from '@/utils/study';

type QuizMode = LayerId | 'mixed' | 'bank' | 'exam' | 'daily';
type QuizQuestion = { kind: 'province'; name: string } | { kind: 'item'; item: MapItem };
type AnswerResult = { province: string; correct: boolean };
type BankEntry = { item: MapItem | null; provinceName: string | null; mcq: McqQuestion };

const PROVINCE_QUESTIONS = PROVINCES.map((province) => province.name);

function shuffleList<T>(list: T[]): T[] {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
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
const EXAM_LENGTH = 18;
const EXAM_SECONDS = 15 * 60;
const DAILY_LENGTH = 10;
const DAILY_SECONDS = 6 * 60;
const EXAM_RING_RADIUS = 36;
const EXAM_RING_CIRCUMFERENCE = 2 * Math.PI * EXAM_RING_RADIUS;
const EMPTY_MAP_ITEMS: MapItem[] = [];

function isQuizMode(value?: string): value is QuizMode {
  return value === 'mixed' || value === 'bank' || value === 'exam' || value === 'daily' || LAYERS.some((layer) => layer.id === value);
}

/** Deterministic daily challenge: same 10 questions for everyone on a given day. */
function seededDailyQuestions(): BankEntry[] {
  const dayKey = localDayKey();
  let seed = 7;
  for (const ch of dayKey) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const pool = [...BANK_QUESTIONS];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, DAILY_LENGTH);
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
  const { answered, correct, hydrated, reviewItems, challengeBest, recordQuizAnswer, recordChallengeResult } = useStudy();
  const { mode: modeParam, reviewIds: reviewIdsParam } = useLocalSearchParams<{ mode?: string; reviewIds?: string }>();
  const routeReviewIds = useMemo(
    () => (typeof reviewIdsParam === 'string' ? reviewIdsParam.split(',').filter(Boolean) : []),
    [reviewIdsParam],
  );
  const [mode, setMode] = useState<QuizMode>('provinces');
  const [layerQuizFormat, setLayerQuizFormat] = useState<'map' | 'mcq' | 'tf'>('map');
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewComplete, setReviewComplete] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState<AnswerResult | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [mcqPick, setMcqPick] = useState<{ index: number; correct: boolean } | null>(null);
  const [tfPick, setTfPick] = useState<boolean | null>(null);
  const [examSeed, setExamSeed] = useState(0);
  const [examDone, setExamDone] = useState(false);
  const [examSecondsLeft, setExamSecondsLeft] = useState(EXAM_SECONDS);
  const [examStats, setExamStats] = useState({ correct: 0, wrong: 0 });
  const [examLayers, setExamLayers] = useState<Record<string, { correct: number; wrong: number }>>({});
  const [examLog, setExamLog] = useState<{ name: string; layerId: string; correct: boolean }[]>([]);

  useEffect(() => {
    const resolvedMode = isQuizMode(modeParam) ? modeParam : 'provinces';
    setMode(resolvedMode);
    setReviewMode(routeReviewIds.length > 0 && resolvedMode !== 'mixed' && resolvedMode !== 'bank' && resolvedMode !== 'exam');
    setReviewComplete(false);
    setQuestionIndex(0);
    setAnswer(null);
    setSelectedProvince(null);
    setMcqPick(null);
    setTfPick(null);
    if (resolvedMode === 'exam' || resolvedMode === 'daily') {
      setExamSeed((seed) => seed + 1);
      setExamDone(false);
      dailyRecordedRef.current = false;
      setExamSecondsLeft(resolvedMode === 'daily' ? DAILY_SECONDS : EXAM_SECONDS);
      setExamStats({ correct: 0, wrong: 0 });
      setExamLayers({});
      setExamLog([]);
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
      ...shuffleList(items.filter((item) => isWeakKey(mode as LayerId, item.id))),
      ...shuffleList(items.filter((item) => !isWeakKey(mode as LayerId, item.id))),
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, hydrated]);
  const provinceQuestions = useMemo(
    () => [
      ...shuffleList(PROVINCE_QUESTIONS.filter((name) => isWeakKey('provinces', name))),
      ...shuffleList(PROVINCE_QUESTIONS.filter((name) => !isWeakKey('provinces', name))),
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
      ...shuffleList(MIXED_QUESTIONS.filter(isWeakQuestion)),
      ...shuffleList(MIXED_QUESTIONS.filter((question) => !isWeakQuestion(question))),
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
    return [...shuffleList(pool.filter(isWeak)), ...shuffleList(pool.filter((entry) => !isWeak(entry)))];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, hydrated]);
  const isMixed = mode === 'mixed';
  const isBank = mode === 'bank';
  const isExam = mode === 'exam';
  const isDaily = mode === 'daily';
  const isExamFlow = isExam || isDaily;
  const examLength = isDaily ? DAILY_LENGTH : EXAM_LENGTH;
  const examSecondsTotal = isDaily ? DAILY_SECONDS : EXAM_SECONDS;
  const isLayerMode = !isMixed && !isBank && !isExamFlow;
  const isMcq = isBank || isExamFlow || (isLayerMode && !reviewMode && layerQuizFormat === 'mcq');
  const isTf = isLayerMode && !reviewMode && layerQuizFormat === 'tf';
  const examQuestions = useMemo(
    () => (isExam ? shuffle(BANK_QUESTIONS).slice(0, EXAM_LENGTH) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isExam, examSeed],
  );
  const dailyQuestions = useMemo(() => (isDaily ? seededDailyQuestions() : []), [isDaily]);
  const examPool = isDaily ? dailyQuestions : examQuestions;
  const bankEntry = isMcq && !reviewMode && !examDone
    ? isExamFlow
      ? examPool[questionIndex]
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
  const tfQuestion = isTf && targetItem ? itemTfQuestion(targetItem, questionIndex) : null;
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
  const answeredCorrect = Boolean(answer?.correct || mcqPick?.correct || (tfPick !== null && tfQuestion !== null && tfPick === tfQuestion.answer));
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
    : targetItem?.layer ?? (mode === 'mixed' || mode === 'bank' || isExamFlow ? 'provinces' : mode);
  const totalQuestions = reviewMode
    ? reviewSession.length
    : isExamFlow
      ? examLength
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
    if (!isExamFlow || examDone || reviewMode) return;
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
  }, [isExamFlow, examDone, reviewMode]);

  useEffect(() => {
    if (!isExamFlow || !examDone || examSecondsLeft > 0) return;
    const answeredCount = examStats.correct + examStats.wrong;
    if (answeredCount >= examLength) return;
    const remainingEntries = examPool.slice(answeredCount, examLength);
    for (const entry of remainingEntries) {
      recordQuizAnswer({
        layer: entry.item?.layer ?? 'provinces',
        targetId: entry.item?.id ?? entry.provinceName ?? '',
        targetName: entry.item?.name ?? entry.provinceName ?? 'Soru',
        isCorrect: false,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examDone, examSecondsLeft, isExamFlow, examLength, examPool]);

  const dailyRecordedRef = React.useRef(false);
  useEffect(() => {
    if (isDaily && examDone && !dailyRecordedRef.current) {
      dailyRecordedRef.current = true;
      recordChallengeResult(examStats.correct, DAILY_LENGTH);
    }
  }, [isDaily, examDone, examStats.correct, recordChallengeResult]);

  const examTimeLabel = `${Math.floor(examSecondsLeft / 60)}:${String(examSecondsLeft % 60).padStart(2, '0')}`;
  const examAnswered = examStats.correct + examStats.wrong;
  // Süre dolduğunda cevaplanmayan sorular yanlış sayılır.
  const examUnanswered = examDone ? Math.max(0, examLength - examAnswered) : 0;
  const examAccuracy = examDone ? Math.round((examStats.correct / examLength) * 100) : 0;
  const examNet = examStats.correct - examStats.wrong * 0.25 - examUnanswered * 0.25;
  const examUsedSeconds = examSecondsTotal - examSecondsLeft;
  const dailyBest = challengeBest[localDayKey()] ?? 0;
  const examWrongEntries = examLog.filter((entry) => !entry.correct);
  const examWeakLayer = Object.entries(examLayers)
    .map(([layerId, stats]) => ({ layerId, ...stats, total: stats.correct + stats.wrong }))
    .filter((entry) => entry.total > 0)
    .sort((a, b) => b.wrong - a.wrong || a.correct - b.correct)[0];

  const changeMode = (nextMode: QuizMode) => {
    setMode(nextMode);
    setReviewMode(false);
    setReviewComplete(false);
    setQuestionIndex(0);
    setAnswer(null);
    setSelectedProvince(null);
    setMcqPick(null);
    setTfPick(null);
    if (nextMode === 'exam' || nextMode === 'daily') {
      setExamSeed((seed) => seed + 1);
      setExamDone(false);
      dailyRecordedRef.current = false;
      setExamSecondsLeft(nextMode === 'daily' ? DAILY_SECONDS : EXAM_SECONDS);
      setExamStats({ correct: 0, wrong: 0 });
      setExamLayers({});
      setExamLog([]);
    }
    router.setParams({ mode: nextMode, reviewIds: undefined });
  };

  const chooseOption = (index: number) => {
    if (mcqPick || !bankEntry) return;
    const isCorrect = index === bankEntry.mcq.answer;
    setMcqPick({ index, correct: isCorrect });
    const layerId = bankEntry.item?.layer ?? 'provinces';
    if (isExamFlow) {
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
      setExamLog((log) => [...log, {
        name: bankEntry.item?.name ?? bankEntry.provinceName ?? 'Soru',
        layerId,
        correct: isCorrect,
      }]);
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

  const chooseTf = (pick: boolean) => {
    if (tfPick !== null || !tfQuestion || !targetItem) return;
    const isCorrect = pick === tfQuestion.answer;
    setTfPick(pick);
    recordQuizAnswer({
      layer: targetItem.layer,
      targetId: targetItem.id,
      targetName: targetItem.name,
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
    if (isExamFlow && questionIndex + 1 >= examLength) {
      setMcqPick(null);
    setTfPick(null);
      setExamDone(true);
      return;
    }
    if (reviewMode && questionIndex + 1 >= reviewSession.length) {
      setAnswer(null);
      setSelectedProvince(null);
      setMcqPick(null);
    setTfPick(null);
      setReviewComplete(true);
      return;
    }
    setQuestionIndex((index) => index + 1);
    setAnswer(null);
    setSelectedProvince(null);
    setMcqPick(null);
    setTfPick(null);
  };

  const finishReview = () => {
    setReviewMode(false);
    setReviewComplete(false);
    setQuestionIndex(0);
    setAnswer(null);
    setSelectedProvince(null);
    setMcqPick(null);
    setTfPick(null);
    router.setParams({ reviewIds: undefined });
  };

  const modeOptions: { id: QuizMode; label: string }[] = [
    ...LAYERS.map((layer) => ({ id: layer.id as QuizMode, label: layer.label })),
    { id: 'mixed', label: 'Karışık' },
    { id: 'bank', label: 'Soru bankası' },
    { id: 'daily', label: 'Günün Sorusu' },
    { id: 'exam', label: 'Deneme' },
  ];
  const activeLayer = LAYERS.find((layer) => layer.id === mode);
  const activeTopicLabel = reviewMode
    ? 'ARALIKLI TEKRAR'
    : isDaily
      ? 'GÜNÜN SORUSU'
      : isExam
        ? 'DENEME SINAVI'
        : isBank
        ? 'SORU BANKASI'
        : activeLayer
          ? `${activeLayer.label.toLocaleUpperCase('tr')} · ${isMcq ? 'TEST' : 'HARİTA'}`
          : 'KARMA';

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: Platform.OS === 'web' ? 16 : insets.top }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 110 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Geri"
            onPress={() => router.navigate('/')}
            style={({ pressed }) => [styles.iconButton, { backgroundColor: colors.muted, opacity: pressed ? 0.7 : 1 }]}
            hitSlop={8}
          >
            <Feather name="chevron-left" size={20} color={colors.foreground} />
          </Pressable>
          <View style={styles.progressWrap}>
            <View style={styles.progressLabels}>
              <Text style={[styles.progressCurrent, { color: colors.foreground }]}>
                {reviewComplete ? 'BİTTİ' : `Soru ${Math.min(questionIndex + 1, Math.max(totalQuestions, 1))}`}
              </Text>
              <Text style={[styles.progressTotal, { color: colors.mutedForeground }]}>
                {isExamFlow ? `/ ${examLength}` : totalQuestions > 0 ? `/ ${totalQuestions}` : ''}
              </Text>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
              <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${progress}%` }]} />
            </View>
          </View>
          {isExamFlow ? (
            <View style={[styles.timerPill, { backgroundColor: colors.muted }]}>
              <Feather name="clock" size={14} color={examSecondsLeft <= 60 ? colors.destructive : colors.primary} />
              <Text style={[styles.timerText, { color: examSecondsLeft <= 60 ? colors.destructive : colors.primary }]}>{examTimeLabel}</Text>
            </View>
          ) : (
            <View style={[styles.scorePill, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="target" size={14} color={colors.primary} />
              <Text style={[styles.scoreText, { color: colors.foreground }]}>{correct}/{answered}</Text>
            </View>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {modeOptions.map((option) => {
            const active = mode === option.id;
            return (
              <Pressable
                key={option.id}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => changeMode(option.id)}
                style={[
                  styles.chip,
                  active
                    ? { backgroundColor: colors.primary }
                    : { backgroundColor: colors.muted },
                ]}
                testID={`quiz-mode-${option.id}`}
              >
                <Text
                  numberOfLines={1}
                  style={[styles.chipText, { color: active ? colors.primaryForeground : colors.mutedForeground }]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {isLayerMode && !reviewMode && (
          <View style={[styles.formatSwitch, { backgroundColor: colors.muted }]}>
            {(
              [
                { id: 'map', label: 'Haritada Bul' },
                { id: 'mcq', label: 'Çoktan Seçmeli' },
                { id: 'tf', label: 'Doğru/Yanlış' },
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
    setTfPick(null);
                  }}
                  style={[styles.formatOption, active && { backgroundColor: colors.card }]}
                  testID={`quiz-format-${fmt.id}`}
                >
                  <Text style={[styles.formatText, { color: active ? colors.primary : colors.mutedForeground }]}>
                    {fmt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        <Animated.View
          key={`${mode}-${questionIndex}-${reviewMode ? 'r' : 'n'}`}
          entering={FadeInDown.duration(160)}
          style={[styles.promptCard, promptStyle, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={styles.promptTop}>
            <View style={[styles.topicPill, { backgroundColor: colors.accent }]}>
              <Text style={[styles.topicPillText, { color: colors.primary }]}>{activeTopicLabel}</Text>
            </View>
            {hasTarget && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Soruyu seslendir"
                onPress={() => void speakTurkish(isMcq && bankEntry ? bankEntry.mcq.q : targetName)}
                hitSlop={8}
                style={styles.speakButton}
              >
                <Feather name="volume-2" size={15} color={colors.mutedForeground} />
              </Pressable>
            )}
          </View>
          <Text style={[styles.question, { color: colors.foreground }]}>
            {reviewComplete
              ? 'Bugünkü tekrar turunu tamamladın.'
              : isExamFlow && examDone
                ? isDaily
                  ? 'Günün soruları bitti — sonucun aşağıda.'
                  : 'Deneme bitti — sonucun aşağıda.'
                : !hasTarget
                ? reviewMode && !hydrated ? 'Tekrar öğeleri yükleniyor.' : 'Bu katmanda tekrar bekleyen öğe bulunamadı.'
                : isMcq && bankEntry
                  ? bankEntry.mcq.q
                  : isTf
                    ? 'Bu ifade doğru mu, yanlış mı?'
                    : isProvinceQuestion
                    ? `${targetName} ilini haritada bul.`
                    : `${targetName} hangi il veya illerde?`}
          </Text>
          <Text style={[styles.instruction, { color: colors.mutedForeground }]}>
            {reviewComplete
              ? 'Tekrar listen güncellendi.'
              : isExamFlow && examDone
                ? isDaily
                  ? 'Skorun günün en iyisiyle karşılaştırılır.'
                  : 'Yeni deneme için soruları karıştır.'
                : hasTarget
                ? isTf
                  ? 'İfadeyi dikkatlice oku ve karar ver.'
                  : isMcq
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
        ) : isExamFlow && examDone ? (
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
              <Text style={[styles.examScore, { color: colors.foreground }]}>{examStats.correct}/{examLength} doğru</Text>
              <Text style={[styles.examNet, { color: colors.primary }]}>Net: {examNet.toFixed(2)}</Text>
              {isDaily && dailyBest > 0 && (
                <Text style={[styles.examAccuracy, { color: colors.primary }]}>
                  Günün en iyi skoru: {dailyBest}/{DAILY_LENGTH}
                </Text>
              )}
              <Text style={[styles.examAccuracy, { color: colors.mutedForeground }]}>
                {examStats.wrong} yanlış{examUnanswered > 0 ? ` · ${examUnanswered} boş` : ''} · {Math.floor(examUsedSeconds / 60)}:{String(examUsedSeconds % 60).padStart(2, '0')} kullanıldı
              </Text>
              {examWrongEntries.length > 0 && (
                <View style={[styles.wrongList, { borderTopColor: colors.border }]}>
                  <Text style={[styles.wrongListTitle, { color: colors.foreground }]}>Yanlışlar</Text>
                  {examWrongEntries.slice(0, 6).map((entry, index) => (
                    <View key={`${entry.name}-${index}`} style={styles.wrongRow}>
                      <Feather name="x-circle" size={12} color={colors.destructive} />
                      <Text style={[styles.wrongName, { color: colors.mutedForeground }]} numberOfLines={1}>{entry.name}</Text>
                    </View>
                  ))}
                  {examWrongEntries.length > 6 && (
                    <Text style={[styles.wrongMore, { color: colors.mutedForeground }]}>+{examWrongEntries.length - 6} yanlış daha</Text>
                  )}
                </View>
              )}
              {examWeakLayer && examWeakLayer.wrong > 0 && (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push({ pathname: '/quiz', params: { mode: examWeakLayer.layerId } })}
                  style={[styles.weakSuggestion, { backgroundColor: colors.accent }]}
                  testID="exam-weak-suggestion"
                >
                  <Feather name="target" size={13} color={colors.primary} />
                  <Text style={[styles.weakSuggestionText, { color: colors.accentForeground }]} numberOfLines={1}>
                    En zayıf konu: {LAYERS.find((layer) => layer.id === examWeakLayer.layerId)?.label ?? examWeakLayer.layerId} ({examWeakLayer.wrong} yanlış)
                  </Text>
                  <Feather name="arrow-right" size={13} color={colors.primary} />
                </Pressable>
              )}
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
                dailyRecordedRef.current = false;
                setExamSecondsLeft(examSecondsTotal);
                setExamStats({ correct: 0, wrong: 0 });
                setExamLayers({});
                setExamLog([]);
                setQuestionIndex(0);
                setMcqPick(null);
    setTfPick(null);
              }}
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
              testID="restart-exam"
            >
              <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>Yeni deneme</Text>
              <Feather name="rotate-cw" size={16} color={colors.primaryForeground} />
            </PressableScale>
          </View>
        ) : isTf ? (
          tfQuestion ? (
            <View style={[styles.optionsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.tfStatement, { color: colors.foreground }]}>{tfQuestion.statement}</Text>
              <View style={styles.tfRow}>
                {([true, false] as const).map((pick) => {
                  const picked = tfPick === pick;
                  const showResult = tfPick !== null;
                  const isRight = pick === tfQuestion.answer;
                  const borderColor = !showResult ? colors.border : isRight ? colors.success : picked ? colors.destructive : colors.border;
                  const bg = !showResult ? 'transparent' : isRight ? colors.successBackground : picked ? colors.errorBackground : 'transparent';
                  return (
                    <Pressable
                      key={String(pick)}
                      accessibilityRole="button"
                      disabled={tfPick !== null}
                      onPress={() => chooseTf(pick)}
                      style={[styles.tfOption, { borderColor, backgroundColor: bg }]}
                      testID={`tf-option-${pick ? 'true' : 'false'}`}
                    >
                      <Text style={[styles.tfOptionText, { color: colors.foreground }]}>{pick ? 'Doğru' : 'Yanlış'}</Text>
                      {showResult && isRight && <Feather name="check" size={15} color={colors.success} />}
                    </Pressable>
                  );
                })}
              </View>
              {tfPick !== null && (
                <Animated.View
                  entering={tfPick === tfQuestion.answer ? BounceIn.duration(480) : FadeInDown.duration(160)}
                  style={[styles.feedback, { backgroundColor: tfPick === tfQuestion.answer ? colors.successBackground : colors.errorBackground }]}
                >
                  <Feather name={tfPick === tfQuestion.answer ? 'check-circle' : 'x-circle'} size={18} color={tfPick === tfQuestion.answer ? colors.success : colors.destructive} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.feedbackTitle, { color: tfPick === tfQuestion.answer ? colors.successForeground : colors.errorForeground }]}>
                      {tfPick === tfQuestion.answer ? 'Doğru cevap' : 'Bu kez olmadı'}
                    </Text>
                    <Text style={[styles.feedbackText, { color: tfPick === tfQuestion.answer ? colors.successMuted : colors.errorMuted }]}>
                      {tfPick === tfQuestion.answer
                        ? `${targetItem?.name ?? 'Öğe'} için ifade doğru.`
                        : `Doğru cevap: ${tfQuestion.answer ? 'Doğru' : 'Yanlış'} — ${(targetItem?.provinces ?? []).join(', ')}`}
                    </Text>
                  </View>
                </Animated.View>
              )}
            </View>
          ) : (
            <View style={[styles.reviewNotice, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="help-circle" size={19} color={colors.primary} />
              <Text style={[styles.hintText, { color: colors.mutedForeground }]}>Bu öğe için soru üretilemedi.</Text>
            </View>
          )
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

        {(answer || mcqPick || tfPick !== null) && (targetItem?.examTip || targetItem?.description) && (
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
        ) : answer || mcqPick || tfPick !== null ? (
          <PressableScale onPress={nextQuestion} style={[styles.primaryButton, { backgroundColor: colors.primary }]} testID="next-question">
            <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>
              {reviewMode && questionIndex + 1 >= reviewSession.length
                ? 'Tekrarı tamamla'
                : isExamFlow && questionIndex + 1 >= examLength
                  ? 'Bitir'
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
  content: { paddingHorizontal: 20, paddingTop: 12, gap: 14 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  progressWrap: { flex: 1, gap: 6 },
  progressLabels: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  progressCurrent: { fontSize: 13, fontWeight: '700' },
  progressTotal: { fontSize: 12, fontWeight: '600' },
  progressTrack: { height: 5, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 5, borderRadius: 3 },
  timerPill: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, flexDirection: 'row', gap: 6, alignItems: 'center' },
  timerText: { fontSize: 12, fontWeight: '700' },
  scorePill: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7, flexDirection: 'row', gap: 6, alignItems: 'center' },
  scoreText: { fontSize: 12, fontWeight: '700' },
  chipRow: { gap: 8, paddingVertical: 2 },
  chip: { borderRadius: 999, paddingHorizontal: 15, minHeight: 38, alignItems: 'center', justifyContent: 'center' },
  chipText: { fontSize: 12, fontWeight: '600' },
  formatSwitch: { borderRadius: 999, padding: 4, flexDirection: 'row', gap: 4 },
  formatOption: { flex: 1, borderRadius: 999, minHeight: 38, alignItems: 'center', justifyContent: 'center' },
  formatText: { fontSize: 12, fontWeight: '600' },
  promptCard: { borderWidth: 1, borderRadius: 22, padding: 18, gap: 8 },
  promptTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  speakButton: { padding: 4 },
  topicPill: { borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4 },
  topicPillText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.6 },
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
  primaryButton: { minHeight: 52, borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  primaryButtonText: { fontSize: 14, fontWeight: '700' },
  hintRow: { borderWidth: 1, borderRadius: 15, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 9 },
  optionsCard: { borderWidth: 1, borderRadius: 21, padding: 12, gap: 9 },
  optionRow: { minHeight: 48, borderRadius: 14, borderWidth: 1, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  optionBadge: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  optionBadgeText: { fontSize: 11, fontWeight: '700' },
  optionText: { flex: 1, fontSize: 13, fontWeight: '600' },
  tagChip: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  tagChipText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  tfStatement: { fontSize: 15, fontWeight: '700', lineHeight: 21, textAlign: 'center', paddingVertical: 6 },
  tfRow: { flexDirection: 'row', gap: 9 },
  tfOption: { flex: 1, minHeight: 52, borderRadius: 14, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  tfOptionText: { fontSize: 13, fontWeight: '700' },
  examResult: { alignItems: 'center', gap: 8, paddingVertical: 10 },
  ringWrap: { width: 88, height: 88, alignItems: 'center', justifyContent: 'center' },
  ringCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  ringPercent: { fontSize: 20, fontWeight: '700' },
  examScore: { fontSize: 16, fontWeight: '700' },
  examNet: { fontSize: 15, fontWeight: '700' },
  examAccuracy: { fontSize: 12, fontWeight: '600' },
  wrongList: { alignSelf: 'stretch', borderTopWidth: 1, marginTop: 6, paddingTop: 10, gap: 5 },
  wrongListTitle: { fontSize: 11, fontWeight: '700', marginBottom: 2 },
  wrongRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  wrongName: { flex: 1, fontSize: 11 },
  wrongMore: { fontSize: 10, fontWeight: '600', marginTop: 2 },
  weakSuggestion: { alignSelf: 'stretch', borderRadius: 12, paddingHorizontal: 11, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  weakSuggestionText: { flex: 1, fontSize: 11, fontWeight: '600' },
  layerBreakdown: { borderTopWidth: 1, marginTop: 8, paddingTop: 10, alignSelf: 'stretch', gap: 7 },
  layerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  layerRowLabel: { width: 74, fontSize: 9, fontWeight: '700' },
  layerRowTrack: { flex: 1, height: 5, borderRadius: 3, overflow: 'hidden' },
  layerRowFill: { height: 5, borderRadius: 3 },
  layerRowCount: { width: 30, fontSize: 9, fontWeight: '700', textAlign: 'right' },
  hintText: { flex: 1, fontSize: 11, lineHeight: 17 },
});
