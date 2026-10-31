import React, { useRef, useEffect } from 'react';
import { Terminal, Trash2, Shield, Activity, Radio } from 'lucide-react';
import { ActivityEvent } from '../types/jarvis';

interface ActivityLogProps {
  events: ActivityEvent[];
  onClear: () => void;
}

export const ActivityLog: React.FC<ActivityLogProps> = ({ events, onClear }) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  const getTypeStyle = (type: ActivityEvent['type'], status?: ActivityEvent['status']) => {
    if (status === 'error' || type === 'agent_error') {
      return 'text-red-400 border-red-500/30 bg-red-950/20';
    }
    if (status === 'warning') {
      return 'text-[#F59E0B] border-[#F59E0B]/30 bg-[#451A03]/20';
    }
    if (type === 'voice_heard') {
      return 'text-[#76ECFF] border-[#29D8FF]/20 bg-[#071F33]/30';
    }
    if (type === 'gesture_detected') {
      return 'text-[#34D399] border-[#10B981]/20 bg-[#064E3B]/20';
    }
    if (type === 'agent_success') {
      return 'text-[#10B981] border-[#10B981]/20 bg-[#064E3B]/20';
    }
    return 'text-[#839BB5] border-[#29D8FF]/10 bg-[#081524]/20';
  };

  return (
    <div className="hud-panel rounded-xl overflow-hidden flex flex-col h-72 sm:h-80 border border-[#29D8FF]/25 shadow-xl">
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-[#061220] border-b border-[#29D8FF]/20 text-xs font-mono">
        <div className="flex items-center gap-2 text-[#29D8FF]">
          <Terminal className="w-3.5 h-3.5" />
          <span className="font-semibold tracking-wider uppercase">Журнал команд & телеметрии</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] text-[#839BB5] tabular-nums">
            Событий: {events.length}
          </span>
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-[11px] text-[#839BB5] hover:text-[#29D8FF] transition-colors cursor-pointer"
            title="Очистить терминал"
          >
            <Trash2 className="w-3 h-3" />
            <span>Очистить</span>
          </button>
        </div>
      </div>

      {/* Events Stream */}
      <div
        ref={scrollRef}
        className="flex-1 p-3 overflow-y-auto space-y-2 font-mono text-xs select-text"
      >
        {events.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[#839BB5] text-xs">
            › Ожидание голосовых команд, жестов или кликов…
          </div>
        ) : (
          events.map((ev) => (
            <div
              key={ev.id}
              className={`p-2 rounded border transition-all ${getTypeStyle(ev.type, ev.status)}`}
            >
              <div className="flex items-center justify-between text-[10px] opacity-75 mb-0.5">
                <span className="uppercase font-semibold tracking-wider">
                  [{ev.source}] · {ev.type.replace('_', ' ')}
                </span>
                <span className="tabular-nums">{ev.timestamp}</span>
              </div>
              <div className="font-medium text-xs leading-relaxed">
                {ev.title}
              </div>
              {ev.detail && (
                <div className="text-[11px] opacity-80 mt-0.5 pl-2 border-l border-current/30">
                  {ev.detail}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
