import assert from 'node:assert/strict';
import { test } from 'node:test';
import { LAYERS, MAP_COLORS, MAP_ITEMS } from '../data/geography';
import { PROVINCE_NOTES } from '../data/province-notes';
import { KPSS_MNEMONICS } from '../data/mnemonics';
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

test('MCQ answer indices are evenly balanced across options A, B, C, D', () => {
  const counts = [0, 0, 0, 0];
  let total = 0;
  for (const item of MAP_ITEMS) {
    for (const mcq of itemMcqs(item)) {
      counts[mcq.answer] += 1;
      total += 1;
    }
  }
  for (let idx = 0; idx < 4; idx += 1) {
    const ratio = counts[idx] / total;
    assert.ok(
      ratio >= 0.15 && ratio <= 0.35,
      `Option index ${idx} ratio ${ratio.toFixed(3)} out of balanced range [0.15, 0.35]`,
    );
  }
});

test('every MapItem subtype has a defined color in MAP_COLORS and matches its layer filters', () => {
  for (const item of MAP_ITEMS) {
    assert.ok(
      Boolean(MAP_COLORS[item.subtype]),
      `Item "${item.id}" has subtype "${item.subtype}" missing from MAP_COLORS`,
    );
    const layer = LAYERS.find((l) => l.id === item.layer);
    assert.ok(layer, `Item "${item.id}" references unknown layer "${item.layer}"`);
  }
});

test('all 81 provinces have KPSS identity notes and mnemonics are valid', () => {
  assert.equal(Object.keys(PROVINCE_NOTES).length, 81, 'Expected 81 province notes');
  assert.ok(KPSS_MNEMONICS.length >= 12, 'Expected at least 12 KPSS mnemonics');
  for (const m of KPSS_MNEMONICS) {
    if (m.relatedItemId) {
      assert.ok(
        MAP_ITEMS.some((item) => item.id === m.relatedItemId),
        `Mnemonic ${m.id} references unknown item ${m.relatedItemId}`,
      );
    }
  }
});

test('critical KPSS geography scientific facts are accurate', () => {
  const byId = new Map(MAP_ITEMS.map((item) => [item.id, item]));
  assert.equal(byId.get('palandoken')?.subtype, 'fold');
  assert.equal(byId.get('amik')?.subtype, 'tectonic');
  assert.equal(byId.get('silifke')?.subtype, 'delta');
  assert.equal(byId.get('coruh')?.subtype, 'outside');
  assert.equal(byId.get('abant')?.subtypeLabel, 'Heyelan seti');
  assert.equal(byId.get('mogan')?.subtypeLabel, 'Alüvyal set');
  assert.equal(byId.get('koycegiz')?.subtypeLabel, 'Alüvyal set');
  assert.deepEqual(byId.get('eber')?.provinces, ['Afyonkarahisar']);
  assert.deepEqual(byId.get('tunca')?.provinces, ['Edirne', 'Kırklareli']);
  assert.deepEqual(byId.get('narligol')?.provinces, ['Niğde', 'Aksaray']);
  assert.deepEqual(byId.get('altinkaya')?.provinces, ['Samsun']);
  assert.ok(byId.get('ladin-agaci')?.provinces.includes('Artvin'));
  assert.ok(byId.get('kil-kecisi')?.provinces.includes('Mersin'));
  assert.ok(byId.get('tiftik-kecisi')?.provinces.includes('Ankara'));
  assert.ok(byId.get('manda-yetistiriciligi')?.provinces.includes('Samsun'));
  assert.ok(byId.get('kaf')?.tags?.includes('kaf'));
  assert.ok(byId.get('daf')?.tags?.includes('daf'));
  assert.ok(byId.get('baf')?.tags?.includes('baf'));
});

test('every filter in every layer matches at least one MapItem', () => {
  for (const layer of LAYERS) {
    if (layer.id === 'provinces') continue;
    for (const filter of layer.filters) {
      const matched = MAP_ITEMS.filter((item) => {
        if (item.layer !== layer.id) return false;
        if (filter.id === 'all') return true;
        if (filter.id === 'volcanic' && item.subtype === 'volcanicLake') return true;
        return item.subtype === filter.id || item.tags?.includes(filter.id) === true;
      });
      assert.ok(
        matched.length > 0,
        `Layer "${layer.id}" filter "${filter.id}" (${filter.label}) matched 0 items`,
      );
    }
  }
  const ramsarItems = MAP_ITEMS.filter((item) => item.layer === 'ramsar');
  assert.equal(ramsarItems.length, 14, 'Turkey has exactly 14 official Ramsar sites');
  const ancientItems = MAP_ITEMS.filter((item) => item.layer === 'ancient');
  assert.equal(ancientItems.length, 24, 'Ancient cities layer has 24 curated KPSS ancient city items');
});
