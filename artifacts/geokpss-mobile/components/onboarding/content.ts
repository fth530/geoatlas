import { LAYERS, MAP_ITEMS } from '@/data/geography';
import { itemMcqs, PROVINCE_MCQ } from '@/data/questions';
import { PROVINCES } from '@/utils/provinceShapes';

const TOTAL_MCQS = PROVINCE_MCQ.length + MAP_ITEMS.reduce((total, item) => total + itemMcqs(item).length, 0);

/** Counts shown on the welcome plate legend — always derived from the bundled content. */
export const ONBOARDING_STATS = [
  { value: String(PROVINCES.length), label: 'İl' },
  { value: String(LAYERS.length), label: 'Katman' },
  { value: String(TOTAL_MCQS), label: 'Soru' },
] as const;

export const WELCOME_COPY = {
  headline: 'Coğrafyayı\nharitada çalış',
  body: 'Konu anlatımı, dilsiz harita quizi ve tekrar takvimi. Tüm içerik çevrimdışı çalışır.',
} as const;

export const QUIZ_DEMO = {
  layer: 'Göller',
  counter: 'Soru 7 / 10',
  question: 'Haritada işaretli göl hangisidir?',
  options: ['Van Gölü', 'Tuz Gölü', 'Beyşehir Gölü', 'Eğirdir Gölü'],
  answerIndex: 0,
  tip: 'Van Gölü volkanik set gölüdür; suyu sodalıdır ve en büyük göldür.',
} as const;

export const REVIEW_DEMO = {
  layer: 'Göller',
  repeat: '3. tekrar',
  question: "Türkiye'nin en büyük gölü hangisidir?",
  answer: 'Van Gölü',
  area: '3.713 km²',
  next: '7 gün sonra',
  intervals: [1, 3, 7, 14, 30],
  activeIndex: 2,
} as const;

export const REVIEW_QUEUE = [
  { name: 'Çukurova', layer: 'Plato & ova', due: '3 gün sonra' },
  { name: 'Kızılırmak', layer: 'Akarsular', due: '1 gün sonra' },
  { name: 'Toroslar', layer: 'Dağlar', due: '14 gün sonra' },
] as const;

export const REVIEW_QUEUE_TOTAL = 12;
