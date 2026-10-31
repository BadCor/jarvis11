import React, { useState, useEffect } from 'react';
import { Shield, Radio, Terminal, HelpCircle, Download, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { AgentStatus } from '../types/jarvis';

interface HudHeaderProps {
  agentStatus: AgentStatus;
  latencyMs?: number;
  onOpenAgentModal: () => void;
  onOpenHelpModal: () => void;
  onRefreshAgent: () => void;
}

export const HudHeader: React.FC<HudHeaderProps> = ({
  agentStatus,
  latencyMs,
  onOpenAgentModal,
  onOpenHelpModal,
  onRefreshAgent,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');

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

  return (
    <header className="w-full border-b border-[#29D8FF]/20 bg-[#071322]/80 backdrop-blur-md px-4 sm:px-6 py-3 select-none">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand mark & Version */}
        <div className="flex items-center gap-3.5">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-[#0B1E33] border border-[#29D8FF]/50 shadow-[0_0_15px_rgba(41,216,255,0.25)]">
            <span className="font-hud font-bold text-lg text-[#29D8FF] tracking-wider">J</span>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#29D8FF] animate-ping opacity-75" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-hud font-bold text-xl sm:text-2xl tracking-[0.2em] text-[#EAF5FF] uppercase hud-glow-text">
                JARVIS
              </h1>
              <span className="text-[10px] font-mono tracking-widest px-1.5 py-0.5 rounded bg-[#29D8FF]/15 text-[#29D8FF] border border-[#29D8FF]/30">
                WIN·EDITION
              </span>
            </div>
            <p className="text-[11px] font-mono tracking-wider text-[#839BB5] uppercase">
              Локальный голосовой & жестовый пульт
            </p>
          </div>
        </div>

        {/* Central Live Clock & System Time */}
        <div className="hidden lg:flex flex-col items-center justify-center">
          <div className="text-xl font-mono font-bold tracking-widest text-[#29D8FF] tabular-nums">
            {timeStr || '12:00:00'}
          </div>
          <div className="text-[11px] font-mono tracking-wide text-[#839BB5]">
            {dateStr || '25 октября 2026'}
          </div>
        </div>

        {/* Connection status and actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Agent Connection Badge */}
          <button
            onClick={onOpenAgentModal}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
              agentStatus === 'connected'
                ? 'bg-[#064E3B]/40 border-[#10B981]/50 text-[#34D399] hover:bg-[#064E3B]/60'
                : 'bg-[#451A03]/40 border-[#F59E0B]/50 text-[#FBBF24] hover:bg-[#451A03]/60'
            }`}
            title="Нажмите для настройки и проверки связи с Windows Agent"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                agentStatus === 'connected'
                  ? 'bg-[#10B981] shadow-[0_0_8px_#10B981]'
                  : 'bg-[#F59E0B] animate-pulse'
              }`}
            />
            <span className="font-semibold tracking-wide">
              {agentStatus === 'connected' ? 'WIN BRIDGE: ONLINE' : 'BRIDGE: OFFLINE'}
            </span>
            {agentStatus === 'connected' && latencyMs !== undefined && (
              <span className="text-[10px] text-[#A7F3D0] opacity-80 tabular-nums">
                {latencyMs}ms
              </span>
            )}
          </button>

          {/* Quick Refresh Check */}
          <button
            onClick={onRefreshAgent}
            className="p-2 rounded-lg bg-[#0B1E33] border border-[#29D8FF]/25 text-[#839BB5] hover:text-[#29D8FF] hover:border-[#29D8FF]/50 transition-colors cursor-pointer"
            title="Проверить доступность Windows Agent (127.0.0.1:8765)"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Agent Script Setup Button */}
          <button
            onClick={onOpenAgentModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B1E33] border border-[#29D8FF]/40 text-xs font-mono text-[#EAF5FF] hover:bg-[#122B48] hover:border-[#29D8FF] transition-all cursor-pointer"
            title="Скачать или скопировать jarvis_bridge.py для Windows"
          >
            <Terminal className="w-3.5 h-3.5 text-[#29D8FF]" />
            <span className="hidden sm:inline">Скрипт Windows</span>
          </button>

          {/* Help Button */}
          <button
            onClick={onOpenHelpModal}
            className="p-2 rounded-lg bg-[#0B1E33] border border-[#29D8FF]/25 text-[#839BB5] hover:text-[#29D8FF] hover:border-[#29D8FF]/50 transition-colors cursor-pointer"
            title="Список команд и горячие клавиши"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
