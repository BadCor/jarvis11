import React from 'react';
import { Send, Play, MicOff, Clock, Smile, Sparkles } from 'lucide-react';

interface CommandChipsProps {
  onRun: (command: string) => void;
}

const CHIPS = [
  { text: '«Открой Discord»', command: 'открой дискорд', icon: Send, primary: true },
  { text: '«Открой YouTube»', command: 'открой ютуб', icon: Play, primary: false },
  { text: '«Выключи микрофон»', command: 'выключи микрофон', icon: MicOff, primary: false },
  { text: '«Который час?»', command: 'который час', icon: Clock, primary: false },
  { text: '«Расскажи шутку»', command: 'расскажи анекдот', icon: Smile, primary: false },
];

import { triggerHaptic } from '../lib/jarvisVoiceClips';

export const CommandChips: React.FC<CommandChipsProps> = ({ onRun }) => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 max-w-2xl mx-auto px-2 sm:px-4">
      {CHIPS.map(({ text, command, icon: Icon, primary }) => (
        <button
          key={command}
          type="button"
          onClick={() => {
            triggerHaptic(15);
            onRun(command);
          }}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-mono transition-all duration-150 active:scale-95 touch-manipulation cursor-pointer ${
            primary
              ? 'bg-[#5865F2]/25 border border-[#5865F2]/50 text-[#E0E5FF] hover:bg-[#5865F2] hover:text-white shadow-[0_0_12px_rgba(88,101,242,0.3)]'
              : 'bg-[#0B1E33]/70 border border-[#29D8FF]/20 text-[#839BB5] hover:text-[#EAF5FF] hover:border-[#29D8FF]/50 hover:bg-[#122A44]'
          }`}
        >
          <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#29D8FF]" />
          <span>{text}</span>
        </button>
      ))}
    </div>
  );
};
