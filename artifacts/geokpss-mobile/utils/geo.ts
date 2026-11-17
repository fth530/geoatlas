export const VIEW_WIDTH = 360;
export const VIEW_HEIGHT = 190;

const BOUNDS = { minLon: 25.75, maxLat: 42.25 };
const LON_SCALE = 18.8;
const LAT_SCALE = 29.1;

export type Point = { x: number; y: number };

/**
 * Equirectangular projection used by the bundled Turkey map.
 * Deterministic and cheap — fine for schematic (non-measurement) maps.
 */
export function project(lon: number, lat: number): Point {
  return {
    x: (lon - BOUNDS.minLon) * LON_SCALE,
    y: (BOUNDS.maxLat - lat) * LAT_SCALE,
  };
}
