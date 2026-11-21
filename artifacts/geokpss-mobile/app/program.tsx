import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { AppText as Text } from '@/components/AppText';
import { useStudy } from '@/context/StudyContext';
import { useColors } from '@/hooks/useColors';
import { localDayKey, studyStreak } from '@/utils/study';
import type { LayerId } from '@/data/geography';

type TaskRoute = { pathname: string; params?: Record<string, string> };

type ProgramTask = {
  id: string;
  title: string;
  detail: string;
  icon: keyof typeof Feather.glyphMap;
  route: TaskRoute;
  autoDone: boolean;
  custom?: boolean;
};

const RING_RADIUS = 26;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export default function ProgramScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { program, dailyActivity, reviewItems, toggleProgramTask, addProgramTask, removeProgramTask } = useStudy();
  const [customDraft, setCustomDraft] = useState('');

  const todayKey = localDayKey();
  const day = program[todayKey] ?? { done: [], custom: [] };
  const doneSet = useMemo(() => new Set(day.done), [day.done]);
  const todayAnswered = dailyActivity[todayKey]?.answered ?? 0;
  const streak = useMemo(() => studyStreak(dailyActivity), [dailyActivity]);

  const dueItems = useMemo(
    () => reviewItems.filter((item) => item.dueAt <= Date.now()).sort((a, b) => a.dueAt - b.dueAt),
    [reviewItems],
  );

  const reviewRoute = useMemo<TaskRoute>(() => {
    if (dueItems.length === 0) return { pathname: '/quiz', params: { mode: 'mixed' } } as TaskRoute;
    const byLayer = new Map<LayerId, string[]>();
    for (const item of dueItems.slice(0, 8)) {
      const list = byLayer.get(item.layer) ?? [];
      list.push(item.id);
      byLayer.set(item.layer, list);
    }
    const [layer, ids] = [...byLayer.entries()].sort((a, b) => b[1].length - a[1].length)[0];
    return { pathname: '/quiz', params: { mode: layer, reviewIds: ids.join(',') } };
  }, [dueItems]);

  const tasks = useMemo<ProgramTask[]>(() => {
    const list: ProgramTask[] = [
      {
        id: 'quiz-10',
        title: '10 karma coğrafya sorusu çöz',
        detail: todayAnswered >= 10 ? 'Bugün tamamlandı' : `${Math.min(todayAnswered, 10)}/10 soru`,
        icon: 'help-circle',
        route: { pathname: '/quiz', params: { mode: 'mixed' } },
        autoDone: todayAnswered >= 10,
      },
      {
        id: 'review-due',
        title: `Tekrar listesinden ${Math.min(5, Math.max(dueItems.length, 1))} öğe çalış`,
        detail: dueItems.length > 0 ? `${dueItems.length} öğe bekliyor` : 'Bekleyen tekrar yok — aferin',
        icon: 'repeat',
        route: reviewRoute,
        autoDone: false,
      },
      {
        id: 'map-5',
        title: 'Dilsiz haritada 5 il bul',
        detail: 'Harita modu · ~5 dk',
        icon: 'map',
        route: { pathname: '/quiz', params: { mode: 'provinces' } },
        autoDone: false,
      },
      {
        id: 'note-1',
        title: '1 konu için not veya kod ekle',
        detail: 'Notlar · ~4 dk',
        icon: 'edit-3',
        route: { pathname: '/notes' },
        autoDone: false,
      },
      {
        id: 'deck-20',
        title: '20 kartlık flashcard turu',
        detail: 'Harita detayı · ~8 dk',
        icon: 'layers',
        route: { pathname: '/' },
        autoDone: false,
      },
      {
        id: 'exam-15',
        title: '15 soruluk kısa deneme',
        detail: 'Soru bankası · ~12 dk',
        icon: 'target',
        route: { pathname: '/quiz', params: { mode: 'bank' } },
        autoDone: false,
      },
    ];
    for (const custom of day.custom) {
      list.push({
        id: `custom:${custom.id}`,
        title: custom.title,
        detail: 'Özel görev',
        icon: 'plus-circle',
        route: { pathname: '/quiz', params: { mode: 'mixed' } },
        autoDone: false,
        custom: true,
      });
    }
    return list;
  }, [day.custom, dueItems.length, reviewRoute, todayAnswered]);

  const isDone = (task: ProgramTask) => task.autoDone || doneSet.has(task.id);
  const doneCount = tasks.filter(isDone).length;
  const totalCount = tasks.length;
  const percent = totalCount > 0 ? doneCount / totalCount : 0;
  const nextTask = tasks.find((task) => !isDone(task)) ?? null;
  const allDone = totalCount > 0 && doneCount === totalCount;
  const recommendedId = nextTask?.id ?? null;

  const dateLabel = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' });

  const toggle = (taskId: string) => {
    if (tasks.find((task) => task.id === taskId)?.autoDone) return;
    void Haptics.selectionAsync();
    toggleProgramTask(taskId);
  };

  const submitCustom = () => {
    const title = customDraft.trim();
    if (!title) return;
    void Haptics.selectionAsync();
    addProgramTask(title);
    setCustomDraft('');
  };

  const goNext = () => {
    const target = nextTask ?? tasks[0];
    if (target) router.push(target.route as never);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: Platform.OS === 'web' ? 16 : insets.top }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Geri dön"
            onPress={() => router.back()}
            style={[styles.back, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Feather name="arrow-left" size={18} color={colors.foreground} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.foreground }]}>Bugünün Programı</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{dateLabel}</Text>
          </View>
          {streak > 0 && (
            <View style={[styles.streakBadge, { backgroundColor: colors.premiumBackground }]}>
              <MaterialCommunityIcons name="fire" size={14} color={colors.premium} />
              <Text style={[styles.streakBadgeText, { color: colors.premium }]}>{streak} Gün</Text>
            </View>
          )}
        </View>

        <View style={[styles.progressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.progressTop}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.caps, { color: colors.primary }]}>GÜNLÜK HEDEF</Text>
              <Text style={[styles.progressTitle, { color: colors.foreground }]}>
                {allDone ? 'Program tamamlandı!' : doneCount > 0 ? 'Harika ilerleme!' : 'Güne başla!'}
              </Text>
            </View>
            <View style={[styles.percentBadge, { backgroundColor: colors.premiumBackground }]}>
              <Feather name="zap" size={12} color={colors.premium} />
              <Text style={[styles.percentText, { color: colors.premium }]}>%{Math.round(percent * 100)} Hazır</Text>
            </View>
          </View>
          <View style={styles.ringRow}>
            <View style={styles.ringWrap}>
              <Svg width={56} height={56} viewBox="0 0 56 56">
                <Circle cx="28" cy="28" r={RING_RADIUS} fill="none" stroke={colors.muted} strokeWidth="5" />
                <Circle
                  cx="28"
                  cy="28"
                  r={RING_RADIUS}
                  fill="none"
                  stroke={colors.primary}
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={RING_CIRCUMFERENCE}
                  strokeDashoffset={RING_CIRCUMFERENCE * (1 - percent)}
                  rotation={-90}
                  origin="28, 28"
                />
              </Svg>
              <Text style={[styles.ringText, { color: colors.primary }]}>
                {doneCount}/{totalCount}
              </Text>
            </View>
            <View style={{ flex: 1, gap: 6 }}>
              <View style={styles.miniStatRow}>
                <Text style={[styles.miniStatLabel, { color: colors.mutedForeground }]}>Görev tamamlama</Text>
                <Text style={[styles.miniStatValue, { color: colors.primary }]}>{totalCount - doneCount} kaldı</Text>
              </View>
              <View style={[styles.barTrack, { backgroundColor: colors.muted }]}>
                <View style={[styles.barFill, { backgroundColor: colors.primary, width: `${Math.round(percent * 100)}%` }]} />
              </View>
              <Text style={[styles.miniHint, { color: colors.mutedForeground }]}>
                {allDone ? 'Tüm görevler bitti, yarın yine bekliyoruz.' : `${totalCount - doneCount} görev seni bekliyor.`}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.list}>
          {tasks.map((task) => {
            const done = isDone(task);
            const recommended = task.id === recommendedId;
            return (
              <Pressable
                key={task.id}
                accessibilityRole="button"
                accessibilityLabel={`${task.title} — ${done ? 'tamamlandı' : 'bekliyor'}`}
                accessibilityState={{ checked: done }}
                onPress={() => toggle(task.id)}
                onLongPress={task.custom ? () => removeProgramTask(task.id) : undefined}
                style={[
                  styles.taskCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: recommended && !done ? colors.premium : colors.border,
                  },
                  recommended && !done && { borderWidth: 1.5 },
                ]}
              >
                <View
                  style={[
                    styles.checkCircle,
                    { borderColor: done ? colors.primary : colors.border, backgroundColor: done ? colors.primary : 'transparent' },
                  ]}
                >
                  {done && <Feather name="check" size={13} color={colors.primaryForeground} />}
                </View>
                <View style={[styles.taskIcon, { backgroundColor: done ? colors.muted : colors.accent }]}>
                  <Feather name={task.icon} size={15} color={done ? colors.mutedForeground : colors.primary} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text
                    style={[
                      styles.taskTitle,
                      { color: done ? colors.mutedForeground : colors.foreground },
                      done && styles.taskTitleDone,
                    ]}
                    numberOfLines={2}
                  >
                    {task.title}
                  </Text>
                  <Text style={[styles.taskDetail, { color: colors.mutedForeground }]}>{task.detail}</Text>
                  {recommended && !done && (
                    <View style={[styles.recoBadge, { backgroundColor: colors.premiumBackground }]}>
                      <Feather name="star" size={9} color={colors.premium} />
                      <Text style={[styles.recoText, { color: colors.premium }]}>ÖNERİLEN</Text>
                    </View>
                  )}
                </View>
                {!done && (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${task.title} görevine git`}
                    onPress={() => router.push(task.route as never)}
                    style={[styles.startChip, { backgroundColor: colors.accent }]}
                  >
                    <Text style={[styles.startChipText, { color: colors.accentForeground }]}>Başla</Text>
                    <Feather name="arrow-right" size={11} color={colors.accentForeground} />
                  </Pressable>
                )}
              </Pressable>
            );
          })}

          <View style={[styles.addRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              value={customDraft}
              onChangeText={setCustomDraft}
              placeholder="Kendi görevinizi ekleyin…"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.addInput, { color: colors.foreground }]}
              maxLength={80}
              returnKeyType="done"
              onSubmitEditing={submitCustom}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Görev ekle"
              onPress={submitCustom}
              style={[styles.addButton, { backgroundColor: colors.primary }]}
            >
              <Feather name="plus" size={16} color={colors.primaryForeground} />
            </Pressable>
          </View>
          <Text style={[styles.addHint, { color: colors.mutedForeground }]}>Eklediğiniz görevi silmek için basılı tutun.</Text>
        </View>

        {streak > 0 && !allDone && (
          <View style={[styles.streakCard, { backgroundColor: colors.premiumBackground }]}>
            <MaterialCommunityIcons name="fire" size={18} color={colors.premium} />
            <Text style={[styles.streakCardText, { color: colors.foreground }]}>
              Serini korumak için bugün en az 1 görev daha tamamla — {streak}. gün serisi devam ediyor.
            </Text>
          </View>
        )}

        <Pressable
          accessibilityRole="button"
          onPress={goNext}
          style={[styles.cta, { backgroundColor: colors.primary }]}
          testID="program-next"
        >
          <Text style={[styles.ctaText, { color: colors.primaryForeground }]}>
            {allDone ? 'Tebrikler! Quiz ile pekiştir →' : nextTask ? 'Sıradaki göreve git →' : 'Kendine bir görev ekle'}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 40, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 6 },
  back: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '700' },
  subtitle: { fontSize: 12, marginTop: 1 },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  streakBadgeText: { fontSize: 12, fontWeight: '700' },
  progressCard: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 12 },
  progressTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  caps: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2 },
  progressTitle: { fontSize: 17, fontWeight: '700', marginTop: 2 },
  percentBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  percentText: { fontSize: 11, fontWeight: '700' },
  ringRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  ringWrap: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  ringText: { position: 'absolute', fontSize: 13, fontWeight: '700' },
  miniStatRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  miniStatLabel: { fontSize: 11 },
  miniStatValue: { fontSize: 12, fontWeight: '700' },
  barTrack: { height: 7, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  miniHint: { fontSize: 11, lineHeight: 15 },
  list: { gap: 9 },
  taskCard: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, borderWidth: 1, padding: 12 },
  checkCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  taskIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  taskTitle: { fontSize: 13.5, fontWeight: '600', lineHeight: 18 },
  taskTitleDone: { textDecorationLine: 'line-through' },
  taskDetail: { fontSize: 11 },
  recoBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2, marginTop: 3 },
  recoText: { fontSize: 8.5, fontWeight: '700', letterSpacing: 0.6 },
  startChip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6 },
  startChipText: { fontSize: 10.5, fontWeight: '700' },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, borderWidth: 1, paddingLeft: 12, paddingRight: 5, paddingVertical: 5 },
  addInput: { flex: 1, fontSize: 13, paddingVertical: 8 },
  addButton: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  addHint: { fontSize: 10.5, textAlign: 'center', marginTop: -4 },
  streakCard: { flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 14, padding: 12 },
  streakCardText: { flex: 1, fontSize: 12, fontWeight: '600', lineHeight: 17 },
  cta: { borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  ctaText: { fontSize: 14, fontWeight: '700' },
});
