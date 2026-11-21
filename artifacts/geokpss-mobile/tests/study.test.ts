import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildReviewItem,
  LAYER_IDS,
  nextReviewSchedule,
  REVIEW_INTERVALS,
  sanitizePersistedStudy,
} from '../utils/study';
import { LAYERS } from '../data/geography';
import type { QuizAnswerRecord, StudyReviewItem } from '../context/StudyContext';

const NOW = 1_700_000_000_000;
const DAY = 24 * 60 * 60 * 1000;

function answer(overrides: Partial<QuizAnswerRecord> = {}): QuizAnswerRecord {
  return {
    layer: 'mountains',
    targetId: 'agri',
    targetName: 'Büyük Ağrı Dağı',
    isCorrect: true,
    ...overrides,
  };
}

test('first correct answer is due in 1 day', () => {
  const schedule = nextReviewSchedule(undefined, true, NOW);
  assert.equal(schedule.intervalDays, 1);
  assert.equal(schedule.successStreak, 1);
  assert.equal(schedule.dueAt, NOW + DAY);
});

test('correct streak climbs the interval ladder', () => {
  let streak = 0;
  const expected = [1, 3, 7, 14, 30, 30];
  for (const days of expected) {
    const schedule = nextReviewSchedule({ successStreak: streak }, true, NOW);
    assert.equal(schedule.intervalDays, days);
    streak = schedule.successStreak;
  }
});

test('wrong answer resets interval to 1 day and streak to 0', () => {
  const schedule = nextReviewSchedule({ successStreak: 4 }, false, NOW);
  assert.equal(schedule.intervalDays, 1);
  assert.equal(schedule.successStreak, 0);
  assert.equal(schedule.dueAt, NOW + DAY);
});

test('buildReviewItem accumulates attempts and keeps identity', () => {
  const existing: StudyReviewItem = {
    id: 'mountains:agri',
    layer: 'mountains',
    targetId: 'agri',
    targetName: 'Büyük Ağrı Dağı',
    dueAt: NOW,
    intervalDays: 3,
    successStreak: 2,
    attempts: 5,
    lastCorrect: true,
  };
  const item = buildReviewItem(answer(), existing, NOW);
  assert.equal(item.id, 'mountains:agri');
  assert.equal(item.attempts, 6);
  assert.equal(item.intervalDays, REVIEW_INTERVALS[2]);
  assert.equal(item.successStreak, 3);
  assert.equal(item.lastCorrect, true);
});

test('sanitizePersistedStudy drops malformed entries', () => {
  const clean = sanitizePersistedStudy({
    version: 2,
    notes: [
      { id: 'n1', title: 'T', body: 'B', category: 'Genel', updatedAt: 1 },
      { id: '' },
      'garbage',
      null,
    ],
    topicStatuses: { mountains: 'done', lakes: 'bogus', rivers: 'weak' },
    reviewItems: [
      {
        id: 'lakes:van',
        layer: 'lakes',
        targetId: 'van',
        targetName: 'Van Gölü',
        dueAt: 123,
        intervalDays: 3,
        successStreak: 1,
        attempts: 2,
        lastCorrect: false,
      },
      { id: 'bad:no-layer', layer: 'not-a-layer', targetId: 'x' },
    ],
    answered: 10,
    correct: 7,
    proCandidates: ['quiz', 42],
  });

  assert.equal(clean.notes.length, 1);
  assert.equal(clean.notes[0].id, 'n1');
  assert.deepEqual(clean.topicStatuses, { mountains: 'done', rivers: 'weak' });
  assert.equal(clean.reviewItems.length, 1);
  assert.equal(clean.reviewItems[0].layer, 'lakes');
  assert.equal(clean.answered, 10);
  assert.equal(clean.correct, 7);
  assert.deepEqual(clean.proCandidates, ['quiz']);
});

test('sanitizePersistedStudy survives corrupt payloads', () => {
  for (const bad of [null, undefined, 'string', 42, [], { notes: 'nope' }]) {
    const clean = sanitizePersistedStudy(bad);
    assert.deepEqual(clean.notes, []);
    assert.deepEqual(clean.reviewItems, []);
    assert.deepEqual(clean.topicStatuses, {});
    assert.deepEqual(clean.proCandidates, []);
    assert.equal(clean.answered, 0);
  }
});

test('all geography layers are preserved by sanitizePersistedStudy (including transport and human/economic layers)', () => {
  for (const layer of LAYERS) {
    assert.ok(LAYER_IDS.includes(layer.id), `LAYER_IDS missing ${layer.id}`);
    const clean = sanitizePersistedStudy({
      reviewItems: [
        {
          id: `${layer.id}:test-item`,
          layer: layer.id,
          targetId: 'test-item',
          targetName: 'Test Öğesi',
          dueAt: NOW,
          intervalDays: 1,
          successStreak: 1,
          attempts: 1,
          lastCorrect: true,
        },
      ],
    });
    assert.equal(clean.reviewItems.length, 1, `reviewItem for layer ${layer.id} was dropped`);
    assert.equal(clean.reviewItems[0].layer, layer.id);
  }
});

test('xpLevel thresholds and progress', async () => {
  const { xpLevel, XP_LEVELS } = await import('../utils/study');
  assert.equal(xpLevel(0).level, 0);
  assert.equal(xpLevel(0).title, XP_LEVELS[0].title);
  assert.equal(xpLevel(149).level, 0);
  assert.equal(xpLevel(150).level, 1);
  assert.equal(xpLevel(99999).level, XP_LEVELS.length - 1);
  const mid = xpLevel(275);
  assert.equal(mid.intoLevel, 125);
  assert.equal(mid.span, XP_LEVELS[2].xp - XP_LEVELS[1].xp);
});

test('sanitizePersistedStudy defaults and clamps new retention fields', () => {
  const empty = sanitizePersistedStudy({});
  assert.deepEqual(empty.discovered, []);
  assert.equal(empty.xp, 0);
  assert.deepEqual(empty.challengeBest, {});

  const clean = sanitizePersistedStudy({
    discovered: ['provinces:Adana', 42, 'lakes:van'],
    xp: -50,
    challengeBest: { '2025-01-01': 8, bad: 'x', '2025-01-02': 99 },
    program: { '2025-01-01': { done: ['a'], custom: [], bonus: true } },
  });
  assert.deepEqual(clean.discovered, ['provinces:Adana', 'lakes:van']);
  assert.equal(clean.xp, 0);
  assert.deepEqual(clean.challengeBest, { '2025-01-01': 8, '2025-01-02': 10 });
  assert.equal(clean.program['2025-01-01'].bonus, true);
});
