export interface YouTubePlaylist {
  /** Stable local id (builtin slug or custom nanoid-ish). */
  id: string;
  title: string;
  channel: string;
  /** YouTube playlist id (the `list=` parameter value). */
  playlistId: string;
  builtin: boolean;
}

export const CUSTOM_PLAYLISTS_KEY = 'geokpss-yt-custom-playlists';
export const PLAYLIST_META_CACHE_KEY = 'geokpss-yt-meta-cache';

/**
 * Curated KPSS geography playlists. Verified public YouTube playlists,
 * led by Yunus Hoca (Coğrafyanın Kodları) KPSS series.
 */
export const CURATED_PLAYLISTS: YouTubePlaylist[] = [
  {
    id: 'yunus-konu-anlatimi',
    title: 'KPSS Coğrafya — Konu Anlatımı + Soru Çözümü',
    channel: 'Yunus Hoca · Coğrafyanın Kodları',
    playlistId: 'PLnBnugScc-7ImTQrm8DvvMFHByN5Pg31V',
    builtin: true,
  },
  {
    id: 'yunus-genel-tekrar',
    title: 'KPSS-AGS Coğrafya 2026 — Genel Tekrar',
    channel: 'Yunus Hoca · Coğrafyanın Kodları',
    playlistId: 'PLnBnugScc-7IKYJgSCVqj7_Ozd4l0lN1t',
    builtin: true,
  },
  {
    id: 'yunus-soru-cozumu',
    title: 'KPSS-AGS Coğrafya 2026 — Soru Çözümü',
    channel: 'Yunus Hoca · Coğrafyanın Kodları',
    playlistId: 'PLnBnugScc-7JVBL1LinFUVz3nzLPe7ROE',
    builtin: true,
  },
  {
    id: 'yunus-deneme-cozumu',
    title: 'KPSS Coğrafya Deneme Çözümleri',
    channel: 'Yunus Hoca · Coğrafyanın Kodları',
    playlistId: 'PLnBnugScc-7IGIbGbMU46xf6pBV6YyEtd',
    builtin: true,
  },
  {
    id: 'bayram-meral-2027',
    title: '2027 KPSS Coğrafya — Konu Anlatımı',
    channel: 'Bayram Meral',
    playlistId: 'PL5kIOunpmSBOBDQbSpgzjR8PgClHVmxgK',
    builtin: true,
  },
  {
    id: 'engin-eraydin-2025',
    title: 'MEB-AGS & KPSS Coğrafya',
    channel: 'Engin Eraydın',
    playlistId: 'PLWmaY8eH_wwfIOT3R_S9Tzr2KEybHfJIh',
    builtin: true,
  },
  {
    id: 'turgay-kocakaya-2025',
    title: 'MEB AGS KPSS Coğrafya Konu Anlatım',
    channel: 'Turgay Kocakaya',
    playlistId: 'PLPlLdubQ1fMufCjzSafcuK3z0vqmoechH',
    builtin: true,
  },
  {
    id: 'hakan-bileyen-osym',
    title: 'ÖSYM Ne Sorar — KPSS Coğrafya',
    channel: 'Hakan Bileyen',
    playlistId: 'PL8xiaE-wCWlaqe7mplhO-fd6kQgOAYHh_',
    builtin: true,
  },
  {
    id: 'bayram-meral-turkiye',
    title: 'KPSS Türkiye Coğrafyası',
    channel: 'Bayram Meral',
    playlistId: 'PL5kIOunpmSBNtQ4Z78DUUI_YCj_zebfiN',
    builtin: true,
  },
];

/** Live metadata resolved via YouTube oEmbed (no API key needed). */
export interface PlaylistMeta {
  title: string;
  channel: string;
  thumbnailUrl: string;
}

export function playlistOEmbedUrl(playlistId: string): string {
  const target = buildPlaylistUrl(playlistId);
  return `https://www.youtube.com/oembed?url=${encodeURIComponent(target)}&format=json`;
}

/**
 * Extracts a YouTube playlist id from a URL or returns the input itself
 * when it already looks like a bare playlist id.
 * Accepts: youtube.com/playlist?list=ID, music.youtube.com, youtu.be variants,
 * share URLs with extra params, and raw IDs.
 */
export function parsePlaylistId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const listMatch = trimmed.match(/[?&]list=([A-Za-z0-9_-]{5,})/);
  if (listMatch) return listMatch[1];

  // Bare playlist id (YouTube ids are typically 13-34 chars of this alphabet)
  if (/^[A-Za-z0-9_-]{10,40}$/.test(trimmed)) return trimmed;

  return null;
}

export function buildPlaylistUrl(playlistId: string): string {
  return `https://www.youtube.com/playlist?list=${encodeURIComponent(playlistId)}`;
}

/**
 * Embed URL for the official YouTube iframe player. `videoseries` plays the
 * whole playlist with YouTube's own queue UI — no API key required.
 */
export function buildPlaylistEmbedUrl(playlistId: string): string {
  const params = new URLSearchParams({
    list: playlistId,
    playsinline: '1',
    rel: '0',
    hl: 'tr',
    modestbranding: '1',
  });
  return `https://www.youtube.com/embed/videoseries?${params.toString()}`;
}

/**
 * Fetches playlist title/channel/thumbnail via YouTube's public oEmbed
 * endpoint. Returns null on any failure — callers should degrade gracefully.
 */
export async function fetchPlaylistMeta(playlistId: string): Promise<PlaylistMeta | null> {
  try {
    const response = await fetch(playlistOEmbedUrl(playlistId));
    if (!response.ok) return null;
    const data = (await response.json()) as {
      title?: string;
      author_name?: string;
      thumbnail_url?: string;
    };
    if (!data.title || !data.thumbnail_url) return null;
    return {
      title: data.title,
      channel: data.author_name ?? '',
      thumbnailUrl: data.thumbnail_url,
    };
  } catch {
    return null;
  }
}

// AsyncStorage is required lazily so pure helpers stay importable in Node
// tests and web bundles that never touch persistence.
function getStorage(): typeof import('@react-native-async-storage/async-storage').default {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('@react-native-async-storage/async-storage').default;
}

export async function loadCustomPlaylists(): Promise<YouTubePlaylist[]> {
  try {
    const raw = await getStorage().getItem(CUSTOM_PLAYLISTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is YouTubePlaylist =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as YouTubePlaylist).id === 'string' &&
        typeof (item as YouTubePlaylist).title === 'string' &&
        typeof (item as YouTubePlaylist).playlistId === 'string',
    );
  } catch {
    return [];
  }
}

export async function saveCustomPlaylists(playlists: YouTubePlaylist[]): Promise<void> {
  await getStorage().setItem(CUSTOM_PLAYLISTS_KEY, JSON.stringify(playlists));
}

export async function loadMetaCache(): Promise<Record<string, PlaylistMeta>> {
  try {
    const raw = await getStorage().getItem(PLAYLIST_META_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== 'object' || parsed === null) return {};
    return parsed as Record<string, PlaylistMeta>;
  } catch {
    return {};
  }
}

export async function saveMetaCache(cache: Record<string, PlaylistMeta>): Promise<void> {
  await getStorage().setItem(PLAYLIST_META_CACHE_KEY, JSON.stringify(cache));
}

export function makeCustomPlaylistId(): string {
  return `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
