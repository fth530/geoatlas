import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { LAYERS, MAP_COLORS, MAP_ITEMS } from '../data/geography';
import { ELEVATION_BAND_BY_ID, PROVINCE_ELEVATIONS, TOPOGRAPHIC_RELIEF_RIDGES } from '../data/province-elevation';
import { PROVINCE_NOTES } from '../data/province-notes';
import {
  DEFAULT_SUBSCRIPTION_STATE,
  FREE_DAILY_QUIZ_LIMIT,
  isProLockedLayer,
  sanitizeSubscriptionState,
  SUBSCRIPTION_PLANS,
} from '../services/subscription-service';
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
  assert.equal(Object.keys(PROVINCE_ELEVATIONS).length, 81, 'All 81 provinces have physical relief elevation data');
  for (const [prov, info] of Object.entries(PROVINCE_ELEVATIONS)) {
    assert.ok(ELEVATION_BAND_BY_ID[info.band], `${prov} has a valid elevation band`);
    assert.ok(info.avgMeters > 0, `${prov} has a positive average elevation`);
    assert.ok(info.reliefNote.length >= 20, `${prov} has a detailed relief note`);
  }
  assert.ok(TOPOGRAPHIC_RELIEF_RIDGES.length >= 6, 'Topographic relief ridges are defined');
});

test('subscription plans and entitlement sanitizer validate Pro state accurately', () => {
  assert.equal(SUBSCRIPTION_PLANS.length, 3);
  assert.equal(FREE_DAILY_QUIZ_LIMIT, 15);
  assert.equal(isProLockedLayer('ramsar'), true);
  assert.equal(isProLockedLayer('ancient'), true);
  assert.equal(isProLockedLayer('mountains'), false);

  const validYearly = sanitizeSubscriptionState({
    isPro: true,
    activePlanId: 'yearly',
    purchasedAt: Date.now(),
    expiresAt: Date.now() + 86400000,
  });
  assert.equal(validYearly.isPro, true);
  assert.equal(validYearly.activePlanId, 'yearly');

  const expiredYearly = sanitizeSubscriptionState({
    isPro: true,
    activePlanId: 'yearly',
    purchasedAt: Date.now() - 86400000 * 2,
    expiresAt: Date.now() - 1000,
  });
  assert.deepEqual(expiredYearly, DEFAULT_SUBSCRIPTION_STATE);
});

test('canonical ASO metadata passes all asc-aso-audit checks (0 waste, >=90% keyword usage, valid separators)', () => {
  const baseDir = path.resolve(__dirname, '..', 'metadata');
  const locales = ['tr', 'en-US'] as const;
  const keywordsByLocale: Record<string, string> = {};

  for (const locale of locales) {
    const appInfo = JSON.parse(fs.readFileSync(path.join(baseDir, 'app-info', `${locale}.json`), 'utf8')) as {
      name: string;
      subtitle: string;
    };
    const versionInfo = JSON.parse(fs.readFileSync(path.join(baseDir, 'version', '1.0.0', `${locale}.json`), 'utf8')) as {
      keywords: string;
      promotionalText: string;
      description: string;
      whatsNew: string;
    };

    // 1. Character limits & utilization guidelines (Name <= 30, Subtitle 20-30, Keywords 90-100)
    assert.ok(appInfo.name.length > 0 && appInfo.name.length <= 30, `${locale} name length ${appInfo.name.length} must be <= 30`);
    assert.ok(appInfo.subtitle.length >= 20 && appInfo.subtitle.length <= 30, `${locale} subtitle length ${appInfo.subtitle.length} must be 20..30`);
    assert.ok(versionInfo.keywords.length >= 90 && versionInfo.keywords.length <= 100, `${locale} keywords length ${versionInfo.keywords.length} must be 90..100`);
    assert.ok(versionInfo.promotionalText.length <= 170, `${locale} promotionalText length must be <= 170`);
    assert.ok(versionInfo.description.length >= 400 && versionInfo.description.length <= 4000, `${locale} description length valid`);
    assert.ok(versionInfo.whatsNew.length > 0 && versionInfo.whatsNew.length <= 4000, `${locale} whatsNew length valid`);

    // 2. Bad keyword separators check (no space after comma, no semicolons or pipes)
    assert.equal(versionInfo.keywords.includes(', '), false, `${locale} keywords must not have spaces after commas`);
    assert.equal(versionInfo.keywords.includes(';'), false, `${locale} keywords must not contain semicolons`);
    assert.equal(versionInfo.keywords.includes('|'), false, `${locale} keywords must not contain pipes`);

    // 3. Zero keyword waste check (no token in keywords duplicates any token in name or subtitle)
    const titleSubtitleTokens = new Set(
      `${appInfo.name} ${appInfo.subtitle}`
        .toLocaleLowerCase('tr')
        .replace(/[:.,&()-]/g, ' ')
        .split(/\s+/)
        .filter(Boolean),
    );
    const keywordTokens = versionInfo.keywords
      .toLocaleLowerCase('tr')
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);

    const duplicates = keywordTokens.filter((k) => titleSubtitleTokens.has(k));
    assert.deepEqual(duplicates, [], `${locale} has duplicate keyword waste: ${duplicates.join(', ')}`);

    // 4. Apple Guideline 3.1.2 description compliance (Terms of Use & Privacy Policy URLs present)
    assert.ok(versionInfo.description.includes('Terms of Use'), `${locale} description includes Terms of Use link`);
    assert.ok(versionInfo.description.includes('Privacy Policy'), `${locale} description includes Privacy Policy link`);

    keywordsByLocale[locale] = versionInfo.keywords.toLowerCase();
  }

  // 5. Cross-locale keyword differentiation check
  assert.notEqual(keywordsByLocale.tr, keywordsByLocale['en-US'], 'tr and en-US keywords must be distinct');
});
