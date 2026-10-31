import React, { useState } from 'react';
import { Laptop, Monitor, Download, Check, Sparkles, X, Chrome, Compass, ExternalLink, ShieldCheck } from 'lucide-react';
import { triggerHaptic } from '../lib/jarvisVoiceClips';

interface LaptopInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LaptopInstallModal: React.FC<LaptopInstallModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'windows' | 'mac' | 'pwa'>('windows');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl hud-panel rounded-2xl border border-[#29D8FF]/40 bg-[#071322] shadow-[0_0_50px_rgba(41,216,255,0.25)] p-4 sm:p-6 text-[#EAF5FF] overflow-hidden max-h-[90dvh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#29D8FF]/20 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#0B1E33] border border-[#29D8FF]/40 text-[#29D8FF]">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-hud tracking-wide text-[#EAF5FF]">
                Установка JARVIS на ноутбук / ПК
              </h2>
              <p className="text-[11px] font-mono text-[#839BB5]">
                Windows 10/11, macOS и ChromeOS — в 1 клик
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic(15);
              onClose();
            }}
            className="p-1.5 rounded-lg text-[#839BB5] hover:text-[#EAF5FF] hover:bg-[#0F263E] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1.5 p-1 my-3.5 bg-[#050B14] rounded-xl border border-[#29D8FF]/20 shrink-0">
          <button
            onClick={() => setActiveTab('windows')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
              activeTab === 'windows'
                ? 'bg-[#29D8FF] text-[#050B14] font-semibold shadow-[0_0_12px_rgba(41,216,255,0.3)]'
                : 'text-[#839BB5] hover:text-[#EAF5FF]'
            }`}
          >
            Windows 10/11
          </button>
          <button
            onClick={() => setActiveTab('mac')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
              activeTab === 'mac'
                ? 'bg-[#29D8FF] text-[#050B14] font-semibold shadow-[0_0_12px_rgba(41,216,255,0.3)]'
                : 'text-[#839BB5] hover:text-[#EAF5FF]'
            }`}
          >
            macOS (MacBook)
          </button>
          <button
            onClick={() => setActiveTab('pwa')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
              activeTab === 'pwa'
                ? 'bg-[#29D8FF] text-[#050B14] font-semibold shadow-[0_0_12px_rgba(41,216,255,0.3)]'
                : 'text-[#839BB5] hover:text-[#EAF5FF]'
            }`}
          >
            PWA в браузере
          </button>
        </div>

        {/* Tab Content */}
        <div className="overflow-y-auto pr-1 space-y-3.5 text-xs font-mono flex-1">
          {activeTab === 'windows' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-[#0B1E33]/90 border border-[#29D8FF]/25">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#29D8FF] font-hud mb-1.5">
                  <Monitor className="w-4 h-4" />
                  <span>Способ 1: Установка как отдельного Windows-приложения (PWA)</span>
                </div>
                <p className="text-[#C8DEEE] text-[11px] leading-relaxed mb-2.5">
                  Самый удобный способ. Приложение будет открываться из меню «Пуск» или с рабочего стола в отдельном футуристичном окне без рамок браузера:
                </p>
                <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-[#839BB5]">
                  <li>
                    Откройте эту страницу в <strong className="text-white">Google Chrome</strong> или <strong className="text-white">Microsoft Edge</strong> на вашем ноутбуке.
                  </li>
                  <li>
                    В правом углу адресной строки появится иконка <strong className="text-[#29D8FF]">компьютера со стрелочкой (Установить JARVIS)</strong>.
                  </li>
                  <li>
                    Нажмите «Установить» — иконка Джарвиса появится на панели задач и рабочем столе ноутбука!
                  </li>
                </ol>
              </div>

              <div className="p-3.5 rounded-xl bg-[#091829] border border-[#29D8FF]/20">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#10B981] font-hud mb-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Калибровка микрофона ноутбука:</span>
                </div>
                <p className="text-[#839BB5] text-[11px] leading-relaxed">
                  Встроенные микрофоны ноутбуков часто захватывают шум вентиляторов. Для идеальной слышимости Джарвис автоматически включает программное шумоподавление и эхоподавление (Acoustic Echo Cancellation + Noise Suppression). Вы также можете просто нажать на сферу в центре экрана, если вокруг шумно.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'mac' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-[#0B1E33]/90 border border-[#29D8FF]/25">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#29D8FF] font-hud mb-1.5">
                  <Compass className="w-4 h-4" />
                  <span>Для MacBook (Safari или Chrome)</span>
                </div>
                <p className="text-[#C8DEEE] text-[11px] leading-relaxed mb-2.5">
                  В macOS Sonoma и новее любое веб-приложение превращается в нативное приложение в Dock:
                </p>
                <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-[#839BB5]">
                  <li>В Safari нажмите в верхнем меню: <strong className="text-white">Файл → Добавить в Dock</strong>.</li>
                  <li>Или в Chrome нажмите в правом верхнем углу меню: <strong className="text-white">Сохранить и поделиться → Установить приложение JARVIS</strong>.</li>
                  <li>Приложение сразу появится в Dock и Launchpad как самостоятельная программа.</li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'pwa' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-[#0B1E33]/90 border border-[#29D8FF]/25">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#29D8FF] font-hud mb-1.5">
                  <Chrome className="w-4 h-4" />
                  <span>Работа прямо в браузере (без установки)</span>
                </div>
                <p className="text-[#C8DEEE] text-[11px] leading-relaxed">
                  JARVIS работает прямо по этой веб-ссылке на любом ноутбуке, планшете или телефоне. Все звуковые файлы Джарвиса, синтез речи и распознавание жестов с веб-камеры уже встроены и не требуют установки дополнительных программ.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#29D8FF]/20 flex items-center justify-between shrink-0">
          <span className="text-[10px] text-[#839BB5]">
            Поддерживаются Chrome, Edge, Safari, Opera
          </span>
          <button
            onClick={() => {
              triggerHaptic(15);
              onClose();
            }}
            className="px-4 py-1.5 rounded-lg bg-[#29D8FF] text-[#050B14] font-semibold text-xs hover:bg-[#76ECFF] transition-all cursor-pointer"
          >
            Понятно
          </button>
        </div>
      </div>
    </div>
  );
};
