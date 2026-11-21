import { Platform } from 'react-native';

/**
 * Turkish text-to-speech for geography names. Uses expo-speech on native
 * and the Web Speech API on web. Silently no-ops when unavailable.
 */
export async function speakTurkish(text: string): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) return;
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(trimmed);
      utterance.lang = 'tr-TR';
      utterance.rate = 0.92;
      window.speechSynthesis.speak(utterance);
      return;
    }
    const Speech = await import('expo-speech');
    await Speech.stop();
    await Speech.speak(trimmed, { language: 'tr-TR', rate: 0.92 });
  } catch {
    // Speech is a nicety; never break the UI when it is unavailable.
  }
}
