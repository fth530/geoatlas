import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MAP_ITEMS } from '../data/geography';
import { itemMcqs, PROVINCE_MCQ } from '../data/questions';

test('every map item has at least one question', () => {
  const missing = MAP_ITEMS.filter((item) => itemMcqs(item).length === 0).map((item) => item.id);
  assert.deepEqual(missing, []);
});

test('all item questions have 4 unique options and a valid answer index', () => {
  for (const item of MAP_ITEMS) {
    for (const mcq of itemMcqs(item)) {
      assert.equal(mcq.options.length, 4, `${item.id}: expected 4 options`);
      assert.equal(new Set(mcq.options).size, mcq.options.length, `${item.id}: duplicate option in "${mcq.q}"`);
      assert.ok(mcq.answer >= 0 && mcq.answer < 4, `${item.id}: answer index out of range`);
      assert.ok(mcq.options[mcq.answer].trim().length > 0, `${item.id}: empty answer option`);
    }
  }
});

test('province MCQs have unique options and correct answers', () => {
  assert.equal(PROVINCE_MCQ.length, 162);
  for (const row of PROVINCE_MCQ) {
    const { mcq } = row;
    assert.equal(mcq.options.length, 4, `${row.name}: expected 4 options`);
    assert.equal(new Set(mcq.options).size, mcq.options.length, `${row.name}: duplicate option in "${mcq.q}"`);
    if (mcq.q.includes('bölgededir')) {
      assert.equal(mcq.options[mcq.answer], row.region, `${row.name}: wrong region answer`);
    } else {
      assert.equal(mcq.options[mcq.answer], String(row.plate).padStart(2, '0'), `${row.name}: wrong plate answer`);
    }
  }
});
