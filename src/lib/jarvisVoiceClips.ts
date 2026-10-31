// Real voice clips extracted from prohod.zip for authentic Iron Man Jarvis voice

let currentAudio: HTMLAudioElement | null = null;
let isAudioUnlocked = false;

export function unlockAudioOnIOS(): void {
  if (isAudioUnlocked || typeof window === 'undefined') return;
  isAudioUnlocked = true;

  try {
    // Play a tiny 0.01s silent audio to unlock iOS Web Audio pipeline
    const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
    silentAudio.volume = 0.01;
    silentAudio.play().then(() => {
      silentAudio.pause();
    }).catch(() => {});

    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
  } catch {
    // Ignore
  }
}

// Auto-register touch/click unlock for iOS Safari
if (typeof window !== 'undefined') {
  const onFirstInteraction = () => {
    unlockAudioOnIOS();
    window.removeEventListener('touchstart', onFirstInteraction);
    window.removeEventListener('click', onFirstInteraction);
  };
  window.addEventListener('touchstart', onFirstInteraction, { passive: true });
  window.addEventListener('click', onFirstInteraction, { passive: true });
}

export function stopVoiceAudio(): void {
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    } catch {
      // Ignore
    }
    currentAudio = null;
  }
}

export function triggerHaptic(duration = 20): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(duration);
    } catch {
      // Ignore
    }
  }
}

export function playVoiceFile(filename: string, onEnd?: () => void): Promise<boolean> {
  stopVoiceAudio();

  return new Promise((resolve) => {
    try {
      const baseUrl = import.meta.env.BASE_URL.endsWith('/')
        ? import.meta.env.BASE_URL
        : `${import.meta.env.BASE_URL}/`;
      const audio = new Audio(`${baseUrl}audio/${filename}`);
      currentAudio = audio;

      audio.onended = () => {
        currentAudio = null;
        onEnd?.();
        resolve(true);
      };

      audio.onerror = () => {
        currentAudio = null;
        resolve(false);
      };

      audio.play().catch(() => {
        currentAudio = null;
        resolve(false);
      });
    } catch {
      resolve(false);
    }
  });
}

// Random Ok confirmation clips
export function playOkClip(onEnd?: () => void): Promise<boolean> {
  const oks = ['ok1.mp3', 'ok2.mp3', 'ok3.mp3', 'ok4.mp3', 'reply1.mp3', 'reply2.mp3'];
  const clip = oks[Math.floor(Math.random() * oks.length)];
  return playVoiceFile(clip, onEnd);
}

// Hello / Greeting clips
export function playGreetingClip(onEnd?: () => void): Promise<boolean> {
  const hour = new Date().getHours();
  let clip = 'hello1.mp3';
  if (hour >= 5 && hour < 12) clip = 'greet_morning.mp3';
  else if (hour >= 12 && hour < 18) clip = 'greet_day.mp3';
  else if (hour >= 18 && hour < 23) clip = 'greet_evening.mp3';
  else clip = 'greet_night.mp3';

  return playVoiceFile(clip, onEnd);
}

// Joke clips (from joke1.mp3 to joke8.mp3 in prohod)
export function playJokeClip(onEnd?: () => void): Promise<boolean> {
  const idx = Math.floor(Math.random() * 8) + 1;
  return playVoiceFile(`joke${idx}.mp3`, onEnd);
}

// Discord voice clip
export function playDiscordClip(onEnd?: () => void): Promise<boolean> {
  return playVoiceFile('cmd_open_discord.mp3', onEnd);
}

// YouTube voice clip
export function playYouTubeClip(onEnd?: () => void): Promise<boolean> {
  return playVoiceFile('cmd_open_youtube.mp3', onEnd);
}

// Mute / Unmute mic clips
export function playMuteClip(onEnd?: () => void): Promise<boolean> {
  return playVoiceFile('cmd_volume_mute.mp3', onEnd);
}

export function playUnmuteClip(onEnd?: () => void): Promise<boolean> {
  return playVoiceFile('cmd_volume_unmute.mp3', onEnd);
}

// Thanks clip
export function playThanksClip(onEnd?: () => void): Promise<boolean> {
  return playVoiceFile('thanks.mp3', onEnd);
}

// What time clip
export function playTimeClip(onEnd?: () => void): Promise<boolean> {
  return playVoiceFile('cmd_what_time.mp3', onEnd);
}
