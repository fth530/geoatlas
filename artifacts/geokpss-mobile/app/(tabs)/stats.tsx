import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { STATUS_LABEL, STATUS_OPTIONS, TOPIC_DETAILS, TopicStatus } from '@/data/geography';
import { useStudy } from '@/context/StudyContext';
import { localDayKey } from '@/utils/study';
import { AppText as Text } from '@/components/AppText';
import { FONT_FAMILY } from '@/constants/typography';
import { PressableScale } from '@/components/PressableScale';
import { useColors } from '@/hooks/useColors';
import { isReminderEnabled, REMINDER_HOUR, REMINDER_MINUTE, setReminderEnabled } from '@/utils/reminders';

export default function StatsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { answered, correct, notes, proCandidates, reviewItems, topicStatuses, dailyActivity, dailyGoal, program, hydrated, importStudyData, resetStudyData, setDailyGoal } = useStudy();
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importMessage, setImportMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [reminderEnabled, setReminderEnabledState] = useState(false);
  const [reminderBusy, setReminderBusy] = useState(false);

  useEffect(() => {
    void isReminderEnabled().then(setReminderEnabledState);
  }, []);

  const toggleReminder = async (next: boolean) => {
    if (reminderBusy) return;
    setReminderBusy(true);
    const ok = await setReminderEnabled(next);
    setReminderBusy(false);
    if (ok) {
      setReminderEnabledState(next);
      setImportMessage({ ok: true, text: next ? 'Hatırlatıcı açıldı.' : 'Hatırlatıcı kapatıldı.' });
    } else {
      setImportMessage({ ok: false, text: next ? 'Bildirim izni verilmedi; hatırlatıcı açılamadı.' : 'Hatırlatıcı kapatılamadı.' });
    }
  };

  const stats = useMemo(() => {
    const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0;
    const dueCount = reviewItems.filter((item) => item.dueAt <= Date.now()).length;
    const mastered = reviewItems.filter((item) => item.successStreak >= 3).length;
    const weakCount = reviewItems.filter((item) => !item.lastCorrect).length;
    const statusCounts = TOPIC_DETAILS.reduce<Record<TopicStatus, number>>(
      (acc, topic) => {
        const status = (topicStatuses[topic.id] ?? 'new') as TopicStatus;
        acc[status] += 1;
        return acc;
      },
      { new: 0, studying: 0, review: 0, weak: 0, done: 0 },
    );
    const layerStats = TOPIC_DETAILS.map((topic) => {
      const items = reviewItems.filter((item) => item.layer === topic.id);
      return {
        topic,
        studied: items.length,
        mastered: items.filter((item) => item.successStreak >= 3).length,
        weak: items.filter((item) => !item.lastCorrect).length,
      };
    }).filter((entry) => entry.studied > 0);
    const topWeak = reviewItems
      .filter((item) => !item.lastCorrect)
      .sort((a, b) => b.attempts - a.attempts)
      .slice(0, 5);
    const week: { key: string; label: string; answered: number; correct: number }[] = [];
    const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = new Date(Date.now() - offset * 24 * 60 * 60 * 1000);
      const key = localDayKey(date);
      const day = dailyActivity[key] ?? { answered: 0, correct: 0 };
      week.push({ key, label: dayNames[date.getDay()], answered: day.answered, correct: day.correct });
    }
    const weekMax = Math.max(1, ...week.map((day) => day.answered));
    const weekTotal = week.reduce((sum, day) => sum + day.answered, 0);
    const todayKey = localDayKey();
    const todayAnswered = dailyActivity[todayKey]?.answered ?? 0;
    const todayCorrect = dailyActivity[todayKey]?.correct ?? 0;
    const goalPercent = Math.min(100, Math.round((todayAnswered / dailyGoal) * 100));
    let streak = 0;
    const streakCursor = new Date();
    if ((dailyActivity[localDayKey(streakCursor)]?.answered ?? 0) === 0) {
      streakCursor.setDate(streakCursor.getDate() - 1);
    }
    while ((dailyActivity[localDayKey(streakCursor)]?.answered ?? 0) > 0) {
      streak += 1;
      streakCursor.setDate(streakCursor.getDate() - 1);
      if (streak > 365) break;
    }
    return { accuracy, dueCount, mastered, weakCount, statusCounts, layerStats, topWeak, week, weekMax, weekTotal, todayAnswered, todayCorrect, goalPercent, streak };
  }, [answered, correct, notes, reviewItems, topicStatuses, dailyActivity, dailyGoal]);

  const exportData = async () => {
    const payload = {
      app: 'geokpss',
      version: 2,
      exportedAt: new Date().toISOString(),
      study: { notes, topicStatuses, reviewItems, answered, correct, proCandidates, dailyActivity, dailyGoal },
    };
    try {
      await Share.share({
        message: JSON.stringify(payload, null, 2),
        title: 'geokpss-yedek.json',
      });
    } catch {
      setImportMessage({ ok: false, text: 'Dışa aktarma bu platformda desteklenmiyor.' });
    }
  };

  const runImport = () => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('Yedekteki veriler bu cihazdaki mevcut ilerlemenin yerine geçecek. Onaylıyor musun?')) {
        applyImport();
      }
      return;
    }
    Alert.alert(
      'Veriler içe aktarılsın mı?',
      'Yedekteki veriler bu cihazdaki mevcut ilerlemenin yerine geçecek.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'İçe aktar', onPress: () => void applyImport() },
      ],
    );
  };

  const confirmReset = () => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('Tüm çalışma istatistiklerin, tekrar listen ve notların sıfırlanacak. Emin misin?')) {
        resetStudyData();
        setImportMessage({ ok: true, text: 'Tüm çalışma verileri sıfırlandı.' });
      }
      return;
    }
    Alert.alert(
      'Veriler sıfırlansın mı?',
      'Tüm çalışma istatistiklerin, tekrar listen ve notların kalıcı olarak silinecek.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sıfırla',
          style: 'destructive',
          onPress: () => {
            resetStudyData();
            setImportMessage({ ok: true, text: 'Tüm çalışma verileri sıfırlandı.' });
          },
        },
      ],
    );
  };
  const applyImport = () => {
    const ok = importStudyData(importText);
    setImportMessage(
      ok
        ? { ok: true, text: 'Veriler başarıyla içe aktarıldı.' }
        : { ok: false, text: 'Geçersiz yedek dosyası. GeoKPSS dışa aktarımını yapıştır.' },
    );
    if (ok) {
      setImportText('');
      setTimeout(() => setImportOpen(false), 900);
    }
  };

  const heroMetrics = [
    { label: 'Cevaplanan', value: String(answered), icon: 'check-circle' as const },
    { label: 'Tekrar bekleyen', value: String(stats.dueCount), icon: 'clock' as const },
    { label: 'Not sayısı', value: String(notes.length), icon: 'book-open' as const },
  ];
  const ringCircumference = 2 * Math.PI * 30;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: Platform.OS === 'web' ? 16 : insets.top }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 108 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.eyebrow, { color: colors.primary }]}>ÇALIŞMA ÖZETİ</Text>
            <Text style={[styles.title, { color: colors.foreground }]}>İstatistik</Text>
          </View>
          <View style={[styles.scorePill, { backgroundColor: colors.accent }]}>
            <Feather name="bar-chart-2" size={15} color={colors.primary} />
            <Text style={[styles.scoreText, { color: colors.primary }]}>{stats.mastered} güçlü</Text>
          </View>
        </View>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Quiz cevapların ve tekrar performansın burada özetlenir. Veriler bu cihazda saklanır.
        </Text>

        {!hydrated ? (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.muted, { color: colors.mutedForeground }]}>Veriler yükleniyor…</Text>
          </View>
        ) : answered === 0 && reviewItems.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.accent }]}>
              <Feather name="bar-chart" size={22} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Henüz veri yok</Text>
            <Text style={[styles.muted, { color: colors.mutedForeground }]}>Quiz çözmeye başladığında istatistiklerin burada oluşacak.</Text>
            <PressableScale
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/quiz' })}
              style={[styles.emptyButton, { backgroundColor: colors.primary }]}
              testID="stats-start-quiz"
            >
              <Text style={[styles.emptyButtonText, { color: colors.primaryForeground }]}>İlk quiz'i başlat</Text>
              <Feather name="arrow-right" size={14} color={colors.primaryForeground} />
            </PressableScale>
          </View>
        ) : (
          <>
            <View style={[styles.heroCard, { backgroundColor: colors.primary }]}>
              <View style={styles.heroTop}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.heroEyebrow, { color: colors.primaryForeground }]}>GENEL BAŞARI</Text>
                  <Text style={[styles.heroPercent, { color: colors.primaryForeground }]}>%{stats.accuracy}</Text>
                  <Text style={[styles.heroSub, { color: colors.primaryForeground }]}>doğruluk oranı</Text>
                </View>
                <View style={styles.heroRingWrap}>
                  <Svg width={72} height={72} viewBox="0 0 72 72">
                    <Circle cx={36} cy={36} r={30} stroke={`${colors.primaryForeground}33`} strokeWidth={7} fill="none" />
                    <Circle
                      cx={36}
                      cy={36}
                      r={30}
                      stroke={colors.primaryForeground}
                      strokeWidth={7}
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${(stats.accuracy / 100) * ringCircumference} ${ringCircumference}`}
                      rotation={-90}
                      origin="36, 36"
                    />
                  </Svg>
                  <View style={styles.heroRingCenter} pointerEvents="none">
                    <Text style={[styles.heroRingText, { color: colors.primaryForeground }]}>{stats.mastered} güçlü</Text>
                  </View>
                </View>
              </View>
              <View style={[styles.heroDivider, { backgroundColor: `${colors.primaryForeground}2E` }]} />
              <View style={styles.heroMetrics}>
                {heroMetrics.map((metric) => (
                  <View key={metric.label} style={styles.heroMetric}>
                    <Feather name={metric.icon} size={14} color={colors.primaryForeground} />
                    <Text style={[styles.heroMetricValue, { color: colors.primaryForeground }]}>{metric.value}</Text>
                    <Text style={[styles.heroMetricLabel, { color: colors.primaryForeground }]} numberOfLines={1}>{metric.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.goalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: colors.foreground }]}>Günlük hedef</Text>
                  <Text style={[styles.goalSub, { color: colors.mutedForeground }]}>
                    Bugün {stats.todayAnswered}/{dailyGoal} soru · {stats.todayCorrect} doğru
                  </Text>
                </View>
                <View style={[styles.goalRingWrap, { backgroundColor: colors.accent }]}>
                  <Text style={[styles.goalRingText, { color: colors.primary }]}>{stats.goalPercent}%</Text>
                </View>
              </View>
              <View style={[styles.goalTrack, { backgroundColor: colors.muted }]}>
                <View style={[styles.goalFill, { backgroundColor: stats.goalPercent >= 100 ? colors.success : colors.primary, width: `${stats.goalPercent}%` }]} />
              </View>
              <View style={styles.goalChips}>
                {[5, 10, 20, 30].map((goal) => {
                  const active = dailyGoal === goal;
                  return (
                    <Pressable
                      key={goal}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      onPress={() => setDailyGoal(goal)}
                      style={[styles.goalChip, active ? { backgroundColor: colors.primary } : { backgroundColor: colors.muted }]}
                    >
                      <Text style={[styles.goalChipText, { color: active ? colors.primaryForeground : colors.mutedForeground }]}>{goal}/gün</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Bugünün programını aç"
              onPress={() => router.push('/program')}
              style={[styles.card, styles.programEntry, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={[styles.programIcon, { backgroundColor: colors.accent }]}>
                <Feather name="check-square" size={17} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>Bugünün Programı</Text>
                <Text style={[styles.goalSub, { color: colors.mutedForeground }]}>
                  {(() => {
                    const day = program[localDayKey()] ?? { done: [], custom: [] };
                    const done = day.done.length + (stats.todayAnswered >= dailyGoal ? 1 : 0);
                    const total = 7 + day.custom.length;
                    return `${Math.min(done, total)}/${total} görev tamamlandı`;
                  })()}
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
            </Pressable>

            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.streakRow}>
                <View style={[styles.streakIcon, { backgroundColor: colors.accent }]}>
                  <Feather name="zap" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.streakValue, { color: colors.foreground }]}>{stats.streak} günlük seri</Text>
                  <Text style={[styles.streakSub, { color: colors.mutedForeground }]}>
                    {stats.streak >= 30 ? 'Efsane! 30+ gün çalışıyorsun.' : stats.streak >= 7 ? 'Harika gidiyorsun, seriyi koru!' : 'Her gün birkaç soru seriyi başlatır.'}
                  </Text>
                </View>
                {stats.streak > 0 && (
                  <View style={[styles.streakBadge, { backgroundColor: colors.primary }]}>
                    <Feather name="award" size={15} color={colors.primaryForeground} />
                  </View>
                )}
              </View>
              <View style={styles.streakDots}>
                {[7, 14, 30].map((milestone) => (
                  <View key={milestone} style={styles.streakMilestone}>
                    <View style={[styles.streakMilestoneDot, { backgroundColor: stats.streak >= milestone ? colors.primary : colors.muted }]} />
                    <Text style={[styles.streakMilestoneText, { color: stats.streak >= milestone ? colors.primary : colors.mutedForeground }]}>{milestone}g</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.weekHeader}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>Haftalık Aktivite</Text>
                <Text style={[styles.weekTotal, { color: colors.mutedForeground }]}>{stats.weekTotal} soru</Text>
              </View>
              <View style={styles.weekRow}>
                {stats.week.map((day, index) => {
                  const isToday = index === stats.week.length - 1;
                  const barHeight = day.answered > 0 ? Math.max(8, Math.round((day.answered / stats.weekMax) * 72)) : 4;
                  return (
                    <View key={day.key} style={styles.weekCol}>
                      <View style={[styles.weekBarTrack, { backgroundColor: colors.muted }]}>
                        <View
                          style={[
                            styles.weekBar,
                            {
                              height: barHeight,
                              backgroundColor: colors.primary,
                              opacity: day.answered > 0 ? (isToday ? 1 : 0.45) : 1,
                            },
                          ]}
                        />
                      </View>
                      <Text style={[styles.weekLabel, { color: isToday ? colors.primary : colors.mutedForeground }]}>{day.label}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Konu durumları</Text>
              <View style={styles.statusRow}>
                {STATUS_OPTIONS.map((option) => (
                  <View key={option.id} style={styles.statusItem}>
                    <View style={[styles.statusDot, { backgroundColor: option.color }]} />
                    <Text style={[styles.statusCount, { color: colors.foreground }]}>{stats.statusCounts[option.id]}</Text>
                    <Text style={[styles.statusName, { color: colors.mutedForeground }]} numberOfLines={1}>{STATUS_LABEL[option.id]}</Text>
                  </View>
                ))}
              </View>
            </View>

            {stats.layerStats.length > 0 && (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>Konu bazlı tekrar</Text>
                {stats.layerStats.map(({ topic, studied, mastered: strong, weak }) => (
                  <View key={topic.id} style={[styles.layerRow, { borderTopColor: colors.border }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.layerTitle, { color: colors.foreground }]}>{topic.title}</Text>
                      <Text style={[styles.layerSub, { color: colors.mutedForeground }]}>{studied} öğe takipte</Text>
                      <View style={[styles.miniTrack, { backgroundColor: colors.muted }]}>
                        <View
                          style={[
                            styles.miniFill,
                            { backgroundColor: colors.success, width: `${studied > 0 ? Math.round((strong / studied) * 100) : 0}%` },
                          ]}
                        />
                      </View>
                    </View>
                    <View style={styles.layerBadges}>
                      {strong > 0 && (
                        <View style={[styles.badge, { backgroundColor: colors.successBackground }]}>
                          <Text style={[styles.badgeText, { color: colors.successForeground }]}>{strong} güçlü</Text>
                        </View>
                      )}
                      {weak > 0 && (
                        <View style={[styles.badge, { backgroundColor: colors.errorBackground }]}>
                          <Text style={[styles.badgeText, { color: colors.errorForeground }]}>{weak} zayıf</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {stats.topWeak.length > 0 && (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>Sık yanlış yapılanlar</Text>
                {stats.topWeak.map((item, index) => (
                  <View key={item.id} style={[styles.weakRow, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
                    <View style={[styles.weakRank, { backgroundColor: colors.errorBackground }]}>
                      <Text style={[styles.weakRankText, { color: colors.errorForeground }]}>{index + 1}</Text>
                    </View>
                    <Text style={[styles.weakName, { color: colors.foreground }]} numberOfLines={1}>{item.targetName}</Text>
                    <Text style={[styles.weakCount, { color: colors.mutedForeground }]}>{item.attempts} deneme</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.reminderRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Günlük hatırlatıcı</Text>
              <Text style={[styles.muted, { color: colors.mutedForeground }]}>
                Her gün saat {String(REMINDER_HOUR).padStart(2, '0')}:{String(REMINDER_MINUTE).padStart(2, '0')}'de tekrar hatırlatması gönderir.
              </Text>
            </View>
            <Switch
              value={reminderEnabled}
              onValueChange={(next) => void toggleReminder(next)}
              disabled={reminderBusy || Platform.OS === 'web'}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={colors.card}
              accessibilityLabel="Günlük çalışma hatırlatıcısı"
              testID="reminder-toggle"
            />
          </View>
          {Platform.OS === 'web' && (
            <Text style={[styles.muted, { color: colors.mutedForeground }]}>Hatırlatıcı yalnızca mobil uygulamada çalışır.</Text>
          )}
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Çalışma verileri</Text>
          <Text style={[styles.muted, { color: colors.mutedForeground }]}>
            İlerleme, notlar ve tekrar listesini yedekleyip başka cihaza taşıyabilirsin.
          </Text>
          <View style={styles.dataButtons}>
            <Pressable onPress={() => void exportData()} style={[styles.dataButton, { backgroundColor: colors.accent }]} testID="export-study-data">
              <Feather name="upload" size={14} color={colors.primary} />
              <Text style={[styles.dataButtonText, { color: colors.primary }]}>Yedeği dışa aktar</Text>
            </Pressable>
            <Pressable onPress={() => { setImportMessage(null); setImportOpen(true); }} style={[styles.dataButton, { backgroundColor: colors.accent }]} testID="import-study-data">
              <Feather name="download" size={14} color={colors.primary} />
              <Text style={[styles.dataButtonText, { color: colors.primary }]}>Yedekten içe aktar</Text>
            </Pressable>
          </View>
          <Pressable
            onPress={confirmReset}
            style={[styles.dataButton, { backgroundColor: colors.errorBackground }]}
            testID="reset-study-data"
          >
            <Feather name="trash-2" size={14} color={colors.destructive} />
            <Text style={[styles.dataButtonText, { color: colors.destructive }]}>İlerlemeyi ve verileri sıfırla</Text>
          </Pressable>
          {importMessage && !importOpen && (
            <Text style={[styles.importNote, { color: importMessage.ok ? colors.success : colors.destructive }]}>{importMessage.text}</Text>
          )}
        </View>
      </ScrollView>

      <Modal visible={importOpen} animationType="slide" onRequestClose={() => setImportOpen(false)}>
        <View style={[styles.modalScreen, { backgroundColor: colors.background, paddingTop: Platform.OS === 'web' ? 16 : insets.top }]}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>Yedekten içe aktar</Text>
              <Text style={[styles.modalSubtitle, { color: colors.mutedForeground }]}>Dışa aktardığın GeoKPSS yedeğini buraya yapıştır.</Text>
            </View>
            <Pressable accessibilityLabel="Kapat" onPress={() => setImportOpen(false)} style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="x" size={19} color={colors.foreground} />
            </Pressable>
          </View>
          <TextInput
            value={importText}
            onChangeText={setImportText}
            placeholder='{"app":"geokpss", ...}'
            placeholderTextColor={colors.mutedForeground}
            multiline
            style={[styles.importInput, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border, fontFamily: FONT_FAMILY.regular }]}
            autoCapitalize="none"
            autoCorrect={false}
            testID="import-data-input"
          />
          {importMessage && (
            <Text style={[styles.importNote, { color: importMessage.ok ? colors.success : colors.destructive }]}>{importMessage.text}</Text>
          )}
          <PressableScale
            onPress={runImport}
            disabled={!importText.trim()}
            style={[styles.importButton, { backgroundColor: colors.primary, opacity: importText.trim() ? 1 : 0.5 }]}
            testID="run-import"
          >
            <Text style={[styles.importButtonText, { color: colors.primaryForeground }]}>İçe aktar</Text>
          </PressableScale>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 16, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 0.9 },
  title: { fontSize: 25, fontWeight: '700', marginTop: 4, letterSpacing: -0.4 },
  subtitle: { fontSize: 12, lineHeight: 18, marginTop: -7 },
  scorePill: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', gap: 6, alignItems: 'center' },
  scoreText: { fontSize: 12, fontWeight: '700' },
  card: { borderWidth: 1, borderRadius: 22, padding: 16, gap: 12 },
  cardTitle: { fontSize: 14, fontWeight: '700' },
  heroCard: { borderRadius: 24, padding: 18, gap: 14 },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  heroEyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 1.1, opacity: 0.85 },
  heroPercent: { fontSize: 40, fontWeight: '700', letterSpacing: -1, marginTop: 4 },
  heroSub: { fontSize: 11, fontWeight: '600', opacity: 0.85, marginTop: 2 },
  heroRingWrap: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center' },
  heroRingCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  heroRingText: { fontSize: 9, fontWeight: '700' },
  heroDivider: { height: 1 },
  heroMetrics: { flexDirection: 'row' },
  heroMetric: { flex: 1, alignItems: 'center', gap: 3 },
  heroMetricValue: { fontSize: 16, fontWeight: '700' },
  heroMetricLabel: { fontSize: 9, fontWeight: '600', opacity: 0.8 },
  weekHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  weekTotal: { fontSize: 11, fontWeight: '700' },
  goalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  goalSub: { fontSize: 11, marginTop: 3 },
  programEntry: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  programIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  goalRingWrap: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  goalRingText: { fontSize: 12, fontWeight: '700' },
  goalTrack: { height: 7, borderRadius: 4, overflow: 'hidden', marginTop: 11 },
  goalFill: { height: 7, borderRadius: 4 },
  goalChips: { flexDirection: 'row', gap: 7, marginTop: 11 },
  goalChip: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  goalChipText: { fontSize: 11, fontWeight: '700' },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  streakIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  streakValue: { fontSize: 15, fontWeight: '700' },
  streakSub: { fontSize: 11, marginTop: 2 },
  streakBadge: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  streakDots: { flexDirection: 'row', gap: 14, marginTop: 12 },
  streakMilestone: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  streakMilestoneDot: { width: 8, height: 8, borderRadius: 4 },
  streakMilestoneText: { fontSize: 10, fontWeight: '700' },
  weekRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 96 },
  weekCol: { flex: 1, alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' },
  weekBarTrack: { flex: 1, width: '100%', borderRadius: 8, justifyContent: 'flex-end', overflow: 'hidden' },
  weekBar: { width: '100%', borderRadius: 8 },
  weekLabel: { fontSize: 9, fontWeight: '700' },
  miniTrack: { height: 4, borderRadius: 2, marginTop: 6, overflow: 'hidden' },
  miniFill: { height: 4, borderRadius: 2 },
  weakRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9 },
  weakRank: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  weakRankText: { fontSize: 10, fontWeight: '700' },
  weakName: { flex: 1, fontSize: 12, fontWeight: '600' },
  weakCount: { fontSize: 10, fontWeight: '600' },
  reminderRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  muted: { fontSize: 12, lineHeight: 18 },
  empty: { borderWidth: 1, borderRadius: 22, padding: 24, alignItems: 'center', gap: 9 },
  emptyIcon: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 15, fontWeight: '700' },
  emptyButton: { marginTop: 3, minHeight: 42, borderRadius: 13, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 7 },
  emptyButtonText: { fontSize: 12, fontWeight: '700' },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statusItem: { alignItems: 'center', gap: 4, flex: 1 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusCount: { fontSize: 15, fontWeight: '700' },
  statusName: { fontSize: 8, maxWidth: 60 },
  layerRow: { borderTopWidth: 1, paddingTop: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  layerTitle: { fontSize: 12, fontWeight: '700' },
  layerSub: { fontSize: 10, marginTop: 2 },
  layerBadges: { flexDirection: 'row', gap: 5 },
  badge: { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 4 },
  badgeText: { fontSize: 9, fontWeight: '700' },
  dataButtons: { flexDirection: 'row', gap: 8 },
  dataButton: { flex: 1, minHeight: 40, borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  dataButtonText: { fontSize: 11, fontWeight: '700' },
  importNote: { fontSize: 11, lineHeight: 16 },
  modalScreen: { flex: 1, paddingHorizontal: 20 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  modalSubtitle: { fontSize: 12, marginTop: 4 },
  iconButton: { height: 38, width: 38, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  importInput: { flex: 1, borderWidth: 1, borderRadius: 15, padding: 13, fontSize: 11, textAlignVertical: 'top' },
  importButton: { minHeight: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  importButtonText: { fontSize: 13, fontWeight: '700' },
});
