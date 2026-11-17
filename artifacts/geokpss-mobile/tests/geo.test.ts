import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { project, VIEW_HEIGHT, VIEW_WIDTH } from '../utils/geo';

const require = createRequire(import.meta.url);
const geo = require('../data/turkiye_iller.json') as {
  features: { geometry: { coordinates: unknown } }[];
};

type Ring = number[][];

function isCoordPair(value: unknown): value is [number, number] {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    typeof value[0] === 'number' &&
    typeof value[1] === 'number'
  );
}

function collectRings(node: unknown, rings: Ring[]): void {
  if (!Array.isArray(node) || node.length === 0) return;
  if (node.every(isCoordPair)) {
    rings.push(node as Ring);
    return;
  }
  for (const child of node) collectRings(child, rings);
}

test('every province coordinate projects inside the view box', () => {
  const rings: Ring[] = [];
  for (const feature of geo.features) {
    collectRings(feature.geometry.coordinates, rings);
  }
  assert.ok(rings.length > 0, 'expected GeoJSON rings');

  let checked = 0;
  for (const ring of rings) {
    for (const [lon, lat] of ring) {
      const point = project(lon, lat);
      // The viewBox intentionally crops a few units past the data bounds.
      assert.ok(point.x >= -3 && point.x <= VIEW_WIDTH + 3, `x out of range: ${point.x}`);
      assert.ok(point.y >= -3 && point.y <= VIEW_HEIGHT + 3, `y out of range: ${point.y}`);
      checked += 1;
    }
  }
  assert.ok(checked > 1000, `expected many coordinates, got ${checked}`);
});

test('project is monotonic: east increases x, north decreases y', () => {
  const west = project(26, 39);
  const east = project(44, 39);
  const south = project(35, 36);
  const north = project(35, 42);
  assert.ok(east.x > west.x);
  assert.ok(north.y < south.y);
});
