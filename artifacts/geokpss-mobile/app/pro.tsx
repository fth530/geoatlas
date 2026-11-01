import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStudy } from '@/context/StudyContext';
import { AppText as Text } from '@/components/AppText';
import { useColors } from '@/hooks/useColors';

const CANDIDATES = [
  { id: 'layers', title: 'Gelişmiş harita katmanları', detail: 'Daha kapsamlı filtreler ve ek coğrafya verileri', icon: 'layers' },
  { id: 'quiz', title: 'Sınırsız harita quiz’i', detail: 'İl, dağ, göl ve yer şekilleri için soru setleri', icon: 'target' },
  { id: 'progress', title: 'İlerleme raporları', detail: 'Tekrar planı ve konu gelişim özeti', icon: 'bar-chart-2' },
  { id: 'notebook', title: 'Kişisel kodlama defteri', detail: 'Notları düzenleme ve dışa aktarma seçenekleri', icon: 'book-open' },
];

export default function ProScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { proCandidates, toggleProCandidate } = useStudy();
  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: Platform.OS === 'web' ? 16 : insets.top }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable accessibilityLabel="Geri dön" onPress={() => router.back()} style={[styles.back, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="arrow-left" size={18} color={colors.foreground} />
        </Pressable>
        <View style={[styles.heroIcon, { backgroundColor: colors.premiumBackground }]}><Feather name="star" size={23} color={colors.premium} /></View>
        <Text style={[styles.title, { color: colors.foreground }]}>Pro plan taslağı</Text>
        <Text style={[styles.intro, { color: colors.mutedForeground }]}>İleride hangi özelliklerin Pro planına gireceğini burada taslak olarak seçebilirsin.</Text>
        <View style={[styles.notice, { backgroundColor: colors.accent }]}>
          <Feather name="check-circle" size={17} color={colors.primary} />
          <Text style={[styles.noticeText, { color: colors.accentForeground }]}>Şu an uygulamadaki tüm özellikler açık. Ödeme veya kilit uygulanmıyor.</Text>
        </View>
        <Text style={[styles.section, { color: colors.foreground }]}>İleride planlanabilecek alanlar</Text>
        {CANDIDATES.map((item) => (
          <View key={item.title} style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.rowIcon, { backgroundColor: colors.muted }]}>
              <Feather name={item.icon as keyof typeof Feather.glyphMap} size={17} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, { color: colors.foreground }]}>{item.title}</Text>
              <Text style={[styles.rowText, { color: colors.mutedForeground }]}>{item.detail}</Text>
            </View>
            <View style={styles.switchColumn}>
              <Text style={[styles.openLabel, { color: proCandidates.includes(item.id) ? colors.premium : colors.primary, backgroundColor: proCandidates.includes(item.id) ? colors.premiumBackground : colors.accent }]}>
                {proCandidates.includes(item.id) ? 'PRO ADAYI' : 'AÇIK'}
              </Text>
              <Switch
                accessibilityLabel={`${item.title} Pro planı adayı`}
                value={proCandidates.includes(item.id)}
                onValueChange={() => toggleProCandidate(item.id)}
                trackColor={{ false: colors.border, true: colors.premium }}
                thumbColor={colors.card}
              />
            </View>
          </View>
        ))}
        <Text style={[styles.footnote, { color: colors.mutedForeground }]}>Seçtiklerin bu cihazdaki Pro taslağına kaydolur. Şimdilik hiçbir içerik kilitlenmez ve ödeme alınmaz.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 22, paddingTop: 12, paddingBottom: 40, gap: 15 },
  back: { width: 40, height: 40, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  heroIcon: { width: 48, height: 48, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  title: { fontSize: 25, fontWeight: '700', letterSpacing: -0.4 },
  intro: { fontSize: 14, lineHeight: 21, maxWidth: 330 },
  notice: { padding: 13, borderRadius: 15, flexDirection: 'row', alignItems: 'flex-start', gap: 9, marginTop: 3 },
  noticeText: { flex: 1, fontSize: 12, lineHeight: 18, fontWeight: '500' },
  section: { fontSize: 15, fontWeight: '700', marginTop: 7 },
  row: { minHeight: 72, borderWidth: 1, borderRadius: 18, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 12, fontWeight: '700' },
  rowText: { fontSize: 10, lineHeight: 15, marginTop: 3 },
  openLabel: { fontSize: 8, letterSpacing: 0.5, fontWeight: '700', overflow: 'hidden', paddingHorizontal: 7, paddingVertical: 5, borderRadius: 8 },
  switchColumn: { alignItems: 'center', gap: 1 },
  footnote: { fontSize: 11, lineHeight: 17, marginTop: 2 },
});
