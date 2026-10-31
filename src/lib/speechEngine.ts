// Futuristic Web Audio Synthesizer for Jarvis sound effects
class SoundFXEngine {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public playWakeChime(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(440, now);
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.14);

      osc2.frequency.setValueAtTime(660, now + 0.05);
      osc2.frequency.exponentialRampToValueAtTime(1320, now + 0.18);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now + 0.04);
      osc1.stop(now + 0.35);
      osc2.stop(now + 0.35);
    } catch {
      // Audio playback restrictions
    }
  }

  public playExecuteChime(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.08); // A5

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.28);
    } catch {
      // Ignore
    }
  }

  public playErrorChime(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(180, now + 0.2);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch {
      // Ignore
    }
  }
}

export const soundFX = new SoundFXEngine();

// Speech Synthesis
export function speakText(text: string, onEnd?: () => void): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onEnd?.();
    return;
  }

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ru-RU';
    utterance.rate = 1.05;
    utterance.pitch = 0.95;

    const voices = window.speechSynthesis.getVoices();
    const ruVoice = voices.find((v) => v.lang.toLowerCase().startsWith('ru')) || null;
    if (ruVoice) {
      utterance.voice = ruVoice;
    }

    utterance.onend = () => onEnd?.();
    utterance.onerror = () => onEnd?.();

    // Fallback timeout in case onend doesn't trigger
    setTimeout(() => {
      onEnd?.();
    }, Math.max(2500, text.length * 150));

    window.speechSynthesis.speak(utterance);
  } catch {
    onEnd?.();
  }
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(
    (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition
  );
}

// Request and configure high-quality microphone constraints (echo cancellation, noise suppression, auto gain)
export async function setupHighQualityMicrophoneStream(): Promise<MediaStream | null> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return null;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1,
        sampleRate: 48000,
      },
    });
    return stream;
  } catch (err) {
    console.warn('Microphone enhancement fallback:', err);
    return null;
  }
}

export const WAKE_WORDS = [
  'джарвис',
  'жарвис',
  'jarvis',
  'гарвис',
  'гарви',
  'джервис',
  'джонни',
  'чарвис',
  'чарви',
  'дарвис',
  'ярик',
  'дарбис',
];

export function cleanWakeWord(text: string): { hasWake: boolean; commandText: string } {
  const lower = text.toLowerCase().trim().replace(/[.,!?;:]/g, '');
  
  // Check if any wake word appears as a word or partial root
  const hasWake = WAKE_WORDS.some((w) => {
    return lower === w || lower.startsWith(w + ' ') || lower.endsWith(' ' + w) || lower.includes(' ' + w + ' ');
  });

  let clean = lower;
  for (const w of WAKE_WORDS) {
    // Remove wake word with optional following punctuation/comma
    clean = clean.replace(new RegExp(`(^|\\s)${w}(\\s|$)`, 'gi'), ' ').trim();
  }

  return { hasWake, commandText: clean };
}
