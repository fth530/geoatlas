/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    // Legacy aliases (kept for backward compatibility)
    text: '#202539',
    tint: '#5368D9',

    // Core surfaces
    background: '#F8F9FC',
    foreground: '#202539',

    // Cards / elevated surfaces
    card: '#FFFFFF',
    cardForeground: '#202539',

    // Primary action color (buttons, links, active states)
    primary: '#4F63D7',
    primaryForeground: '#ffffff',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#EEF1F8',
    secondaryForeground: '#35405A',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#F0F2F7',
    mutedForeground: '#7A8397',

    // Accent highlights (badges, selected items, focus rings)
    accent: '#EDF0FF',
    accentForeground: '#4455B8',

    // Destructive actions (delete, error states)
    destructive: '#C85D52',
    destructiveForeground: '#ffffff',
    success: '#468365',
    successForeground: '#315F49',
    successMuted: '#527661',
    successBackground: '#E2F0E8',
    errorBackground: '#F7E7E4',
    errorForeground: '#963F37',
    errorMuted: '#A45A52',
    premium: '#9A7848',
    premiumBackground: '#F3EADB',
    mapProvince: '#ECEFF4',
    mapRegion: '#F7F8FA',
    mapSelected: '#657CE4',
    mapCorrect: '#6DA78A',
    mapWrong: '#D66A61',
    mapStroke: '#FFFFFF',
    mapWater: '#F2F6FB',
    mapGrid: '#DCE5EF',
    mapMarmara: '#E7EEF9',
    mapEge: '#E9F2F3',
    mapAkdeniz: '#EEF3FA',
    mapIcAnadolu: '#E8EDF6',
    mapKaradeniz: '#E4F0F1',
    mapDoguAnadolu: '#E9EBF7',
    mapGuneydogu: '#F1EFF8',

    // Borders and input outlines
    border: '#E6EAF1',
    input: '#E6EAF1',
    overlay: '#202539B8',
  },

  dark: {
    text: '#F1F2F7',
    tint: '#A7B3FF',
    background: '#171A27',
    foreground: '#F1F2F7',
    card: '#222738',
    cardForeground: '#F1F2F7',
    primary: '#9DAAFF',
    primaryForeground: '#171C34',
    secondary: '#2C3244',
    secondaryForeground: '#E7EBF4',
    muted: '#292F40',
    mutedForeground: '#A2A9BB',
    accent: '#2D3456',
    accentForeground: '#D5DCFF',
    destructive: '#D8786E',
    destructiveForeground: '#FFFFFF',
    success: '#86B99A',
    successForeground: '#C9E8D2',
    successMuted: '#A3C7AE',
    successBackground: '#263B31',
    errorBackground: '#452A29',
    errorForeground: '#F1B7B0',
    errorMuted: '#D79A93',
    premium: '#D9B985',
    premiumBackground: '#40372A',
    mapProvince: '#2D3345',
    mapRegion: '#252B3D',
    mapSelected: '#7084EA',
    mapCorrect: '#4D8063',
    mapWrong: '#A94F49',
    mapStroke: '#40475B',
    mapWater: '#1B2434',
    mapGrid: '#334157',
    mapMarmara: '#343E55',
    mapEge: '#31444D',
    mapAkdeniz: '#343D50',
    mapIcAnadolu: '#30394C',
    mapKaradeniz: '#2D4145',
    mapDoguAnadolu: '#363A54',
    mapGuneydogu: '#43394E',
    border: '#353B4F',
    input: '#353B4F',
    overlay: '#080B12CC',
  },

  // Border radius (in px). Sync from the sibling web artifact's --radius
  // CSS variable. This value applies to cards, buttons, inputs, and modals.
  radius: 18,
};

export default colors;
