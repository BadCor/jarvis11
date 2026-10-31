import React, { useState } from 'react';
import { X, Download, Copy, Check, Terminal, ExternalLink, RefreshCw, ShieldCheck, AlertCircle } from 'lucide-react';
import { AgentStatus } from '../types/jarvis';
import { PYTHON_BRIDGE_CODE, BAT_START_CODE } from '../lib/bridgeGenerator';

interface AgentBridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentStatus: AgentStatus;
  latencyMs?: number;
  agentUrl: string;
  onUpdateAgentUrl: (newUrl: string) => void;
  onTestConnection: () => Promise<void>;
}

export const AgentBridgeModal: React.FC<AgentBridgeModalProps> = ({
  isOpen,
  onClose,
  agentStatus,
  latencyMs,
  agentUrl,
  onUpdateAgentUrl,
  onTestConnection,
}) => {
  const [copiedPython, setCopiedPython] = useState<boolean>(false);
  const [copiedBat, setCopiedBat] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [editUrl, setEditUrl] = useState<string>(agentUrl);

  if (!isOpen) return null;

  const downloadFile = (filename: string, content: string, mimeType = 'text/plain') => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text: string, setFlag: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setFlag(true);
    setTimeout(() => setFlag(false), 2000);
  };

  const handleTest = async () => {
    setIsTesting(true);
    await onTestConnection();
    setIsTesting(false);
  };

  const handleSaveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateAgentUrl(editUrl.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto hud-panel rounded-2xl border border-[#29D8FF]/40 bg-[#071322] shadow-[0_0_50px_rgba(41,216,255,0.2)] p-5 sm:p-6 text-[#EAF5FF]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#29D8FF]/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#0F263E] border border-[#29D8FF]/40 text-[#29D8FF]">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-hud tracking-wide text-[#EAF5FF]">
                Связь с Windows: Локальный Агент
              </h2>
              <p className="text-xs font-mono text-[#839BB5]">
                Прямое управление операционной системой через локальный мост
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#839BB5] hover:text-[#EAF5FF] hover:bg-[#0F263E] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Alert Banner */}
        <div className="my-4 p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2.5">
            <span
              className={`w-3 h-3 rounded-full shrink-0 ${
                agentStatus === 'connected'
                  ? 'bg-[#10B981] shadow-[0_0_10px_#10B981]'
                  : 'bg-[#F59E0B] animate-pulse'
              }`}
            />
            <div>
              <div className="font-semibold text-sm">
                {agentStatus === 'connected' ? 'Статус: ПОДКЛЮЧЕНО К WINDOWS' : 'Статус: АГЕНТ НЕ ОБНАРУЖЕН'}
              </div>
              <div className="text-[11px] text-[#839BB5] mt-0.5">
                {agentStatus === 'connected'
                  ? `Агент активен на ${agentUrl} (задержка: ${latencyMs ?? 5} мс)`
                  : 'Запустите скрипт jarvis_bridge.py на компьютере'}
              </div>
            </div>
          </div>

          <button
            onClick={handleTest}
            disabled={isTesting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F263E] border border-[#29D8FF]/30 text-[#29D8FF] hover:bg-[#1A3859] transition-all cursor-pointer whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
            <span>Проверить пинг</span>
          </button>
        </div>

        {/* Quick 3-Step Setup */}
        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-xl bg-[#091829] border border-[#29D8FF]/20 space-y-3">
            <h3 className="font-semibold text-sm text-[#29D8FF] font-hud uppercase tracking-wider">
              Инструкция по запуску на Windows (3 шага):
            </h3>

            <div className="space-y-2 text-[#C8DEEE] leading-relaxed">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#29D8FF]/20 text-[#29D8FF] font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                  1
                </span>
                <span>
                  Скачайте файлы <strong className="text-white">jarvis_bridge.py</strong> и{' '}
                  <strong className="text-white">start_jarvis.bat</strong> с помощью кнопок ниже (сохраните в любую удобную папку).
                </span>
              </div>

              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#29D8FF]/20 text-[#29D8FF] font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                  2
                </span>
                <span>
                  Запустите двойным кликом <strong className="text-white">start_jarvis.bat</strong>. Откроется черная консоль, которая запустит локальный сервер на порту <code className="text-[#29D8FF]">8765</code> с включенным CORS.
                </span>
              </div>

              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#29D8FF]/20 text-[#29D8FF] font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                  3
                </span>
                <span>
                  Готово! Веб-пульт сразу отобразит зелёный статус <strong className="text-[#34D399]">ONLINE</strong>. Все голосовые команды и кнопки будут мгновенно открывать приложения и сайты в вашей Windows.
                </span>
              </div>
            </div>

            {/* Action Buttons: Download and Copy */}
            <div className="pt-2 flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => downloadFile('jarvis_bridge.py', PYTHON_BRIDGE_CODE, 'text/x-python')}
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#29D8FF] text-[#050B14] font-semibold hover:bg-[#76ECFF] transition-all cursor-pointer shadow-[0_0_15px_rgba(41,216,255,0.3)]"
              >
                <Download className="w-4 h-4" />
                <span>Скачать jarvis_bridge.py</span>
              </button>

              <button
                onClick={() => downloadFile('start_jarvis.bat', BAT_START_CODE, 'application/x-bat')}
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#0F2842] border border-[#29D8FF]/40 text-[#EAF5FF] hover:bg-[#183B5E] transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Скачать start_jarvis.bat</span>
              </button>

              <button
                onClick={() => copyToClipboard(PYTHON_BRIDGE_CODE, setCopiedPython)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#0A1A2C] border border-[#29D8FF]/20 text-[#839BB5] hover:text-[#29D8FF] transition-colors cursor-pointer"
                title="Скопировать исходный код скрипта"
              >
                {copiedPython ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedPython ? 'Скопировано!' : 'Копировать Python'}</span>
              </button>
            </div>
          </div>

          {/* Config URL */}
          <form onSubmit={handleSaveUrl} className="p-3.5 rounded-xl bg-[#091524] border border-[#29D8FF]/15 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div>
              <label className="block text-[11px] font-mono text-[#839BB5]">
                Адрес локального агента (URL):
              </label>
              <p className="text-[10px] text-[#5A7490]">
                По умолчанию порт 8765 на localhost
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
                className="px-3 py-1.5 rounded bg-[#050B14] border border-[#29D8FF]/30 text-xs font-mono text-[#EAF5FF] w-48 focus:outline-none focus:border-[#29D8FF]"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded bg-[#0F2842] border border-[#29D8FF]/30 text-xs font-mono text-[#29D8FF] hover:bg-[#153456] transition-colors cursor-pointer"
              >
                Применить
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
