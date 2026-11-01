import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { STATUS_LABEL, STATUS_OPTIONS, TOPIC_DETAILS, TopicStatus } from '@/data/geography';
import { useStudy } from '@/context/StudyContext';
import { AppText as Text } from '@/components/AppText';
import { useColors } from '@/hooks/useColors';

export default function TopicsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { hydrated, reviewItems, topicStatuses, setTopicStatus } = useStudy();
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const completed = TOPIC_DETAILS.filter((topic) => topicStatuses[topic.id] === 'done').length;
  const selectedTopic = TOPIC_DETAILS.find((topic) => topic.id === activeTopic);
  const dueReviews = hydrated ? reviewItems.filter((item) => item.dueAt <= Date.now()) : [];
  const dueReviewGroups = TOPIC_DETAILS
    .map((topic) => ({
      topic,
      items: dueReviews.filter((item) => item.layer === topic.id),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: Platform.OS === 'web' ? 16 : insets.top }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 108 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.eyebrow, { color: colors.primary }]}>KENDİ ÇALIŞMA PLANI</Text>
            <Text style={[styles.title, { color: colors.foreground }]}>Konu takibi</Text>
          </View>
          <View style={[styles.counter, { backgroundColor: colors.accent }]}>
            <Text style={[styles.counterValue, { color: colors.primary }]}>{completed}/{TOPIC_DETAILS.length}</Text>
            <Text style={[styles.counterLabel, { color: colors.mutedForeground }]}>bitti</Text>
          </View>
        </View>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Her başlığı kendi çalışma durumuna göre işaretle. Tekrar ve zayıf konuların burada kalsın.</Text>

        <View style={[styles.progressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={[styles.progressTitle, { color: colors.foreground }]}>Genel ilerleme</Text>
              <Text style={[styles.progressSub, { color: colors.mutedForeground }]}>Tamamladığın konu sayısı</Text>
            </View>
            <Feather name="trending-up" size={18} color={colors.primary} />
          </View>
          <View style={[styles.track, { backgroundColor: colors.muted }]}>
            <View style={[styles.fill, { backgroundColor: colors.primary, width: `${(completed / TOPIC_DETAILS.length) * 100}%` }]} />
          </View>
        </View>

        {hydrated && dueReviewGroups.length > 0 && (
          <View style={[styles.reviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.reviewHeader}>
              <View style={[styles.reviewIcon, { backgroundColor: colors.accent }]}>
                <Feather name="clock" size={16} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.progressTitle, { color: colors.foreground }]}>Bugün tekrar</Text>
                <Text style={[styles.progressSub, { color: colors.mutedForeground }]}>Quiz cevapların tekrar zamanını belirler.</Text>
              </View>
              <Text style={[styles.reviewCount, { color: colors.primary }]}>{dueReviews.length}</Text>
            </View>
            <View style={styles.reviewGroups}>
              {dueReviewGroups.map(({ topic, items }) => (
                <Pressable
                  key={topic.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${topic.title}, ${items.length} tekrar sorusu`}
                  onPress={() => router.push({
                    pathname: '/quiz',
                    params: { mode: topic.id, reviewIds: items.map((item) => item.id).join(',') },
                  })}
                  style={[styles.reviewRow, { backgroundColor: colors.background, borderColor: colors.border }]}
                  testID={`start-review-${topic.id}`}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.reviewTopic, { color: colors.foreground }]}>{topic.title}</Text>
                    <Text style={[styles.reviewNames, { color: colors.mutedForeground }]} numberOfLines={1}>
                      {items.map((item) => item.targetName).join(' · ')}
                    </Text>
                  </View>
                  <View style={[styles.reviewAction, { backgroundColor: colors.accent }]}>
                    <Text style={[styles.reviewActionText, { color: colors.primary }]}>{items.length} soru</Text>
                    <Feather name="arrow-right" size={13} color={colors.primary} />
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Tüm konular</Text>
          <View style={styles.statusLegend}>
            <View style={[styles.legendDot, { backgroundColor: '#C36D5C' }]} />
            <Text style={[styles.legendText, { color: colors.mutedForeground }]}>Zayıf</Text>
            <View style={[styles.legendDot, { backgroundColor: '#B78948' }]} />
            <Text style={[styles.legendText, { color: colors.mutedForeground }]}>Tekrar</Text>
          </View>
        </View>

        {TOPIC_DETAILS.map((topic) => {
          const status: TopicStatus = topicStatuses[topic.id] ?? 'new';
          const statusColor = STATUS_OPTIONS.find((option) => option.id === status)?.color ?? colors.mutedForeground;
          return (
            <View key={topic.id} style={[styles.topicCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.topicIcon, { backgroundColor: colors.accent }]}>
                <Feather name={topic.icon as keyof typeof Feather.glyphMap} size={17} color={colors.primary} />
              </View>
              <View style={styles.topicBody}>
                <Text style={[styles.topicTitle, { color: colors.foreground }]}>{topic.title}</Text>
                <Text style={[styles.topicSubtitle, { color: colors.mutedForeground }]}>{topic.subtitle}</Text>
                <View style={styles.topicActions}>
                  <Pressable
                    accessibilityLabel={`${topic.title} durumu: ${STATUS_LABEL[status]}. Durumu değiştir`}
                    onPress={() => setActiveTopic(topic.id)}
                    style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}
                  >
                    <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                    <Text style={[styles.statusText, { color: statusColor }]}>{STATUS_LABEL[status]}</Text>
                    <Feather name="chevron-down" size={12} color={statusColor} />
                  </Pressable>
                  <Pressable
                    onPress={() => router.push({ pathname: '/', params: { layer: topic.id } })}
                    style={[styles.mapLink, { borderColor: colors.border }]}
                  >
                    <Feather name="map" size={12} color={colors.primary} />
                    <Text style={[styles.mapLinkText, { color: colors.primary }]}>Haritada aç</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <Modal visible={!!activeTopic} transparent animationType="fade" onRequestClose={() => setActiveTopic(null)}>
        <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
          <View style={[styles.statusModal, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Konu durumu</Text>
            <Text style={[styles.modalSubtitle, { color: colors.mutedForeground }]}>{selectedTopic?.title}</Text>
            {STATUS_OPTIONS.map((option) => {
              const active = topicStatuses[activeTopic ?? ''] === option.id || (!topicStatuses[activeTopic ?? ''] && option.id === 'new');
              return (
                <Pressable
                  key={option.id}
                  onPress={() => {
                    if (activeTopic) setTopicStatus(activeTopic, option.id);
                    setActiveTopic(null);
                  }}
                  style={[styles.statusOption, { backgroundColor: active ? `${option.color}20` : colors.background }]}
                >
                  <View style={[styles.statusDot, { backgroundColor: option.color }]} />
                  <Text style={[styles.statusOptionText, { color: colors.foreground }]}>{option.label}</Text>
                  {active && <Feather name="check" size={16} color={option.color} />}
                </Pressable>
              );
            })}
            <Pressable onPress={() => setActiveTopic(null)} style={styles.cancelButton}>
              <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Vazgeç</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 18, paddingTop: 16, gap: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 0.9 },
  title: { fontSize: 25, fontWeight: '700', marginTop: 4, letterSpacing: -0.4 },
  subtitle: { fontSize: 12, lineHeight: 18, marginTop: -7 },
  counter: { minWidth: 58, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 7, alignItems: 'center' },
  counterValue: { fontSize: 13, fontWeight: '700' },
  counterLabel: { fontSize: 9, marginTop: 1 },
  progressCard: { borderWidth: 1, borderRadius: 20, padding: 14, gap: 13 },
  progressHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progressTitle: { fontSize: 13, fontWeight: '700' },
  progressSub: { fontSize: 10, marginTop: 3 },
  track: { height: 6, borderRadius: 4, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 4 },
  reviewCard: { borderWidth: 1, borderRadius: 20, padding: 12, gap: 11 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  reviewIcon: { width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  reviewCount: { fontSize: 18, fontWeight: '700' },
  reviewGroups: { gap: 7 },
  reviewRow: { minHeight: 49, borderWidth: 1, borderRadius: 13, paddingHorizontal: 10, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 7 },
  reviewTopic: { fontSize: 11, fontWeight: '700' },
  reviewNames: { fontSize: 9, marginTop: 3 },
  reviewAction: { borderRadius: 9, paddingHorizontal: 8, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 5 },
  reviewActionText: { fontSize: 9, fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  statusLegend: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 6, height: 6, borderRadius: 3, marginLeft: 4 },
  legendText: { fontSize: 9 },
  topicCard: { borderWidth: 1, borderRadius: 18, padding: 12, flexDirection: 'row', gap: 10 },
  topicIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  topicBody: { flex: 1, gap: 3 },
  topicTitle: { fontSize: 12, fontWeight: '700' },
  topicSubtitle: { fontSize: 10, lineHeight: 14 },
  topicActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 5 },
  statusBadge: { minHeight: 27, borderRadius: 10, paddingHorizontal: 8, flexDirection: 'row', gap: 5, alignItems: 'center' },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 9, fontWeight: '700' },
  mapLink: { minHeight: 27, borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, flexDirection: 'row', gap: 5, alignItems: 'center' },
  mapLinkText: { fontSize: 9, fontWeight: '600' },
  backdrop: { flex: 1, justifyContent: 'center', paddingHorizontal: 22 },
  statusModal: { padding: 17, borderRadius: 22, gap: 9 },
  modalTitle: { fontSize: 17, fontWeight: '700' },
  modalSubtitle: { fontSize: 12, marginTop: -5, marginBottom: 3 },
  statusOption: { minHeight: 42, borderRadius: 12, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 9 },
  statusOptionText: { flex: 1, fontSize: 12, fontWeight: '600' },
  cancelButton: { alignItems: 'center', paddingTop: 6 },
  cancelText: { fontSize: 12, fontWeight: '600' },
});
