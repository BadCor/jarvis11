import React, { useState, useMemo } from 'react';
import {
  MessageSquare,
  Gamepad2,
  Video,
  Globe,
  Headphones,
  Calculator,
  FileText,
  Folder,
  Activity,
  Terminal,
  Settings,
  Camera,
  Palette,
  PlaySquare,
  Music,
  Film,
  Share2,
  GitBranch,
  ShoppingBag,
  ShoppingCart,
  Tag,
  Bot,
  Cpu,
  Sparkles,
  Search,
  Plus,
  Play,
  Trash2,
  Check,
  ExternalLink,
  Volume2,
  Volume1,
  Minimize2,
  Crop,
  BatteryCharging,
  Hand,
  XCircle,
} from 'lucide-react';
import { VoiceCommand, CommandCategory } from '../types/jarvis';

interface CommandCatalogProps {
  commands: VoiceCommand[];
  onExecuteCommand: (command: VoiceCommand) => void;
  onAddCustomCommand: (newCmd: Omit<VoiceCommand, 'id'>) => void;
  onDeleteCustomCommand: (id: string) => void;
}

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  MessageSquare,
  Gamepad2,
  Video,
  Globe,
  Headphones,
  Calculator,
  FileText,
  Folder,
  Activity,
  Terminal,
  Settings,
  Camera,
  Palette,
  PlaySquare,
  Music,
  Film,
  Share2,
  GitBranch,
  ShoppingBag,
  ShoppingCart,
  Tag,
  Bot,
  Cpu,
  Sparkles,
  Volume2,
  Volume1,
  Minimize2,
  Crop,
  BatteryCharging,
  Hand,
  XCircle,
};

export const CommandCatalog: React.FC<CommandCatalogProps> = ({
  commands,
  onExecuteCommand,
  onAddCustomCommand,
  onDeleteCustomCommand,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CommandCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddingCustom, setIsAddingCustom] = useState<boolean>(false);

  // New custom command form
  const [customName, setCustomName] = useState<string>('');
  const [customPhrase, setCustomPhrase] = useState<string>('');
  const [customValue, setCustomValue] = useState<string>('');
  const [customCategory, setCustomCategory] = useState<CommandCategory>('apps');

  const categories: { key: CommandCategory; label: string; count: number }[] = [
    { key: 'all', label: 'Все команды', count: commands.length },
    { key: 'apps', label: 'Windows Софт', count: commands.filter((c) => c.category === 'apps').length },
    { key: 'web', label: 'Сайты & Сервисы', count: commands.filter((c) => c.category === 'web').length },
    { key: 'ai', label: 'ИИ-платформы', count: commands.filter((c) => c.category === 'ai').length },
    { key: 'system', label: 'Система & Жесты', count: commands.filter((c) => c.category === 'system').length },
    { key: 'custom', label: 'Пользовательские', count: commands.filter((c) => c.isCustom).length },
  ];

  const filteredCommands = useMemo(() => {
    return commands.filter((cmd) => {
      const matchCategory =
        selectedCategory === 'all'
          ? true
          : selectedCategory === 'custom'
          ? cmd.isCustom
          : cmd.category === selectedCategory;

      if (!matchCategory) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const matchName = cmd.name.toLowerCase().includes(q);
      const matchPhrase = cmd.phrase.toLowerCase().includes(q);
      const matchTriggers = cmd.triggers.some((t) => t.toLowerCase().includes(q));
      const matchDesc = cmd.description.toLowerCase().includes(q);

      return matchName || matchPhrase || matchTriggers || matchDesc;
    });
  }, [commands, selectedCategory, searchQuery]);

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim() || !customPhrase.trim() || !customValue.trim()) return;

    onAddCustomCommand({
      name: customName.trim(),
      phrase: customPhrase.trim(),
      triggers: [customPhrase.trim().toLowerCase()],
      category: customCategory,
      iconName: 'Play',
      actionType: customValue.startsWith('http') ? 'web_open' : 'agent_command',
      commandValue: customValue.trim(),
      description: `Пользовательская команда для Windows: ${customValue.trim()}`,
      isCustom: true,
    });

    setCustomName('');
    setCustomPhrase('');
    setCustomValue('');
    setIsAddingCustom(false);
  };

  return (
    <div className="w-full">
      {/* Category Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[#071322] border border-[#29D8FF]/20 rounded-xl overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === cat.key
                  ? 'bg-[#29D8FF] text-[#050B14] font-semibold shadow-[0_0_12px_rgba(41,216,255,0.4)]'
                  : 'text-[#839BB5] hover:text-[#EAF5FF] hover:bg-[#0F2238]'
              }`}
            >
              {cat.label}
              <span className="ml-1.5 opacity-60 font-mono text-[10px]">({cat.count})</span>
            </button>
          ))}
        </div>

        {/* Search input & Add button */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#839BB5]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск команды или программы…"
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#071322] border border-[#29D8FF]/20 text-xs text-[#EAF5FF] placeholder-[#839BB5] focus:outline-none focus:border-[#29D8FF]"
            />
          </div>

          <button
            onClick={() => setIsAddingCustom(!isAddingCustom)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0E243A] border border-[#29D8FF]/30 text-xs text-[#29D8FF] hover:bg-[#153452] hover:border-[#29D8FF] transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Добавить</span>
          </button>
        </div>
      </div>

      {/* Add Custom Command Form */}
      {isAddingCustom && (
        <form
          onSubmit={handleCreateCustom}
          className="mb-4 p-4 rounded-xl hud-panel border border-[#29D8FF]/40 bg-[#0B1E33]/90 shadow-xl"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[#EAF5FF] font-hud tracking-wide">
              Создать свою команду для Windows
            </h3>
            <button
              type="button"
              onClick={() => setIsAddingCustom(false)}
              className="text-xs text-[#839BB5] hover:text-[#EAF5FF] cursor-pointer"
            >
              Отмена
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <div>
              <label className="block text-[11px] font-mono text-[#839BB5] mb-1">
                Название кнопки
              </label>
              <input
                type="text"
                required
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Например: VS Code"
                className="w-full px-3 py-1.5 rounded bg-[#071322] border border-[#29D8FF]/20 text-xs text-[#EAF5FF] focus:outline-none focus:border-[#29D8FF]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-[#839BB5] mb-1">
                Голосовая фраза
              </label>
              <input
                type="text"
                required
                value={customPhrase}
                onChange={(e) => setCustomPhrase(e.target.value)}
                placeholder="«Открой код»"
                className="w-full px-3 py-1.5 rounded bg-[#071322] border border-[#29D8FF]/20 text-xs text-[#EAF5FF] focus:outline-none focus:border-[#29D8FF]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-[#839BB5] mb-1">
                Исполняемая команда или URL
              </label>
              <input
                type="text"
                required
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                placeholder="code.exe или https://..."
                className="w-full px-3 py-1.5 rounded bg-[#071322] border border-[#29D8FF]/20 text-xs text-[#EAF5FF] focus:outline-none focus:border-[#29D8FF]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#839BB5]">Категория:</span>
              {(['apps', 'web', 'ai', 'system'] as CommandCategory[]).map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCustomCategory(cat)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase cursor-pointer ${
                    customCategory === cat
                      ? 'bg-[#29D8FF] text-[#050B14] font-semibold'
                      : 'bg-[#071322] text-[#839BB5] hover:text-[#EAF5FF]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-[#29D8FF] text-[#050B14] font-semibold text-xs hover:bg-[#76ECFF] transition-colors cursor-pointer"
            >
              Сохранить команду
            </button>
          </div>
        </form>
      )}

      {/* Grid of Command Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filteredCommands.map((cmd) => {
          const IconComp = ICON_MAP[cmd.iconName] || Globe;
          return (
            <div
              key={cmd.id}
              className="group relative hud-panel rounded-xl p-3.5 flex flex-col justify-between hover:border-[#29D8FF]/60 hover:shadow-[0_0_20px_rgba(41,216,255,0.15)] transition-all duration-200"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-[#0F2238] border border-[#29D8FF]/30 text-[#29D8FF] group-hover:bg-[#29D8FF]/20 group-hover:border-[#29D8FF] transition-colors">
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-[#EAF5FF] group-hover:text-[#29D8FF] transition-colors">
                        {cmd.name}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[11px] text-[#839BB5] font-mono">
                        <span>{cmd.category}</span>
                        {cmd.isCustom && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-[#34D399]">пользовательская</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {cmd.isCustom && (
                    <button
                      onClick={() => onDeleteCustomCommand(cmd.id)}
                      className="text-[#839BB5] hover:text-red-400 p-1 transition-colors cursor-pointer"
                      title="Удалить команду"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-[#839BB5] line-clamp-2 mb-3">
                  {cmd.description}
                </p>
              </div>

              {/* Bottom trigger hint & Launch button */}
              <div className="pt-2 border-t border-[#29D8FF]/10 flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono text-[#76ECFF] truncate max-w-[170px]" title={cmd.phrase}>
                  «{cmd.phrase}»
                </span>

                <button
                  onClick={() => onExecuteCommand(cmd)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#0F263E] border border-[#29D8FF]/30 text-[#EAF5FF] group-hover:bg-[#29D8FF] group-hover:text-[#050B14] group-hover:font-semibold text-xs font-mono transition-all cursor-pointer whitespace-nowrap"
                  title={`Выполнить ${cmd.name}`}
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Старт</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredCommands.length === 0 && (
        <div className="p-8 text-center rounded-xl hud-panel border border-[#29D8FF]/20 text-[#839BB5]">
          <p className="text-sm">Команды по запросу «{searchQuery}» не найдены</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            className="mt-2 text-xs text-[#29D8FF] hover:underline cursor-pointer"
          >
            Сбросить фильтры
          </button>
        </div>
      )}
    </div>
  );
};
