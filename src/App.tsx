/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { VoiceOrb } from './components/VoiceOrb';
import { BottomTray } from './components/BottomTray';
import { CommandChips } from './components/CommandChips';
import { ActivityLog } from './components/ActivityLog';
import { GestureCamPIP } from './components/GestureCamPIP';
import {
  playDiscordClip,
  playYouTubeClip,
  playMuteClip,
  playUnmuteClip,
  playJokeClip,
  playGreetingClip,
  playThanksClip,
  playTimeClip,
  playOkClip,
  unlockAudioOnIOS,
  triggerHaptic,
} from './lib/jarvisVoiceClips';
import {
  soundFX,
  speakText,
  cleanWakeWord,
  isSpeechRecognitionSupported,
  setupHighQualityMicrophoneStream,
} from './lib/speechEngine';
import { ActivityEvent, JarvisPhase, DetectedGesture } from './types/jarvis';
import { ExternalLink, Terminal } from 'lucide-react';
import { LaptopInstallModal } from './components/LaptopInstallModal';

export default function App() {
  const [phase, setPhase] = useState<JarvisPhase>('idle');
  const [statusText, setStatusText] = useState<string>('Ожидание · Скажите «Джарвис» или нажмите на сферу');
  const [transcript, setTranscript] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(true);
  const [isLogOpen, setIsLogOpen] = useState<boolean>(false);
  const [isLaptopModalOpen, setIsLaptopModalOpen] = useState<boolean>(false);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');
  const [awaitingCommand, setAwaitingCommand] = useState<boolean>(false);
  const [pendingUrl, setPendingUrl] = useState<{ url: string; label: string } | null>(null);

  const recognitionRef = useRef<any>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const isListeningRef = useRef<boolean>(true);
  const awaitingCommandRef = useRef<boolean>(false);
  const awaitingTimeoutRef = useRef<any>(null);

  useEffect(() => {
    awaitingCommandRef.current = awaitingCommand;
  }, [awaitingCommand]);

  // Clock update
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('ru-RU', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
      setDateStr(
        now.toLocaleDateString('ru-RU', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const pushEvent = useCallback(
    (
      title: string,
      type: ActivityEvent['type'],
      source: ActivityEvent['source'] = 'jarvis',
      detail?: string,
      status: ActivityEvent['status'] = 'nominal'
    ) => {
      const newEvent: ActivityEvent = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toLocaleTimeString('ru-RU', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        type,
        source,
        title,
        detail,
        status,
      };
      setEvents((prev) => [newEvent, ...prev].slice(0, 40));
    },
    []
  );

  // Mute microphone function
  const muteMicrophone = useCallback(() => {
    triggerHaptic(30);
    setIsListening(false);
    isListeningRef.current = false;
    setAwaitingCommand(false);
    clearTimeout(awaitingTimeoutRef.current);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // Ignore
      }
    }
    setPhase('idle');
    setStatusText('Микрофон выключен · Нажмите кнопку внизу для включения');
    pushEvent('Микрофон отключен', 'system_info', 'user', 'Режим тишины', 'warning');

    playMuteClip(() => {
      setPhase('idle');
    }).then((played) => {
      if (!played) {
        speakText('Микрофон отключен, сэр.', () => setPhase('idle'));
      }
    });
  }, [pushEvent]);

  // Unmute microphone function
  const unmuteMicrophone = useCallback(() => {
    triggerHaptic(20);
    unlockAudioOnIOS();
    setIsListening(true);
    isListeningRef.current = true;
    soundFX.playWakeChime();
    setPhase('listening');
    setStatusText('Микрофон включен · Слушаю вас, сэр…');
    pushEvent('Микрофон активирован', 'system_info', 'user', 'Голосовое ядро активно', 'success');

    playUnmuteClip(() => {
      setPhase('listening');
      startRecognition();
    }).then((played) => {
      if (!played) {
        speakText('Слушаю вас, сэр.', () => {
          setPhase('listening');
          startRecognition();
        });
      }
    });
  }, [pushEvent]);

  // Safe window opener that defeats browser popup blockers
  const safeOpen = useCallback((url: string, label: string) => {
    try {
      const win = window.open(url, '_blank');
      if (!win || win.closed || typeof win.closed === 'undefined') {
        setPendingUrl({ url, label });
      } else {
        setPendingUrl(null);
      }
    } catch {
      setPendingUrl({ url, label });
    }
  }, []);

  // Open Discord directly
  const handleOpenDiscord = useCallback(() => {
    triggerHaptic(25);
    unlockAudioOnIOS();
    soundFX.playExecuteChime();
    pushEvent('Запуск Discord', 'command_sent', 'user');
    setStatusText('Открываю Discord…');
    setPhase('speaking');

    try {
      window.location.href = 'discord://';
    } catch {
      // Ignore
    }
    safeOpen('https://discord.com/app', 'Discord');

    playDiscordClip(() => {
      setPhase('idle');
      setStatusText('Ожидание');
    }).then((played) => {
      if (!played) {
        speakText('Открываю Discord, сэр.', () => {
          setPhase('idle');
          setStatusText('Ожидание');
        });
      }
    });
  }, [pushEvent, safeOpen]);

  // Open YouTube directly
  const handleOpenYouTube = useCallback(() => {
    triggerHaptic(25);
    unlockAudioOnIOS();
    soundFX.playExecuteChime();
    pushEvent('Запуск YouTube', 'command_sent', 'user');
    setStatusText('Открываю YouTube…');
    setPhase('speaking');

    safeOpen('https://www.youtube.com', 'YouTube');

    playYouTubeClip(() => {
      setPhase('idle');
      setStatusText('Ожидание');
    }).then((played) => {
      if (!played) {
        speakText('Открываю YouTube, сэр.', () => {
          setPhase('idle');
          setStatusText('Ожидание');
        });
      }
    });
  }, [pushEvent, safeOpen]);

  // Tell joke with real audio clip
  const tellJoke = useCallback(() => {
    unlockAudioOnIOS();
    setPhase('speaking');
    setStatusText('Анекдот от Джарвиса…');

    playJokeClip(() => {
      setPhase('idle');
      setStatusText('Ожидание');
    }).then((played) => {
      if (!played) {
        speakText('Сэр, программисты не любят природу, потому что там слишком много багов.', () => {
          setPhase('idle');
          setStatusText('Ожидание');
        });
      }
    });
  }, []);

  // Conversational response when user says just "Jarvis"
  const handleWakeCall = useCallback(() => {
    triggerHaptic(30);
    unlockAudioOnIOS();
    soundFX.playWakeChime();
    setAwaitingCommand(true);
    setPhase('listening');
    const msg = 'Да, сэр, что такое? Я вас слушаю.';
    setStatusText('«Да, сэр, что такое? Я вас слушаю…»');
    pushEvent('Обращение: «Джарвис»', 'voice_heard', 'user');

    clearTimeout(awaitingTimeoutRef.current);
    awaitingTimeoutRef.current = setTimeout(() => {
      setAwaitingCommand(false);
      setPhase('idle');
      setStatusText('Ожидание · Скажите «Джарвис» или команду');
    }, 10000);

    speakText(msg, () => {
      setPhase('listening');
    });
  }, [pushEvent]);

  // Command dispatcher
  const processCommand = useCallback(
    (rawText: string) => {
      const text = rawText.toLowerCase().trim();
      setTranscript(text);

      const isJustWakeWord =
        text === 'джарвис' ||
        text === 'жарвис' ||
        text === 'jarvis' ||
        text === 'эй джарвис' ||
        text === 'jarvis!' ||
        text === 'привет джарвис' ||
        text === 'джарвис ты тут';

      if (isJustWakeWord) {
        handleWakeCall();
        return;
      }

      setAwaitingCommand(false);
      clearTimeout(awaitingTimeoutRef.current);

      pushEvent(`Команда: «${text}»`, 'command_sent', 'user');

      // 1. Mute microphone
      if (
        text.includes('выключи микрофон') ||
        text.includes('отключи микрофон') ||
        text.includes('заглуши микрофон') ||
        text.includes('выруби микрофон') ||
        text === 'стоп' ||
        text === 'тишина' ||
        text.includes('не слушай')
      ) {
        muteMicrophone();
        return;
      }

      // 2. Unmute microphone
      if (text.includes('включи микрофон') || text.includes('активируй микрофон')) {
        unmuteMicrophone();
        return;
      }

      // 3. YouTube
      if (
        text.includes('ютуб') ||
        text.includes('youtube') ||
        text.includes('ютюб') ||
        text.includes('видео')
      ) {
        handleOpenYouTube();
        return;
      }

      // 4. Discord
      if (text.includes('дискорд') || text.includes('discord')) {
        handleOpenDiscord();
        return;
      }

      // 5. Time
      if (text.includes('время') || text.includes('который час') || text.includes('сколько времени')) {
        const now = new Date();
        const timeMsg = `Сейчас ${now.getHours()} часов ${now.getMinutes()} минут.`;
        setPhase('speaking');
        setStatusText(timeMsg);

        playTimeClip(() => {
          speakText(timeMsg, () => {
            setPhase('idle');
            setStatusText('Ожидание');
          });
        }).then((played) => {
          if (!played) {
            speakText(timeMsg, () => {
              setPhase('idle');
              setStatusText('Ожидание');
            });
          }
        });
        return;
      }

      // 6. Date
      if (text.includes('число') || text.includes('какой день') || text.includes('дата')) {
        const now = new Date();
        const months = [
          'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
          'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
        ];
        const msg = `Сегодня ${now.getDate()} ${months[now.getMonth()]}, сэр.`;
        setPhase('speaking');
        setStatusText(msg);
        speakText(msg, () => {
          setPhase('idle');
          setStatusText('Ожидание');
        });
        return;
      }

      // 7. Jokes & Humor
      if (text.includes('анекдот') || text.includes('шутка') || text.includes('пошути')) {
        tellJoke();
        return;
      }

      // 8. Chit-chat & Greetings
      if (text.includes('привет') || text.includes('здравствуй')) {
        setPhase('speaking');
        setStatusText('Приветствие…');
        playGreetingClip(() => {
          setPhase('idle');
          setStatusText('Ожидание');
        }).then((played) => {
          if (!played) {
            speakText('Здравствуйте, сэр. Все системы готовы.', () => {
              setPhase('idle');
              setStatusText('Ожидание');
            });
          }
        });
        return;
      }

      if (text.includes('как дела') || text.includes('как ты')) {
        setPhase('speaking');
        setStatusText('Все системы в норме');
        playOkClip(() => {
          setPhase('idle');
          setStatusText('Ожидание');
        });
        return;
      }

      if (text.includes('спасибо') || text.includes('молодец')) {
        setPhase('speaking');
        setStatusText('Всегда к услугам, сэр');
        playThanksClip(() => {
          setPhase('idle');
          setStatusText('Ожидание');
        });
        return;
      }

      // 9. Search in Google or YouTube
      if (text.startsWith('найди в гугле') || text.startsWith('погугли')) {
        const q = text.replace(/^(найди в гугле|погугли)\s*/, '');
        soundFX.playExecuteChime();
        setPhase('speaking');
        setStatusText(`Ищу в Google: ${q}`);
        safeOpen(`https://www.google.com/search?q=${encodeURIComponent(q)}`, `Google: ${q}`);
        speakText(`Ищу в Google: ${q}`, () => {
          setPhase('idle');
          setStatusText('Ожидание');
        });
        return;
      }

      if (text.startsWith('найди на ютубе')) {
        const q = text.replace(/^найди на ютубе\s*/, '');
        soundFX.playExecuteChime();
        setPhase('speaking');
        setStatusText(`Ищу на YouTube: ${q}`);
        safeOpen(`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`, `YouTube: ${q}`);
        speakText(`Ищу на YouTube: ${q}`, () => {
          setPhase('idle');
          setStatusText('Ожидание');
        });
        return;
      }

      // General affirmative response
      setPhase('speaking');
      setStatusText(`Команда принята: «${text}»`);
      playOkClip(() => {
        setPhase('idle');
        setStatusText('Ожидание');
      });
    },
    [handleOpenDiscord, handleOpenYouTube, handleWakeCall, muteMicrophone, pushEvent, safeOpen, tellJoke, unmuteMicrophone]
  );

  // Initialize Speech Recognition with High-Quality Audio Stream & Enhanced Russian acoustic model
  const startRecognition = useCallback(async () => {
    if (!isSpeechRecognitionSupported()) return;

    // Pre-calibrate hardware mic with noise suppression & echo cancellation if available
    if (!micStreamRef.current) {
      const stream = await setupHighQualityMicrophoneStream();
      if (stream) {
        micStreamRef.current = stream;
      }
    }

    try {
      const SpeechRec =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const rec = new SpeechRec();
      rec.lang = 'ru-RU';
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 3;

      rec.onstart = () => {
        setPhase('listening');
        if (!awaitingCommandRef.current) {
          setStatusText('Слушаю вас, сэр… Говорите команду');
        }
      };

      rec.onresult = (event: any) => {
        let final = '';
        let interim = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          if (item.isFinal) {
            final += item[0].transcript;
          } else {
            interim += item[0].transcript;
          }
        }

        const currentSaid = (final || interim).trim();
        if (currentSaid) {
          setTranscript(currentSaid);
        }

        // Check alternatives if main transcript didn't match cleanly
        let phraseToEvaluate = final.trim();
        if (!phraseToEvaluate && interim.trim()) {
          const { hasWake: interimWake } = cleanWakeWord(interim);
          if (interimWake) {
            handleWakeCall();
            return;
          }
        }

        if (phraseToEvaluate) {
          const { hasWake, commandText } = cleanWakeWord(phraseToEvaluate);

          if (awaitingCommandRef.current) {
            processCommand(commandText || phraseToEvaluate);
            return;
          }

          if (commandText && commandText.trim()) {
            processCommand(commandText);
          } else if (hasWake) {
            handleWakeCall();
          } else {
            // Also check second alternative hypothesis for wake words
            let altWakeFound = false;
            if (event.results[event.results.length - 1]?.length > 1) {
              for (let a = 1; a < event.results[event.results.length - 1].length; a++) {
                const alt = event.results[event.results.length - 1][a].transcript;
                const altCheck = cleanWakeWord(alt);
                if (altCheck.hasWake) {
                  altWakeFound = true;
                  if (altCheck.commandText) {
                    processCommand(altCheck.commandText);
                  } else {
                    handleWakeCall();
                  }
                  break;
                }
              }
            }

            if (!altWakeFound) {
              processCommand(phraseToEvaluate);
            }
          }
        }
      };

      rec.onerror = (e: any) => {
        if (e.error !== 'no-speech') {
          console.warn('Speech err:', e.error);
        }
      };

      rec.onend = () => {
        if (isListeningRef.current) {
          setTimeout(() => {
            try {
              if (isListeningRef.current) {
                rec.start();
              }
            } catch {
              // Ignore restart error
            }
          }, 150);
        }
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      console.warn('Speech init failed:', err);
    }
  }, [handleWakeCall, processCommand]);

  // Start speech recognition on mount and keep active in background (when minimized/hidden)
  useEffect(() => {
    if (isListening) {
      startRecognition();
    }

    // Keep active when tab/app is minimized or hidden in background
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        }
      } catch {
        // Ignore wakeLock unsupported/rejected
      }
    };
    requestWakeLock();

    const handleVisibilityOrFocus = () => {
      // When window is minimized or restored, ensure recognition stays alive
      if (isListeningRef.current && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch {
          // Already running, safe to ignore
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('blur', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('blur', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      if (wakeLock) {
        try {
          wakeLock.release();
        } catch {
          // Ignore
        }
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignore
        }
      }
    };
  }, [isListening, startRecognition]);

  // Manual Orb Click
  const handleOrbClick = () => {
    triggerHaptic(20);
    unlockAudioOnIOS();

    if (!isListening) {
      unmuteMicrophone();
      return;
    }

    if (phase === 'listening') {
      soundFX.playExecuteChime();
      setPhase('idle');
      setStatusText('Ожидание');
    } else {
      soundFX.playWakeChime();
      setPhase('listening');
      setStatusText('Слушаю вас, сэр… Говорите команду');
    }
  };

  // Camera gesture triggers
  const handleGestureTrigger = useCallback(
    (gesture: DetectedGesture) => {
      soundFX.playExecuteChime();
      pushEvent(`Жест: ${gesture.toUpperCase()}`, 'gesture_detected', 'gesture');

      switch (gesture) {
        case 'fist':
          muteMicrophone();
          break;
        case 'palm':
          if (!isListening) {
            unmuteMicrophone();
          } else {
            handleWakeCall();
          }
          break;
        case 'thumb_up':
          handleOpenDiscord();
          break;
        case 'victory':
          handleOpenYouTube();
          break;
        case 'point':
          processCommand('время');
          break;
        default:
          break;
      }
    },
    [handleOpenDiscord, handleOpenYouTube, handleWakeCall, isListening, muteMicrophone, processCommand, pushEvent, unmuteMicrophone]
  );

  return (
    <div className="min-h-[100dvh] h-[100dvh] bg-[#050B14] hud-grid-bg text-[#EAF5FF] flex flex-col justify-between selection:bg-[#29D8FF]/30 selection:text-[#29D8FF] overflow-hidden select-none">
      {/* Top Futuristic Header with iOS Notch Safe Area (pt-safe) */}
      <header className="w-full border-b border-[#29D8FF]/15 bg-[#071322]/85 backdrop-blur-md px-3 sm:px-8 pt-[max(0.6rem,env(safe-area-inset-top))] pb-2.5 select-none shrink-0 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo & Core Status */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#0B1E33] border border-[#29D8FF]/50 shadow-[0_0_15px_rgba(41,216,255,0.25)]">
              <span className="font-hud font-bold text-base sm:text-lg text-[#29D8FF] tracking-wider">J</span>
              <span className="absolute -top-1 -right-1 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#29D8FF] animate-ping opacity-75" />
            </div>

            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="font-hud font-bold text-lg sm:text-xl tracking-[0.2em] text-[#EAF5FF] uppercase hud-glow-text">
                  JARVIS
                </h1>
                <span className="text-[9px] sm:text-[10px] font-mono tracking-widest px-1.5 py-0.5 rounded bg-[#29D8FF]/15 text-[#29D8FF] border border-[#29D8FF]/30">
                  ONLINE
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] font-mono tracking-wider text-[#839BB5] uppercase truncate max-w-[150px] xs:max-w-none">
                {awaitingCommand
                  ? 'Ожидает команду…'
                  : isListening
                  ? 'Голос & Жесты активны'
                  : 'Микрофон заглушен'}
              </p>
            </div>
          </div>

          {/* Central Live Clock */}
          <div className="hidden md:flex flex-col items-center">
            <div className="text-xl font-mono font-bold tracking-widest text-[#29D8FF] tabular-nums">
              {timeStr || '12:00:00'}
            </div>
            <div className="text-[11px] font-mono tracking-wide text-[#839BB5]">
              {dateStr || '26 октября 2026'}
            </div>
          </div>

          {/* Right Header Status */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-[#0B1E33] border border-[#29D8FF]/20 text-[10px] sm:text-xs font-mono">
              <span className={`w-2 h-2 rounded-full ${isListening ? 'bg-[#10B981] animate-pulse shadow-[0_0_8px_#10B981]' : 'bg-red-400'}`} />
              <span className="uppercase tracking-wider text-[#839BB5]">
                {awaitingCommand ? 'Жду команду' : isListening ? 'Слушает' : 'Заглушен'}
              </span>
            </div>

            <button
              onClick={() => {
                triggerHaptic(15);
                setIsLogOpen(!isLogOpen);
              }}
              className={`p-2 rounded-lg border transition-colors cursor-pointer active:scale-95 touch-manipulation ${
                isLogOpen
                  ? 'bg-[#0E2842] border-[#29D8FF] text-[#29D8FF]'
                  : 'bg-[#0B1E33] border-[#29D8FF]/20 text-[#839BB5] hover:text-[#29D8FF]'
              }`}
              title="Открыть журнал событий"
            >
              <Terminal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Center Area: Immersive Cyber-HUD */}
      <main className="flex-1 flex flex-col items-center justify-center px-2 sm:px-4 py-3 sm:py-6 max-w-5xl mx-auto w-full relative overflow-y-auto">
        {/* Popup blocker fallback card */}
        {pendingUrl && (
          <div className="mb-3 px-3 py-2 rounded-xl bg-[#092238] border border-[#29D8FF]/50 flex items-center gap-2.5 text-xs animate-in fade-in">
            <span className="text-[#29D8FF]">Вкладка готова:</span>
            <button
              onClick={() => {
                window.open(pendingUrl.url, '_blank');
                setPendingUrl(null);
              }}
              className="px-3 py-1 rounded bg-[#29D8FF] text-[#050B14] font-semibold flex items-center gap-1.5 cursor-pointer hover:bg-[#76ECFF] active:scale-95"
            >
              <span>Открыть {pendingUrl.label}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* 3D Voice Orb */}
        <div className="my-auto flex flex-col items-center justify-center w-full">
          <VoiceOrb
            phase={phase}
            onClick={handleOrbClick}
            statusText={statusText}
            transcript={transcript}
          />

          {/* Interactive Suggestions Chips */}
          <div className="mt-4 sm:mt-6 w-full">
            <CommandChips onRun={(cmd) => processCommand(cmd)} />
          </div>
        </div>

        {/* Collapsible Activity Drawer */}
        {isLogOpen && (
          <div className="w-full mt-4 animate-in slide-in-from-bottom duration-300">
            <ActivityLog events={events} onClear={() => setEvents([])} />
          </div>
        )}
      </main>

      {/* Camera Gesture Tracker PIP with Visible Mirrored Live Feed */}
      <GestureCamPIP onGestureTrigger={handleGestureTrigger} />

      {/* Bottom Tray with Microphone Switch, Laptop Guide and Discord Button */}
      <BottomTray
        listening={isListening}
        phase={phase}
        onToggleMic={() => {
          if (isListening) {
            muteMicrophone();
          } else {
            unmuteMicrophone();
          }
        }}
        onOpenDiscord={handleOpenDiscord}
        onOpenLaptopGuide={() => setIsLaptopModalOpen(true)}
        onToggleLog={() => setIsLogOpen(!isLogOpen)}
        isLogOpen={isLogOpen}
      />

      {/* Laptop / PC Installation Guide Modal */}
      <LaptopInstallModal
        isOpen={isLaptopModalOpen}
        onClose={() => setIsLaptopModalOpen(false)}
      />
    </div>
  );
}
