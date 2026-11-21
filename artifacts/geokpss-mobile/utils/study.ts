import type { LayerId, TopicStatus } from '@/data/geography';
import type { QuizAnswerRecord, StudyNote, StudyReviewItem } from '@/context/StudyContext';

export const DAY_MS = 24 * 60 * 60 * 1000;
export const REVIEW_INTERVALS = [1, 3, 7, 14, 30];
export const STUDY_STORE_VERSION = 2;

export type ReviewSchedule = {
  intervalDays: number;
  successStreak: number;
  dueAt: number;
};

/**
 * Pure spaced-repetition step. A correct answer climbs the interval ladder
 * (1 → 3 → 7 → 14 → 30 days); a wrong answer resets to one day.
 */
export function nextReviewSchedule(
  existing: Pick<StudyReviewItem, 'successStreak'> | undefined,
  isCorrect: boolean,
  now: number = Date.now(),
): ReviewSchedule {
  const successStreak = isCorrect ? (existing?.successStreak ?? 0) + 1 : 0;
  const intervalDays = isCorrect
    ? REVIEW_INTERVALS[Math.min(existing?.successStreak ?? 0, REVIEW_INTERVALS.length - 1)]
    : 1;
  return { intervalDays, successStreak, dueAt: now + intervalDays * DAY_MS };
}

export function reviewItemId(answer: Pick<QuizAnswerRecord, 'layer' | 'targetId'>): string {
  return `${answer.layer}:${answer.targetId}`;
}

export function buildReviewItem(
  answer: QuizAnswerRecord,
  existing: StudyReviewItem | undefined,
  now: number = Date.now(),
): StudyReviewItem {
  const schedule = nextReviewSchedule(existing, answer.isCorrect, now);
  return {
    id: reviewItemId(answer),
    layer: answer.layer,
    targetId: answer.targetId,
    targetName: answer.targetName,
    dueAt: schedule.dueAt,
    intervalDays: schedule.intervalDays,
    successStreak: schedule.successStreak,
    attempts: (existing?.attempts ?? 0) + 1,
    lastCorrect: answer.isCorrect,
  };
}

const TOPIC_STATUSES: TopicStatus[] = ['new', 'studying', 'review', 'weak', 'done'];
export const LAYER_IDS: LayerId[] = [
  'provinces',
  'mountains',
  'lakes',
  'plains',
  'rivers',
  'coasts',
  'geology',
  'soil',
  'minerals',
  'projects',
  'ramsar',
  'ancient',
  'transport',
  'climate',
  'population',
  'agriculture',
  'industry',
];
const MAX_IMPORTED_NOTES = 500;
const MAX_NOTE_TITLE_LENGTH = 120;
const MAX_NOTE_BODY_LENGTH = 2000;

export type DailyActivity = { answered: number; correct: number };

export type PersistedStudyData = {
  notes: StudyNote[];
  topicStatuses: Record<string, TopicStatus>;
  reviewItems: StudyReviewItem[];
  answered: number;
  correct: number;
  proCandidates: string[];
  dailyActivity: Record<string, DailyActivity>;
  dailyGoal: number;
};

const DAY_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_DAILY_ACTIVITY_DAYS = 120;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function sanitizeNote(value: unknown): StudyNote | null {
  if (!isRecord(value)) return null;
  const id = asString(value.id).slice(0, 80);
  if (!id) return null;
  return {
    id,
    title: asString(value.title).slice(0, MAX_NOTE_TITLE_LENGTH),
    body: asString(value.body).slice(0, MAX_NOTE_BODY_LENGTH),
    category: asString(value.category, 'Genel').slice(0, 80),
    updatedAt: asNumber(value.updatedAt),
    ...(typeof value.relatedItemId === 'string' ? { relatedItemId: value.relatedItemId.slice(0, 80) } : {}),
    ...(typeof value.relatedItemName === 'string' ? { relatedItemName: value.relatedItemName.slice(0, 120) } : {}),
  };
}

function sanitizeReviewItem(value: unknown): StudyReviewItem | null {
  if (!isRecord(value)) return null;
  const id = asString(value.id);
  const layer = asString(value.layer) as LayerId;
  const targetId = asString(value.targetId);
  if (!id || !LAYER_IDS.includes(layer) || !targetId) return null;
  return {
    id,
    layer,
    targetId,
    targetName: asString(value.targetName, targetId),
    dueAt: asNumber(value.dueAt),
    intervalDays: asNumber(value.intervalDays, 1),
    successStreak: asNumber(value.successStreak),
    attempts: asNumber(value.attempts),
    lastCorrect: value.lastCorrect === true,
  };
}

/**
 * Validates a parsed AsyncStorage payload. Unknown/malformed entries are
 * dropped instead of crashing the app, and unknown fields are ignored so the
 * store can be evolved without a hard migration.
 */
export function sanitizePersistedStudy(value: unknown): PersistedStudyData {
  const raw = isRecord(value) ? value : {};
  const topicStatuses: Record<string, TopicStatus> = {};
  if (isRecord(raw.topicStatuses)) {
    for (const [key, status] of Object.entries(raw.topicStatuses)) {
      if (TOPIC_STATUSES.includes(status as TopicStatus)) {
        topicStatuses[key] = status as TopicStatus;
      }
    }
  }
  return {
    notes: Array.isArray(raw.notes)
      ? raw.notes.slice(0, MAX_IMPORTED_NOTES).map(sanitizeNote).filter((note): note is StudyNote => note !== null)
      : [],
    topicStatuses,
    reviewItems: Array.isArray(raw.reviewItems)
      ? raw.reviewItems.map(sanitizeReviewItem).filter((item): item is StudyReviewItem => item !== null)
      : [],
    answered: asNumber(raw.answered),
    correct: asNumber(raw.correct),
    proCandidates: Array.isArray(raw.proCandidates)
      ? raw.proCandidates.filter((id): id is string => typeof id === 'string')
      : [],
    dailyActivity: isRecord(raw.dailyActivity)
      ? Object.fromEntries(
          Object.entries(raw.dailyActivity)
            .filter(([key]) => DAY_KEY_PATTERN.test(key))
            .slice(-MAX_DAILY_ACTIVITY_DAYS)
            .map(([key, value]) => [
              key,
              isRecord(value)
                ? { answered: asNumber(value.answered), correct: asNumber(value.correct) }
                : { answered: 0, correct: 0 },
            ]),
        )
      : {},
    dailyGoal: Math.min(200, Math.max(1, asNumber(raw.dailyGoal, 10))),
  };
}

export function localDayKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
