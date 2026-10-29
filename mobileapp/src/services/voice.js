/**
 * Voice helpers for the AI chat.
 *  - Speech-to-text: expo-speech-recognition (needs a development build; the native
 *    module does not exist in Expo Go, so it is loaded defensively).
 *  - Text-to-speech: expo-speech (works everywhere, including Expo Go).
 */
import * as Speech from 'expo-speech';

let Recognizer = null;
try {
  // requireNativeModule() throws at import time when the module isn't in the binary.
  Recognizer = require('expo-speech-recognition').ExpoSpeechRecognitionModule;
} catch {
  Recognizer = null;
}

export const voiceInputSupported = !!Recognizer;

let subs = [];
function clearSubs() {
  subs.forEach((s) => s?.remove?.());
  subs = [];
}

/**
 * Start listening. Callbacks: onPartial(text), onFinal(text), onError(message), onEnd().
 * Resolves true when recognition started, false otherwise (onError is called with the reason).
 */
export async function startListening({ onPartial, onFinal, onError, onEnd }) {
  if (!Recognizer) {
    onError?.('unsupported');
    return false;
  }
  const perm = await Recognizer.requestPermissionsAsync();
  if (!perm.granted) {
    onError?.('permission');
    return false;
  }

  clearSubs();
  let finished = false;
  subs.push(Recognizer.addListener('result', (e) => {
    const text = e.results?.[0]?.transcript || '';
    if (e.isFinal) {
      finished = true;
      onFinal?.(text);
    } else {
      onPartial?.(text);
    }
  }));
  subs.push(Recognizer.addListener('error', (e) => {
    if (e.error === 'aborted') return;
    // "no-speech" is not a failure worth alerting about
    onError?.(e.error === 'no-speech' ? 'no-speech' : (e.message || e.error || 'error'));
  }));
  subs.push(Recognizer.addListener('end', () => {
    clearSubs();
    onEnd?.(finished);
  }));

  Recognizer.start({ lang: 'en-IN', interimResults: true, continuous: false });
  return true;
}

export function stopListening() {
  try { Recognizer?.stop(); } catch { /* noop */ }
}

export function cancelListening() {
  try { Recognizer?.abort(); } catch { /* noop */ }
  clearSubs();
}

// Strip markdown symbols / emoji so the voice reads naturally.
function speakable(text) {
  return String(text || '')
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '')
    .replace(/[*_`#>•]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function speak(text, { onDone } = {}) {
  const clean = speakable(text);
  Speech.stop();
  if (!clean) { onDone?.(); return; }
  Speech.speak(clean, { language: 'en-IN', rate: 1.0, onDone, onStopped: onDone, onError: onDone });
}

export function stopSpeaking() {
  Speech.stop();
}
