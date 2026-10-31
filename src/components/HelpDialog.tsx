import React from 'react';
import { X, Mic, Hand, Keyboard, Sparkles, CheckCircle2 } from 'lucide-react';

interface HelpDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpDialog: React.FC<HelpDialogProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto hud-panel rounded-2xl border border-[#29D8FF]/40 bg-[#071322] shadow-[0_0_50px_rgba(41,216,255,0.2)] p-5 sm:p-6 text-[#EAF5FF]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#29D8FF]/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#0F263E] border border-[#29D8FF]/40 text-[#29D8FF]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-hud tracking-wide text-[#EAF5FF]">
                Справка по командам JARVIS
              </h2>
              <p className="text-xs font-mono text-[#839BB5]">
                Голосовые фразы, жесты и управление системой
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

        <div className="my-4 space-y-4 text-xs font-mono">
          {/* Voice Wake Word */}
          <div className="p-3.5 rounded-xl bg-[#0B1E33] border border-[#29D8FF]/20">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#29D8FF] mb-2 font-hud">
              <Mic className="w-4 h-4" />
              <span>Голосовая активация</span>
            </div>
            <p className="text-[#C8DEEE] leading-relaxed mb-2">
              Вы можете сказать <strong className="text-[#29D8FF]">«Джарвис»</strong> (а затем команду), либо назвать команду слитно: <strong className="text-white">«Джарвис открой стим»</strong> или просто нажать на сферу в центре экрана.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-[#839BB5]">
              <div className="p-2 rounded bg-[#061220] border border-[#29D8FF]/10">
                • «Открой Телеграм / Телеге»
              </div>
              <div className="p-2 rounded bg-[#061220] border border-[#29D8FF]/10">
                • «Открой Стим / Steam»
              </div>
              <div className="p-2 rounded bg-[#061220] border border-[#29D8FF]/10">
                • «Открой OBS / Стрим»
              </div>
              <div className="p-2 rounded bg-[#061220] border border-[#29D8FF]/10">
                • «Открой Чат ГПТ / Дипсик / Клод»
              </div>
              <div className="p-2 rounded bg-[#061220] border border-[#29D8FF]/10">
                • «Открой Ютуб / Яндекс Музыку»
              </div>
              <div className="p-2 rounded bg-[#061220] border border-[#29D8FF]/10">
                • «Сверни всё / Рабочий стол»
              </div>
              <div className="p-2 rounded bg-[#061220] border border-[#29D8FF]/10">
                • «Прибавь звук / Сделай тише»
              </div>
              <div className="p-2 rounded bg-[#061220] border border-[#29D8FF]/10">
                • «Сколько батареи? / Заряд»
              </div>
            </div>
          </div>

          {/* Camera Gestures */}
          <div className="p-3.5 rounded-xl bg-[#0B1E33] border border-[#29D8FF]/20">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#29D8FF] mb-2 font-hud">
              <Hand className="w-4 h-4" />
              <span>Бесконтактные жесты с веб-камеры</span>
            </div>
            <p className="text-[#C8DEEE] leading-relaxed mb-2">
              Включите мини-окно камеры в правом нижнем углу и покажите жест руке перед камерой на 0.75 сек:
            </p>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between p-2 rounded bg-[#061220] border border-[#29D8FF]/10">
                <span className="text-[#EAF5FF]">🖐️ Открытая ладонь</span>
                <span className="text-[#34D399]">Активация ассистента / Развернуть</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-[#061220] border border-[#29D8FF]/10">
                <span className="text-[#EAF5FF]">✊ Сжатый кулак</span>
                <span className="text-[#FBBF24]">Свернуть все окна (Win + D) / Пауза</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-[#061220] border border-[#29D8FF]/10">
                <span className="text-[#EAF5FF]">✌️ Знак победы (V)</span>
                <span className="text-[#29D8FF]">Смена вкладки / Переключение сервиса</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-[#061220] border border-[#29D8FF]/10">
                <span className="text-[#EAF5FF]">☝️ Указательный палец</span>
                <span className="text-[#76ECFF]">Выбор первого элемента / Клик</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-[#061220] border border-[#29D8FF]/10">
                <span className="text-[#EAF5FF]">👍 Большой палец вверх</span>
                <span className="text-[#10B981]">Запуск приоритетного приложения (YouTube / TG)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#29D8FF] text-[#050B14] font-semibold text-xs hover:bg-[#76ECFF] transition-all cursor-pointer"
          >
            Понятно
          </button>
        </div>
      </div>
    </div>
  );
};
