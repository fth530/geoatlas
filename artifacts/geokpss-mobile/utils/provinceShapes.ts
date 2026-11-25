import { project, VIEW_HEIGHT, VIEW_WIDTH } from './geo';
import type { Point } from './geo';

export type ProvinceShape = {
  name: string;
  plate: number;
  plateStr: string;
  region: string;
  path: string;
  center: Point;
};

type GeoGeometry = { type: 'Polygon' | 'MultiPolygon'; coordinates: unknown[] };
type GeoFeature = {
  properties: { plaka: number; il_adi: string; bolge: string };
  geometry: GeoGeometry;
};
type GeoCollection = { features: GeoFeature[] };

const GEO = require('../data/turkiye_iller.json') as GeoCollection;

/** Province index sorted by plate code — used by the map and the onboarding plate. */
export const PROVINCES = GEO.features
  .map((feature) => ({
    name: feature.properties.il_adi,
    plate: feature.properties.plaka,
    region: feature.properties.bolge,
  }))
  .sort((a, b) => a.plate - b.plate);

function getRings(geometry: GeoGeometry): number[][][][] {
  if (geometry.type === 'Polygon') return [geometry.coordinates as number[][][]];
  return geometry.coordinates as number[][][][];
}

function makeShape(feature: GeoFeature): ProvinceShape {
  const rings = getRings(feature.geometry);
  let largestRing: number[][] = [];
  let largestArea = 0;
  for (const polygon of rings) {
    const ring = polygon[0] ?? [];
    let twiceArea = 0;
    for (let index = 0; index < ring.length; index += 1) {
      const current = project(ring[index][0], ring[index][1]);
      const next = project(ring[(index + 1) % ring.length][0], ring[(index + 1) % ring.length][1]);
      const cross = current.x * next.y - next.x * current.y;
      twiceArea += cross;
    }
    const area = Math.abs(twiceArea / 2);
    if (area > largestArea) {
      largestArea = area;
      largestRing = ring;
    }
  }
  let center = { x: VIEW_WIDTH / 2, y: VIEW_HEIGHT / 2 };
  if (largestRing.length > 2) {
    let twiceArea = 0;
    let centerX = 0;
    let centerY = 0;
    for (let index = 0; index < largestRing.length; index += 1) {
      const current = project(largestRing[index][0], largestRing[index][1]);
      const next = project(largestRing[(index + 1) % largestRing.length][0], largestRing[(index + 1) % largestRing.length][1]);
      const cross = current.x * next.y - next.x * current.y;
      twiceArea += cross;
      centerX += (current.x + next.x) * cross;
      centerY += (current.y + next.y) * cross;
    }
    if (Math.abs(twiceArea) > 0.001) {
      center = { x: centerX / (3 * twiceArea), y: centerY / (3 * twiceArea) };
    } else {
      center = {
        x: largestRing.reduce((sum, point) => sum + project(point[0], point[1]).x, 0) / largestRing.length,
        y: largestRing.reduce((sum, point) => sum + project(point[0], point[1]).y, 0) / largestRing.length,
      };
    }
  }
  const path = rings
    .flatMap((polygon) =>
      polygon.map((ring) => {
        const points = ring.map(([lon, lat]) => project(lon, lat));
        if (!points.length) return '';
        return `M${points.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join('L')}Z`;
      }),
    )
    .join('');
  return {
    name: feature.properties.il_adi,
    plate: feature.properties.plaka,
    plateStr: String(feature.properties.plaka).padStart(2, '0'),
    region: feature.properties.bolge,
    path,
    center,
  };
}

/** Pre-computed once at module load — 0ms mount time. */
export const SHAPES: ProvinceShape[] = GEO.features.map(makeShape);
export const SHAPE_BY_NAME: Map<string, ProvinceShape> = new Map(SHAPES.map((shape) => [shape.name, shape]));
export const COMBINED_TURKEY_PATH: string = SHAPES.map((shape) => shape.path).join('');
