import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildReviewItem,
  nextReviewSchedule,
  REVIEW_INTERVALS,
  sanitizePersistedStudy,
} from '../utils/study';
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
