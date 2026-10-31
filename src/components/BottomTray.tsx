import React from 'react';
import { Mic, MicOff, Terminal, Laptop } from 'lucide-react';
import { triggerHaptic } from '../lib/jarvisVoiceClips';

interface BottomTrayProps {
  listening: boolean;
  phase: string;
  onToggleMic: () => void;
  onOpenDiscord: () => void;
  onOpenLaptopGuide: () => void;
  onToggleLog?: () => void;
  isLogOpen?: boolean;
}

const VU_BARS = [
  'h-2', 'h-3.5', 'h-1.5', 'h-4', 'h-2', 'h-3', 'h-1', 'h-2.5', 'h-4', 'h-2'
];

export const BottomTray: React.FC<BottomTrayProps> = ({
  listening,
  phase,
  onToggleMic,
  onOpenDiscord,
  onOpenLaptopGuide,
  onToggleLog,
  isLogOpen,
}) => {
  const isAudioActive = listening && (phase === 'listening' || phase === 'speaking');

  const handleMicClick = () => {
    triggerHaptic(30);
    onToggleMic();
  };

  const handleDiscordClick = () => {
    triggerHaptic(20);
    onOpenDiscord();
  };

  const handleLaptopClick = () => {
    triggerHaptic(20);
    onOpenLaptopGuide();
  };

  return (
    <div className="w-full border-t border-[#29D8FF]/15 bg-[#050B14]/90 backdrop-blur-xl px-3 sm:px-8 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] select-none shrink-0 z-30">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4">
        {/* Top/Left: Microphone status, noise filter badge & Audio VU meter bars */}
        <div className="flex items-center justify-between w-full sm:w-auto gap-2.5 px-3 py-1 rounded-full bg-[#0B1A2C]/80 border border-[#29D8FF]/20">
          <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-[#76ECFF]">
            {listening ? (
              <Mic className="w-3.5 h-3.5 text-[#29D8FF]" />
            ) : (
              <MicOff className="w-3.5 h-3.5 text-red-400" />
            )}
            <span className="uppercase tracking-wider text-[10px] sm:text-[11px]">
              {listening ? 'Микрофон HD' : 'Заглушен'}
            </span>
          </div>

          <span className="text-[#29D8FF]/30">|</span>

          {/* Equalizer animation bars */}
          <div className="flex items-center gap-0.5 h-4 px-1" title="Студийный фильтр шума и эха (Noise Suppression + AGC)">
            {VU_BARS.map((heightClass, i) => (
              <span
                key={i}
                className={`w-1 rounded-full transition-all duration-150 ${
                  isAudioActive
                    ? 'bg-[#29D8FF] animate-pulse'
                    : listening
                    ? 'bg-[#29D8FF]/40'
                    : 'bg-[#839BB5]/20'
                } ${heightClass}`}
                style={{
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: `${0.4 + (i % 3) * 0.2}s`,
                }}
              />
            ))}
          </div>

          <span className="hidden xs:inline text-[9px] font-mono text-[#10B981] bg-[#10B981]/15 px-1.5 py-0.5 rounded border border-[#10B981]/30 uppercase tracking-wider">
            Шумодав ON
          </span>
        </div>

        {/* Center & Right Buttons for Mobile & Laptop */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 w-full sm:w-auto">
          {/* Big Microphone Action Button - 44px+ touch target */}
          <button
            type="button"
            onClick={handleMicClick}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 sm:px-6 min-h-[44px] py-2.5 rounded-full border text-xs font-mono font-semibold tracking-wider uppercase transition-all duration-200 shadow-lg active:scale-95 touch-manipulation cursor-pointer ${
              listening
                ? 'bg-red-950/40 border-red-500/50 text-red-300 hover:bg-red-900/50 hover:border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.25)]'
                : 'bg-[#0B253D] border-[#29D8FF]/60 text-[#29D8FF] hover:bg-[#133758] shadow-[0_0_20px_rgba(41,216,255,0.35)]'
            }`}
            title={listening ? 'Нажмите или скажите «Выключи микрофон»' : 'Нажмите, чтобы включить микрофон'}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                listening ? 'bg-red-500 animate-ping' : 'bg-[#29D8FF]'
              }`}
            />
            {listening ? <MicOff className="w-4 h-4 shrink-0" /> : <Mic className="w-4 h-4 shrink-0" />}
            <span className="truncate">{listening ? 'Выключить' : 'Включить'}</span>
          </button>

          {/* Laptop Install / Guide Button */}
          <button
            onClick={handleLaptopClick}
            className="flex items-center justify-center gap-1.5 px-3.5 min-h-[44px] py-2.5 rounded-full bg-[#0B1E33] border border-[#29D8FF]/35 text-[#C8DEEE] hover:text-[#29D8FF] hover:border-[#29D8FF] active:scale-95 touch-manipulation transition-all text-xs font-mono font-medium cursor-pointer shadow-[0_0_12px_rgba(41,216,255,0.15)]"
            title="Инструкция по установке на ноутбук (Windows / macOS)"
          >
            <Laptop className="w-4 h-4 text-[#29D8FF] shrink-0" />
            <span className="hidden sm:inline">Ноутбук</span>
          </button>

          {/* Discord button - 44px+ touch target */}
          <button
            onClick={handleDiscordClick}
            className="flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 min-h-[44px] py-2.5 rounded-full bg-[#5865F2]/20 border border-[#5865F2]/40 text-[#E0E5FF] hover:bg-[#5865F2]/30 active:scale-95 touch-manipulation transition-all text-xs font-mono font-medium cursor-pointer shadow-[0_0_15px_rgba(88,101,242,0.2)]"
            title="Открыть Discord"
          >
            <svg className="w-4 h-4 fill-current text-[#7983F5] shrink-0" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
            <span>Discord</span>
          </button>

          {/* Toggle Log Terminal - 44px touch target */}
          {onToggleLog && (
            <button
              onClick={() => {
                triggerHaptic(15);
                onToggleLog();
              }}
              className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full border transition-colors active:scale-95 cursor-pointer ${
                isLogOpen
                  ? 'bg-[#0E2842] border-[#29D8FF]/50 text-[#29D8FF]'
                  : 'bg-[#071322] border-[#29D8FF]/20 text-[#839BB5] hover:text-[#EAF5FF]'
              }`}
              title={isLogOpen ? 'Скрыть журнал' : 'Показать журнал'}
            >
              <Terminal className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
