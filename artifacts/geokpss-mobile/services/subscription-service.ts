import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LayerId } from '@/data/geography';

function detectPlatformOS(): 'ios' | 'android' | 'web' | 'node' {
  if (typeof window !== 'undefined' && typeof document !== 'undefined') return 'web';
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const rn = require('react-native') as { Platform?: { OS?: string } };
    if (rn?.Platform?.OS === 'ios') return 'ios';
    if (rn?.Platform?.OS === 'android') return 'android';
  } catch {
    // Running inside Node unit test environment
  }
  return 'node';
}

export type SubscriptionPlanId = 'yearly' | 'monthly' | 'lifetime';

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  title: string;
  subtitle: string;
  priceLabel: string;
  periodLabel: string;
  monthlyEquivalent: string;
  badge?: string;
  trialDays: number;
  productId: string;
  rcPackageIdentifier: string;
  savingsPercent?: number;
}

export interface SubscriptionState {
  isPro: boolean;
  activePlanId: SubscriptionPlanId | null;
  purchasedAt: number | null;
  expiresAt: number | null;
  provider: 'revenuecat' | 'sandbox';
}

export interface SubscriptionActionResult {
  ok: boolean;
  state: SubscriptionState;
  message: string;
}

/**
 * RevenueCat Entitlement & Environment Configuration
 * (Set EXPO_PUBLIC_REVENUECAT_IOS_KEY and EXPO_PUBLIC_REVENUECAT_ANDROID_KEY in .env)
 */
export const RC_ENTITLEMENT_ID: string =
  process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID?.trim() || 'pro';

const RC_IOS_API_KEY: string =
  process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY?.trim() || '';
const RC_ANDROID_API_KEY: string =
  process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY?.trim() || '';

export function getRevenueCatApiKey(): string {
  const os = detectPlatformOS();
  if (os === 'ios') return RC_IOS_API_KEY;
  if (os === 'android') return RC_ANDROID_API_KEY;
  return '';
}

export function isRevenueCatConfigured(): boolean {
  const key = getRevenueCatApiKey();
  return (
    key.length > 10 &&
    !key.includes('your_revenuecat') &&
    (key.startsWith('appl_') || key.startsWith('goog_'))
  );
}

// Minimal TypeScript contract for react-native-purchases (loaded dynamically in native builds)
interface RcEntitlementInfo {
  isActive: boolean;
  productIdentifier: string;
  latestPurchaseDateMillis?: number | null;
  expirationDateMillis?: number | null;
}

interface RcCustomerInfo {
  entitlements: {
    active: Record<string, RcEntitlementInfo | undefined>;
  };
}

interface RcPackage {
  identifier: string;
  product: {
    identifier: string;
    priceString: string;
  };
}

interface RcOfferings {
  current?: {
    availablePackages: RcPackage[];
  } | null;
}

interface RcPurchasesModule {
  configure: (config: { apiKey: string }) => void;
  getCustomerInfo: () => Promise<RcCustomerInfo>;
  getOfferings: () => Promise<RcOfferings>;
  purchasePackage: (pkg: RcPackage) => Promise<{ customerInfo: RcCustomerInfo }>;
  restorePurchases: () => Promise<RcCustomerInfo>;
}

let rcInitialized = false;
let cachedRcModule: RcPurchasesModule | null | undefined;

function getNativePurchasesModule(): RcPurchasesModule | null {
  const os = detectPlatformOS();
  if (os === 'web' || os === 'node') return null;
  if (cachedRcModule !== undefined) return cachedRcModule;
  try {
    // Dynamic require so Expo Go / Web / Node test runner work without crashing when native binary isn't linked
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('react-native-purchases') as { default?: RcPurchasesModule } & RcPurchasesModule;
    cachedRcModule = mod?.default ?? mod ?? null;
    return cachedRcModule;
  } catch {
    cachedRcModule = null;
    return null;
  }
}

export async function initRevenueCatIfAvailable(): Promise<boolean> {
  if (!isRevenueCatConfigured()) return false;
  const Purchases = getNativePurchasesModule();
  if (!Purchases) return false;
  if (!rcInitialized) {
    try {
      Purchases.configure({ apiKey: getRevenueCatApiKey() });
      rcInitialized = true;
    } catch {
      return false;
    }
  }
  return rcInitialized;
}

function mapProductIdToPlanId(productId: string): SubscriptionPlanId {
  if (productId.includes('lifetime')) return 'lifetime';
  if (productId.includes('month')) return 'monthly';
  return 'yearly';
}

function mapCustomerInfoToState(info: RcCustomerInfo): SubscriptionState {
  const activeEntitlement = info.entitlements?.active?.[RC_ENTITLEMENT_ID];
  if (!activeEntitlement) {
    return DEFAULT_SUBSCRIPTION_STATE;
  }
  return {
    isPro: true,
    activePlanId: mapProductIdToPlanId(activeEntitlement.productIdentifier),
    purchasedAt: activeEntitlement.latestPurchaseDateMillis ?? Date.now(),
    expiresAt: activeEntitlement.expirationDateMillis ?? null,
    provider: 'revenuecat',
  };
}

export const FREE_DAILY_QUIZ_LIMIT = 15;

export const PRO_LOCKED_LAYERS: readonly LayerId[] = [
  'ramsar',
  'ancient',
  'minerals',
  'agriculture',
  'industry',
] as const;

export function isProLockedLayer(layer: LayerId): boolean {
  return PRO_LOCKED_LAYERS.includes(layer);
}

export const SUBSCRIPTION_PLANS: readonly SubscriptionPlan[] = [
  {
    id: 'yearly',
    title: 'Yıllık KPSS Sezon Planı',
    subtitle: '7 gün ücretsiz dene · Sınav gününe kadar tam erişim',
    priceLabel: '₺299,99',
    periodLabel: '/ yıl',
    monthlyEquivalent: 'Aylık sadece ₺24,99',
    badge: 'EN POPÜLER · %50 İNDİRİM',
    trialDays: 7,
    productId: 'com.geokpss.app.pro.yearly',
    rcPackageIdentifier: '$rc_annual',
    savingsPercent: 50,
  },
  {
    id: 'monthly',
    title: 'Aylık Esnek Plan',
    subtitle: '3 gün ücretsiz dene · İstediğin zaman iptal et',
    priceLabel: '₺49,99',
    periodLabel: '/ ay',
    monthlyEquivalent: 'Her ay otomatik yenilenir',
    trialDays: 3,
    productId: 'com.geokpss.app.pro.monthly',
    rcPackageIdentifier: '$rc_monthly',
  },
  {
    id: 'lifetime',
    title: 'Ömür Boyu Tam Erişim',
    subtitle: 'Tek seferlik ödeme · Abonelik yok, süresiz kullanım',
    priceLabel: '₺499,99',
    periodLabel: 'tek ödeme',
    monthlyEquivalent: 'Tüm gelecek güncellemeler dahil',
    badge: 'SÜRESİZ',
    trialDays: 0,
    productId: 'com.geokpss.app.pro.lifetime',
    rcPackageIdentifier: '$rc_lifetime',
  },
] as const;

export const PRO_FEATURES_COMPARISON: readonly {
  id: string;
  title: string;
  detail: string;
  freeLabel: string;
  proLabel: string;
  icon: string;
}[] = [
  {
    id: 'layers',
    title: '17 Harita Katmanı & 3B Kabartma',
    detail: 'Ramsar (14), Antik Kentler (24), Madenler, Tarım & Hayvancılık ve Sanayi katmanları',
    freeLabel: '12 Temel Katman',
    proLabel: '17 Katmanın Tamamı',
    icon: 'map',
  },
  {
    id: 'exam',
    title: '18 Soruluk Süreli KPSS Deneme Sınavı',
    detail: 'Gerçek ÖSYM dağılımında 15 dakikalık süreli coğrafya denemesi ve konu analizi',
    freeLabel: 'Kilitli',
    proLabel: 'Sınırsız Deneme',
    icon: 'award',
  },
  {
    id: 'quiz',
    title: 'Günlük Harita & Test Soru Hakkı',
    detail: 'Dilsiz harita ve çoktan seçmeli konu testlerinde günlük soru çözümü',
    freeLabel: '15 Soru / Gün',
    proLabel: 'Sınırsız Soru',
    icon: 'target',
  },
  {
    id: 'mnemonics',
    title: 'KPSS Hafıza Kodlamaları (Şifreler)',
    detail: 'Akrostiş coğrafya şifrelerinin tamamı ve tek dokunuşla deftere kopyalama',
    freeLabel: 'İlk 3 Şifre',
    proLabel: 'Tüm Kütüphane',
    icon: 'book-open',
  },
  {
    id: 'spaced-repetition',
    title: 'Akıllı Aralıklı Tekrar & Veri Yedekleme',
    detail: 'Zayıf konuları otomatik tespit eden tekrar algoritması ve JSON yedekleme',
    freeLabel: 'Temel',
    proLabel: 'Tam Erişim',
    icon: 'trending-up',
  },
] as const;

const SUBSCRIPTION_STORAGE_KEY = 'geokpss-subscription-v1';

export const DEFAULT_SUBSCRIPTION_STATE: SubscriptionState = {
  isPro: false,
  activePlanId: null,
  purchasedAt: null,
  expiresAt: null,
  provider: 'sandbox',
};

function isValidPlanId(value: unknown): value is SubscriptionPlanId {
  return value === 'yearly' || value === 'monthly' || value === 'lifetime';
}

export function sanitizeSubscriptionState(raw: unknown): SubscriptionState {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return DEFAULT_SUBSCRIPTION_STATE;
  }
  const record = raw as Record<string, unknown>;
  const activePlanId = isValidPlanId(record.activePlanId) ? record.activePlanId : null;
  const purchasedAt = typeof record.purchasedAt === 'number' && Number.isFinite(record.purchasedAt) ? record.purchasedAt : null;
  const expiresAt = typeof record.expiresAt === 'number' && Number.isFinite(record.expiresAt) ? record.expiresAt : null;
  const provider = record.provider === 'revenuecat' ? 'revenuecat' : 'sandbox';
  const notExpired = expiresAt === null || expiresAt > Date.now();
  const isPro = record.isPro === true && activePlanId !== null && notExpired;

  if (!isPro) {
    return DEFAULT_SUBSCRIPTION_STATE;
  }
  return {
    isPro: true,
    activePlanId,
    purchasedAt,
    expiresAt,
    provider,
  };
}

export async function loadSubscriptionState(): Promise<SubscriptionState> {
  // 1. Try live RevenueCat SDK if configured on native iOS/Android
  const rcReady = await initRevenueCatIfAvailable();
  if (rcReady) {
    const Purchases = getNativePurchasesModule();
    if (Purchases) {
      try {
        const info = await Purchases.getCustomerInfo();
        const rcState = mapCustomerInfoToState(info);
        await saveSubscriptionState(rcState);
        return rcState;
      } catch {
        // Fall back to cached local state if offline
      }
    }
  }

  // 2. Load cached or Sandbox state
  try {
    const saved = await AsyncStorage.getItem(SUBSCRIPTION_STORAGE_KEY);
    if (!saved) return DEFAULT_SUBSCRIPTION_STATE;
    return sanitizeSubscriptionState(JSON.parse(saved));
  } catch {
    return DEFAULT_SUBSCRIPTION_STATE;
  }
}

export async function saveSubscriptionState(state: SubscriptionState): Promise<void> {
  try {
    await AsyncStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage write failure gracefully
  }
}

export async function purchaseSubscriptionPlan(
  planId: SubscriptionPlanId,
  now: number = Date.now(),
): Promise<SubscriptionActionResult> {
  const plan = SUBSCRIPTION_PLANS.find((item) => item.id === planId);
  if (!plan) {
    return {
      ok: false,
      state: DEFAULT_SUBSCRIPTION_STATE,
      message: 'Geçersiz abonelik paketi seçildi.',
    };
  }

  // 1. Live RevenueCat Purchase Flow (when native SDK + API keys are present)
  const rcReady = await initRevenueCatIfAvailable();
  if (rcReady) {
    const Purchases = getNativePurchasesModule();
    if (Purchases) {
      try {
        const offerings = await Purchases.getOfferings();
        const packages = offerings.current?.availablePackages ?? [];
        const matchedPkg = packages.find(
          (p) =>
            p.identifier === plan.rcPackageIdentifier ||
            p.product.identifier === plan.productId,
        );
        if (!matchedPkg) {
          return {
            ok: false,
            state: await loadSubscriptionState(),
            message: `RevenueCat üzerinde "${plan.productId}" paketi henüz tanımlanmamış. Lütfen RevenueCat Dashboard → Offerings ayarlarını kontrol edin.`,
          };
        }
        const { customerInfo } = await Purchases.purchasePackage(matchedPkg);
        const rcState = mapCustomerInfoToState(customerInfo);
        await saveSubscriptionState(rcState);
        return {
          ok: rcState.isPro,
          state: rcState,
          message: rcState.isPro
            ? `${plan.title} App Store / Google Play üzerinden başarıyla aktifleştirildi!`
            : 'Satın alma tamamlandı ancak Pro yetkisi doğrulanamadı.',
        };
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : 'Satın alma işlemi iptal edildi veya tamamlanamadı.';
        return {
          ok: false,
          state: await loadSubscriptionState(),
          message: errMsg,
        };
      }
    }
  }

  // 2. Sandbox / Expo Go Development Flow (when RevenueCat API keys are not yet set)
  const DAY_MS = 24 * 60 * 60 * 1000;
  const expiresAt =
    planId === 'lifetime'
      ? null
      : planId === 'yearly'
        ? now + 365 * DAY_MS
        : now + 30 * DAY_MS;

  const nextState: SubscriptionState = {
    isPro: true,
    activePlanId: planId,
    purchasedAt: now,
    expiresAt,
    provider: 'sandbox',
  };

  await saveSubscriptionState(nextState);
  return {
    ok: true,
    state: nextState,
    message:
      plan.trialDays > 0
        ? `[Test/Sandbox] ${plan.title} (${plan.trialDays} gün ücretsiz deneme) aktifleştirildi! Tüm GeoKPSS Pro özellikleri açıldı.`
        : `[Test/Sandbox] ${plan.title} aktifleştirildi! Tüm GeoKPSS Pro özellikleri süresiz olarak açıldı.`,
  };
}

export async function restoreSubscriptionPurchases(): Promise<SubscriptionActionResult> {
  // 1. Live RevenueCat Restore Flow
  const rcReady = await initRevenueCatIfAvailable();
  if (rcReady) {
    const Purchases = getNativePurchasesModule();
    if (Purchases) {
      try {
        const customerInfo = await Purchases.restorePurchases();
        const rcState = mapCustomerInfoToState(customerInfo);
        await saveSubscriptionState(rcState);
        if (rcState.isPro) {
          return {
            ok: true,
            state: rcState,
            message: 'App Store / Google Play aboneliğiniz RevenueCat üzerinden başarıyla geri yüklendi.',
          };
        }
        return {
          ok: false,
          state: DEFAULT_SUBSCRIPTION_STATE,
          message: 'Mağaza hesabınıza tanımlı aktif bir GeoKPSS Pro aboneliği bulunamadı.',
        };
      } catch {
        // Fall through to local cache check
      }
    }
  }

  // 2. Sandbox Restore Flow
  const current = await loadSubscriptionState();
  if (current.isPro && current.activePlanId) {
    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === current.activePlanId);
    return {
      ok: true,
      state: current,
      message: `Aktif aboneliğiniz (${plan?.title ?? 'GeoKPSS Pro'}) geri yüklendi.`,
    };
  }
  return {
    ok: false,
    state: DEFAULT_SUBSCRIPTION_STATE,
    message: 'Bu hesaba tanımlı aktif bir GeoKPSS Pro aboneliği bulunamadı.',
  };
}

export async function cancelSubscriptionForTesting(): Promise<SubscriptionState> {
  await saveSubscriptionState(DEFAULT_SUBSCRIPTION_STATE);
  return DEFAULT_SUBSCRIPTION_STATE;
}
