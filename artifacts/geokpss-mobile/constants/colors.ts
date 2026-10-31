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
    text: '#20312E',
    tint: '#36796D',

    // Core surfaces
    background: '#F4F6F1',
    foreground: '#20312E',

    // Cards / elevated surfaces
    card: '#FFFFFF',
    cardForeground: '#20312E',

    // Primary action color (buttons, links, active states)
    primary: '#36796D',
    primaryForeground: '#ffffff',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#E9F0EA',
    secondaryForeground: '#2B4842',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#EDF1EB',
    mutedForeground: '#687A73',

    // Accent highlights (badges, selected items, focus rings)
    accent: '#DDEBE2',
    accentForeground: '#2B5F53',

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
    mapProvince: '#E7EEE6',
    mapRegion: '#EDF1EA',
    mapSelected: '#6EA594',
    mapCorrect: '#6DA78A',
    mapWrong: '#D66A61',
    mapStroke: '#FFFFFF',

    // Borders and input outlines
    border: '#DDE6DE',
    input: '#DDE6DE',
  },

  dark: {
    text: '#ECF2ED',
    tint: '#86B8A6',
    background: '#17211E',
    foreground: '#ECF2ED',
    card: '#202C28',
    cardForeground: '#ECF2ED',
    primary: '#86B8A6',
    primaryForeground: '#13201B',
    secondary: '#2B3934',
    secondaryForeground: '#E7F0E9',
    muted: '#2A3631',
    mutedForeground: '#A5B3AA',
    accent: '#31443C',
    accentForeground: '#D4E9D9',
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
    mapProvince: '#293733',
    mapRegion: '#222D29',
    mapSelected: '#5C8E7D',
    mapCorrect: '#4D8063',
    mapWrong: '#A94F49',
    mapStroke: '#3D4A43',
    border: '#3A4942',
    input: '#3A4942',
  },

  // Border radius (in px). Sync from the sibling web artifact's --radius
  // CSS variable. This value applies to cards, buttons, inputs, and modals.
  radius: 18,
};

export default colors;
