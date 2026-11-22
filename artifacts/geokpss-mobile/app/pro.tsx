import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText as Text } from '@/components/AppText';
import { PressableScale } from '@/components/PressableScale';
import { useStudy } from '@/context/StudyContext';
import { useColors } from '@/hooks/useColors';
import {
  PRO_FEATURES_COMPARISON,
  SUBSCRIPTION_PLANS,
  SubscriptionPlanId,
} from '@/services/subscription-service';

export default function ProScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    isPro,
    activePlanId,
    proExpiresAt,
    todayAnsweredCount,
    remainingFreeQuestions,
    purchaseProPlan,
    restoreProPurchases,
    cancelProSubscription,
  } = useStudy();

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanId>(activePlanId ?? 'yearly');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [legalModal, setLegalModal] = useState<'terms' | 'privacy' | null>(null);

  const currentPlanMeta = SUBSCRIPTION_PLANS.find((p) => p.id === selectedPlan) ?? SUBSCRIPTION_PLANS[0];
  const activePlanMeta = SUBSCRIPTION_PLANS.find((p) => p.id === activePlanId);

  const handlePurchase = async () => {
    if (busy) return;
    setBusy(true);
    setFeedback(null);
    try {
      const result = await purchaseProPlan(selectedPlan);
      setFeedback({ ok: result.ok, text: result.message });
      if (result.ok) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleRestore = async () => {
    if (busy) return;
    setBusy(true);
    setFeedback(null);
    try {
      const result = await restoreProPurchases();
      setFeedback({ ok: result.ok, text: result.message });
      if (result.ok) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleCancelTest = async () => {
    await cancelProSubscription();
    setFeedback({
      ok: true,
      text: 'Abonelik ücretsiz (Free) moda sıfırlandı. Kilitleri test edebilirsiniz.',
    });
    void Haptics.selectionAsync();
  };

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: colors.background, paddingTop: Platform.OS === 'web' ? 16 : insets.top },
      ]}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Geri dön"
            onPress={() => router.back()}
            style={[styles.back, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Feather name="arrow-left" size={18} color={colors.foreground} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Satın alımları geri yükle"
            onPress={() => void handleRestore()}
            style={[styles.restoreChip, { backgroundColor: colors.card, borderColor: colors.border }]}
            testID="restore-purchases-top"
          >
            <Feather name="refresh-cw" size={13} color={colors.primary} />
            <Text style={[styles.restoreChipText, { color: colors.primary }]}>Geri Yükle</Text>
          </Pressable>
        </View>

        {/* Hero Banner */}
        <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.heroBadgeRow}>
            <View style={[styles.heroIcon, { backgroundColor: colors.premiumBackground }]}>
              <Feather name="award" size={22} color={colors.premium} />
            </View>
            <View style={[styles.seasonPill, { backgroundColor: colors.premiumBackground }]}>
              <Feather name="zap" size={11} color={colors.premium} />
              <Text style={[styles.seasonPillText, { color: colors.premium }]}>
                {isPro ? 'GEOKPSS PRO ÜYESİ' : '2026 KPSS TAM HAZIRLIK PAKETİ'}
              </Text>
            </View>
          </View>

          <Text style={[styles.title, { color: colors.foreground }]}>
            {isPro ? 'GeoKPSS Pro Aktif' : 'KPSS Coğrafya’da 18’de 18 Hedefle.'}
          </Text>
          <Text style={[styles.intro, { color: colors.mutedForeground }]}>
            {isPro
              ? `${activePlanMeta?.title ?? 'Pro Plan'} ile tüm 17 harita katmanı, 3B kabartma atlası, 18 soruluk süreli deneme sınavları ve hafıza şifreleri sınırsız açık.`
              : 'Tüm 17 özel harita katmanını (Ramsar, Antik Kentler, Maden, Tarım, Sanayi), 18 soruluk süreli KPSS denemelerini ve hafıza kodlamalarını sınırsız aç.'}
          </Text>

          {!isPro && (
            <View style={[styles.quotaBar, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <Feather name="target" size={15} color={colors.primary} />
              <Text style={[styles.quotaText, { color: colors.foreground }]}>
                Bugünkü Ücretsiz Soru Hakkın:{' '}
                <Text style={{ fontWeight: '700', color: colors.primary }}>
                  {remainingFreeQuestions} / 15 kaldı
                </Text>{' '}
                ({todayAnsweredCount} çözüldü)
              </Text>
            </View>
          )}

          {isPro && (
            <View style={[styles.activeSubBox, { backgroundColor: colors.successBackground }]}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[styles.activeSubTitle, { color: colors.successForeground }]}>
                  Aktif Paket: {activePlanMeta?.title ?? 'GeoKPSS Pro'}
                </Text>
                <Text style={[styles.activeSubMeta, { color: colors.successMuted }]}>
                  {proExpiresAt
                    ? `Bitiş / Yenilenme: ${new Date(proExpiresAt).toLocaleDateString('tr-TR')}`
                    : 'Ömür boyu süresiz tam erişim'}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() => void handleCancelTest()}
                style={[styles.sandboxResetBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                testID="reset-pro-sandbox"
              >
                <Text style={[styles.sandboxResetText, { color: colors.destructive }]}>Ücretsiz Moda Dön</Text>
              </Pressable>
            </View>
          )}
        </View>

        {feedback && (
          <View
            style={[
              styles.feedbackBanner,
              {
                backgroundColor: feedback.ok ? colors.successBackground : colors.errorBackground,
                borderColor: feedback.ok ? colors.success : colors.destructive,
              },
            ]}
          >
            <Feather
              name={feedback.ok ? 'check-circle' : 'alert-circle'}
              size={18}
              color={feedback.ok ? colors.success : colors.destructive}
            />
            <Text
              style={[
                styles.feedbackText,
                { color: feedback.ok ? colors.successForeground : colors.errorForeground },
              ]}
            >
              {feedback.text}
            </Text>
          </View>
        )}

        {/* Plan Selector Cards */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Abonelik Paketini Seç</Text>
        <View style={styles.plansCol}>
          {SUBSCRIPTION_PLANS.map((plan) => {
            const selected = selectedPlan === plan.id;
            const isCurrentActive = isPro && activePlanId === plan.id;
            return (
              <PressableScale
                key={plan.id}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => {
                  setSelectedPlan(plan.id);
                  void Haptics.selectionAsync();
                }}
                style={[
                  styles.planCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: selected ? colors.primary : colors.border,
                    borderWidth: selected ? 2 : 1,
                  },
                ]}
                testID={`plan-card-${plan.id}`}
              >
                {plan.badge && (
                  <View
                    style={[
                      styles.planBadge,
                      { backgroundColor: selected ? colors.primary : colors.premiumBackground },
                    ]}
                  >
                    <Text
                      style={[
                        styles.planBadgeText,
                        { color: selected ? colors.primaryForeground : colors.premium },
                      ]}
                    >
                      {isCurrentActive ? 'AKTİF PAKETİNİZ' : plan.badge}
                    </Text>
                  </View>
                )}

                <View style={styles.planMainRow}>
                  <View
                    style={[
                      styles.radioOuter,
                      {
                        borderColor: selected ? colors.primary : colors.mutedForeground,
                        backgroundColor: selected ? colors.primary : 'transparent',
                      },
                    ]}
                  >
                    {selected && <Feather name="check" size={12} color={colors.primaryForeground} />}
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={[styles.planTitle, { color: colors.foreground }]}>{plan.title}</Text>
                    <Text style={[styles.planSubtitle, { color: colors.mutedForeground }]}>{plan.subtitle}</Text>
                  </View>

                  <View style={styles.priceCol}>
                    <Text style={[styles.priceValue, { color: colors.foreground }]}>{plan.priceLabel}</Text>
                    <Text style={[styles.pricePeriod, { color: colors.mutedForeground }]}>{plan.periodLabel}</Text>
                  </View>
                </View>

                <View style={[styles.planFooterRow, { borderTopColor: colors.border }]}>
                  <Feather name="shield" size={12} color={colors.primary} />
                  <Text style={[styles.planEquivText, { color: colors.primary }]}>{plan.monthlyEquivalent}</Text>
                </View>
              </PressableScale>
            );
          })}
        </View>

        {/* Primary Purchase CTA */}
        <PressableScale
          accessibilityRole="button"
          disabled={busy}
          onPress={() => void handlePurchase()}
          style={[styles.ctaButton, { backgroundColor: colors.primary }]}
          testID="purchase-pro-cta"
        >
          {busy ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <>
              <Feather name="unlock" size={18} color={colors.primaryForeground} />
              <View style={{ alignItems: 'center' }}>
                <Text style={[styles.ctaTitle, { color: colors.primaryForeground }]}>
                  {isPro && activePlanId === selectedPlan
                    ? 'Bu Paket Zaten Aktif (Yenile)'
                    : currentPlanMeta.trialDays > 0
                      ? `${currentPlanMeta.trialDays} Gün Ücretsiz Dene ve Başla`
                      : `GeoKPSS Pro’yu Başlat (${currentPlanMeta.priceLabel})`}
                </Text>
                <Text style={[styles.ctaSub, { color: colors.primaryForeground }]}>
                  {currentPlanMeta.trialDays > 0
                    ? `Deneme sonunda ${currentPlanMeta.priceLabel} ${currentPlanMeta.periodLabel} · İstediğin an iptal et`
                    : 'Tek seferlik güvenli ödeme · Anında tüm kilitler açılır'}
                </Text>
              </View>
            </>
          )}
        </PressableScale>

        {/* Feature Comparison Table */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>GeoKPSS Pro Neleri Açar?</Text>
        <View style={styles.featuresList}>
          {PRO_FEATURES_COMPARISON.map((item) => (
            <View
              key={item.id}
              style={[styles.featureCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={[styles.featureIcon, { backgroundColor: colors.accent }]}>
                <Feather name={item.icon as keyof typeof Feather.glyphMap} size={17} color={colors.primary} />
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={[styles.featureTitle, { color: colors.foreground }]}>{item.title}</Text>
                <Text style={[styles.featureDetail, { color: colors.mutedForeground }]}>{item.detail}</Text>
                <View style={styles.comparisonPills}>
                  <View style={[styles.freePill, { backgroundColor: colors.muted }]}>
                    <Text style={[styles.freePillText, { color: colors.mutedForeground }]}>
                      Ücretsiz: {item.freeLabel}
                    </Text>
                  </View>
                  <View style={[styles.proPill, { backgroundColor: colors.premiumBackground }]}>
                    <Feather name="check" size={10} color={colors.premium} />
                    <Text style={[styles.proPillText, { color: colors.premium }]}>Pro: {item.proLabel}</Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Mandatory App Store & Google Play Legal / Restore Footer */}
        <View style={[styles.legalBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.legalTitle, { color: colors.foreground }]}>
            Abonelik ve Mağaza Koşulları
          </Text>
          <Text style={[styles.legalCopy, { color: colors.mutedForeground }]}>
            Ödeme, satın alma onayında veya ücretsiz deneme süresi sonunda App Store / Google Play hesabınızdan tahsil edilir. Abonelikler, mevcut dönemin bitiminden en az 24 saat önce iptal edilmediği sürece seçilen paket tutarı üzerinden otomatik olarak yenilenir. Aboneliğinizi cihazınızın Hesap Ayarları → Abonelikler bölümünden dilediğiniz zaman yönetebilir veya iptal edebilirsiniz.
          </Text>
          <View style={styles.legalLinksRow}>
            <Pressable onPress={() => void handleRestore()}>
              <Text style={[styles.legalLink, { color: colors.primary }]}>Satın Alımları Geri Yükle</Text>
            </Pressable>
            <Text style={{ color: colors.mutedForeground }}>·</Text>
            <Pressable onPress={() => setLegalModal('terms')}>
              <Text style={[styles.legalLink, { color: colors.primary }]}>Kullanım Koşulları (EULA)</Text>
            </Pressable>
            <Text style={{ color: colors.mutedForeground }}>·</Text>
            <Pressable onPress={() => setLegalModal('privacy')}>
              <Text style={[styles.legalLink, { color: colors.primary }]}>Gizlilik Politikası</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Terms & Privacy Modal */}
      <Modal
        visible={legalModal !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setLegalModal(null)}
      >
        <View style={[styles.modalBackdrop, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                {legalModal === 'terms' ? 'Kullanım Koşulları (EULA)' : 'Gizlilik Politikası'}
              </Text>
              <Pressable onPress={() => setLegalModal(null)} hitSlop={10}>
                <Feather name="x" size={20} color={colors.mutedForeground} />
              </Pressable>
            </View>
            <ScrollView style={{ maxHeight: 340 }} showsVerticalScrollIndicator={false}>
              <Text style={[styles.modalBody, { color: colors.foreground }]}>
                {legalModal === 'terms'
                  ? '1. Hizmet Kapsamı: GeoKPSS Pro, KPSS Coğrafya sınavına hazırlık amacıyla interaktif harita katmanları, 3B fiziki kabartma haritası, süreli deneme sınavları ve hafıza kodlamaları sunar.\n\n2. Abonelik ve Yenileme: Yıllık ve aylık abonelikler dönem sonunda otomatik yenilenir. Ücretsiz deneme süresi içinde iptal edilen aboneliklerden ücret tahsil edilmez.\n\n3. İptal ve İade: Abonelik iptalleri App Store veya Google Play hesap ayarları üzerinden gerçekleştirilir. Mevcut fatura dönemi sonuna kadar Pro erişimi devam eder.'
                  : '1. Veri Gizliliği: GeoKPSS çalışma verileriniz (çözülen sorular, konu durumları, kişisel kodlama notları ve aralıklı tekrar takvimi) cihazınızda yerel olarak saklanır.\n\n2. Üçüncü Taraf Paylaşımı: Kişisel çalışma verileriniz reklam ağlarına satılmaz veya üçüncü taraflarla paylaşılmaz.\n\n3. Ödeme Güvenliği: Tüm abonelik işlemleri doğrudan Apple App Store ve Google Play güvenli ödeme altyapısı üzerinden yürütülür; kredi kartı bilgileriniz uygulama tarafından tutulmaz.'}
              </Text>
            </ScrollView>
            <Pressable
              onPress={() => setLegalModal(null)}
              style={[styles.modalCloseBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.modalCloseText, { color: colors.primaryForeground }]}>Anladım</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 18, paddingTop: 10, gap: 15 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { width: 40, height: 40, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  restoreChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  restoreChipText: { fontSize: 12, fontWeight: '700' },
  heroCard: { borderRadius: 24, borderWidth: 1, padding: 18, gap: 10 },
  heroBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  heroIcon: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  seasonPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  seasonPillText: { fontSize: 9.5, fontWeight: '700', letterSpacing: 0.6 },
  title: { fontSize: 23, lineHeight: 29, fontWeight: '700', letterSpacing: -0.4 },
  intro: { fontSize: 13, lineHeight: 19 },
  quotaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 2,
  },
  quotaText: { flex: 1, fontSize: 12 },
  activeSubBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 15,
    marginTop: 2,
  },
  activeSubTitle: { fontSize: 13, fontWeight: '700' },
  activeSubMeta: { fontSize: 11 },
  sandboxResetBtn: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7 },
  sandboxResetText: { fontSize: 10.5, fontWeight: '700' },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 13,
    borderRadius: 16,
    borderWidth: 1,
  },
  feedbackText: { flex: 1, fontSize: 12, lineHeight: 17, fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 4 },
  plansCol: { gap: 11 },
  planCard: { borderRadius: 20, padding: 14, gap: 10, position: 'relative' },
  planBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  planBadgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.6 },
  planMainRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planTitle: { fontSize: 15, fontWeight: '700' },
  planSubtitle: { fontSize: 11, marginTop: 2, lineHeight: 15 },
  priceCol: { alignItems: 'flex-end' },
  priceValue: { fontSize: 18, fontWeight: '700' },
  pricePeriod: { fontSize: 10.5, fontWeight: '600' },
  planFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderTopWidth: 1,
    paddingTop: 8,
  },
  planEquivText: { fontSize: 11, fontWeight: '700' },
  ctaButton: {
    minHeight: 58,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 11,
  },
  ctaTitle: { fontSize: 15, fontWeight: '700' },
  ctaSub: { fontSize: 10.5, opacity: 0.88, marginTop: 2 },
  featuresList: { gap: 10 },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    padding: 13,
    borderRadius: 18,
    borderWidth: 1,
  },
  featureIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  featureTitle: { fontSize: 13.5, fontWeight: '700' },
  featureDetail: { fontSize: 11.5, lineHeight: 16 },
  comparisonPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  freePill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3.5 },
  freePillText: { fontSize: 10, fontWeight: '600' },
  proPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
  },
  proPillText: { fontSize: 10, fontWeight: '700' },
  legalBox: { borderRadius: 18, borderWidth: 1, padding: 14, gap: 8, marginTop: 4 },
  legalTitle: { fontSize: 12, fontWeight: '700' },
  legalCopy: { fontSize: 10.5, lineHeight: 15.5 },
  legalLinksRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 4 },
  legalLink: { fontSize: 11, fontWeight: '700' },
  modalBackdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 420, borderRadius: 22, borderWidth: 1, padding: 18, gap: 14 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { fontSize: 17, fontWeight: '700' },
  modalBody: { fontSize: 12.5, lineHeight: 19 },
  modalCloseBtn: { height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  modalCloseText: { fontSize: 13, fontWeight: '700' },
});
