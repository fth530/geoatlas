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
    text: '#191C1C',
    tint: '#0E7C7B',

    // Core surfaces
    background: '#F8F9FC',
    foreground: '#202539',

    // Cards / elevated surfaces
    card: '#FFFFFF',
    cardForeground: '#202539',

    // Primary action color (buttons, links, active states)
    primary: '#0E7C7B',
    primaryForeground: '#ffffff',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#EEF1F8',
    secondaryForeground: '#35405A',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#F0F2F7',
    mutedForeground: '#7A8397',

    // Accent highlights (badges, selected items, focus rings)
    accent: '#E0F4F3',
    accentForeground: '#0A5F5E',

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
    mapProvince: '#ECEFF6',
    mapRegion: '#F4F6FA',
    mapSelected: '#0E7C7B',
    mapCorrect: '#4E9472',
    mapWrong: '#D66A61',
    mapStroke: '#FFFFFF',
    mapWater: '#DCEBFA',
    mapWaterDeep: '#C9E0F7',
    mapGrid: '#B8D3EE',
    mapMarmara: '#E0E8FB',
    mapEge: '#DDF0E7',
    mapAkdeniz: '#F9E8DF',
    mapIcAnadolu: '#F6EEDC',
    mapKaradeniz: '#D6ECE6',
    mapDoguAnadolu: '#E5E6F7',
    mapGuneydogu: '#F6E3D5',

    // Borders and input outlines
    border: '#E6EAF1',
    input: '#E6EAF1',
    overlay: '#202539B8',
  },

  dark: {
    text: '#F1F2F7',
    tint: '#7CD5D3',
    background: '#171A27',
    foreground: '#F1F2F7',
    card: '#222738',
    cardForeground: '#F1F2F7',
    primary: '#7CD5D3',
    primaryForeground: '#0A2B2A',
    secondary: '#2C3244',
    secondaryForeground: '#E7EBF4',
    muted: '#292F40',
    mutedForeground: '#A2A9BB',
    accent: '#1F3D3C',
    accentForeground: '#B9ECEA',
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
    mapProvince: '#293146',
    mapRegion: '#232A3C',
    mapSelected: '#5FCBC8',
    mapCorrect: '#4D8C6A',
    mapWrong: '#B9544D',
    mapStroke: '#48526A',
    mapWater: '#122033',
    mapWaterDeep: '#0D1827',
    mapGrid: '#223650',
    mapMarmara: '#2F3B5C',
    mapEge: '#254442',
    mapAkdeniz: '#4A332E',
    mapIcAnadolu: '#453D2A',
    mapKaradeniz: '#21423E',
    mapDoguAnadolu: '#363A59',
    mapGuneydogu: '#4A352A',
    border: '#353B4F',
    input: '#353B4F',
    overlay: '#080B12CC',
  },

  // Border radius (in px). Sync from the sibling web artifact's --radius
  // CSS variable. This value applies to cards, buttons, inputs, and modals.
  radius: 18,
};

export default colors;
