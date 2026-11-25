/**
 * Tokens that only the onboarding uses.
 *
 * The welcome screen is a fixed deep-teal "atlas plate" in both color modes,
 * so its palette lives here instead of in the shared color tokens. The two
 * step screens use the regular app tokens from `useColors()`.
 */
export const ONBOARDING_PALETTE = {
  glow: '#0B3F41',
  deep: '#06292A',
  bottom: '#04191A',
  teal: '#0E7C7B',
  cream: '#F4EEDC',
  creamBody: 'rgba(244,238,220,0.66)',
  creamMuted: 'rgba(244,238,220,0.5)',
  creamLine: 'rgba(244,238,220,0.17)',
  creamLineSoft: 'rgba(244,238,220,0.15)',
  creamTrack: 'rgba(244,238,220,0.2)',
  creamTick: 'rgba(244,238,220,0.3)',
  amber: '#FEA619',
  pinHalo: 'rgba(254,166,25,0.22)',
  platePaper: '#FBF8EC',
  plateInk: '#123B39',
} as const;

/** Projection box of the bundled Turkey map (`utils/geo.ts`). */
export const PLATE_VIEWBOX = { width: 360, height: 190 } as const;
export const PLATE_ASPECT = PLATE_VIEWBOX.width / PLATE_VIEWBOX.height;

/** Van Gölü inside the projection box. */
export const PLATE_PIN = { x: 323.9, y: 104.8 } as const;

export const ONBOARDING_STEPS = 3;
export const SCREEN_PADDING = 20;
export const CTA_HEIGHT = 52;
export const PLATE_RADIUS = 18;
export const CARD_RADIUS = 18;
