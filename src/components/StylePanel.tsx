import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';
import type { DiagramStyle } from '../types/style';
import { DEFAULT_STYLE } from '../types/style';
import type { CustomFont } from '../types/font';
import type { CustomIcon } from '../types/icon';
import { SNIPPET_GROUPS } from '../data/snippets';

interface Props {
  activeStyle: DiagramStyle;
  allStyles: DiagramStyle[];
  customFont: CustomFont | null;
  actorIcon: CustomIcon | null;
  onSelect: (style: DiagramStyle) => void;
  onUpdate: (patch: Partial<DiagramStyle>) => void;
  onSave: (style: DiagramStyle) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onLoadFont: (file: File) => Promise<CustomFont>;
  onRemoveFont: () => void;
  onLoadActorIcon: (file: File) => Promise<CustomIcon>;
  onRemoveActorIcon: () => void;
  onInsertSnippet: (code: string) => void;
  onRestorePresets: () => void;
}

const SYSTEM_FONTS = ['CoFo Redmadrobot Regular', 'CoFo Sans Regular'];

function FontSelect({ value, customFont, onChange, includeEmpty = false }: {
  value: string;
  customFont: CustomFont | null;
  onChange: (v: string) => void;
  includeEmpty?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="flex-1 min-w-0 text-xs bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-1.5 py-1 text-gray-700 dark:text-gray-200 outline-none focus:border-indigo-400"
    >
      {includeEmpty && <option value="">(по умолчанию)</option>}
      {SYSTEM_FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
      {customFont && <option value={customFont.name}>{customFont.name}</option>}
    </select>
  );
}

function FontRow({
  label, fontName, customFont, onFontName,
}: {
  label: string;
  fontName: string;
  customFont: CustomFont | null;
  onFontName: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-gray-400 dark:text-gray-500">{label}</p>
      <FontSelect value={fontName} customFont={customFont} onChange={onFontName} includeEmpty />
    </div>
  );
}

function CollapsibleSection({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <section>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between py-1 mb-1 group"
      >
        <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
          {title}
        </span>
        <svg
          className={`w-3 h-3 text-gray-400 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="mt-2">{children}</div>}
    </section>
  );
}

function ColorField({ label, value, onChange, optional }: { label: string; value: string; onChange: (v: string) => void; optional?: boolean }) {
  const isEmpty = optional && !value;
  return (
    <div className="flex items-center justify-between gap-2">
      <label className="text-xs text-gray-500 dark:text-gray-400 truncate flex-1">{label}</label>
      <div className="flex items-center gap-1.5">
        {isEmpty ? (
          <>
            <span className="text-xs text-gray-400 dark:text-gray-500 italic">не задан</span>
            <button
              onClick={() => onChange('#000000')}
              className="text-xs px-1.5 py-0.5 rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400"
            >+</button>
          </>
        ) : (
          <>
            <input
              type="color"
              value={value || '#000000'}
              onChange={(e) => onChange(e.target.value)}
              className="w-7 h-7 rounded cursor-pointer border border-gray-300 dark:border-gray-600 bg-transparent"
            />
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-20 text-xs bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-1.5 py-1 text-gray-700 dark:text-gray-200 font-mono"
            />
            {optional && (
              <button
                onClick={() => onChange('')}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs leading-none"
                title="Сбросить"
              >×</button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const BUILT_IN_IDS = new Set(['default', 'rmr-1', 'rmr-2', 'rmr-3', 'rmr-4']);

export function StylePanel({
  activeStyle, allStyles, customFont, actorIcon,
  onSelect, onUpdate, onSave, onDelete, onRename, onLoadFont, onRemoveFont,
  onLoadActorIcon, onRemoveActorIcon, onInsertSnippet, onRestorePresets,
}: Props) {
  const [tab, setTab] = useState<'presets' | 'edit' | 'snippets'>('presets');
  const [saveName, setSaveName] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [fontError, setFontError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const iconInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId) renameInputRef.current?.select();
  }, [editingId]);

  const startRename = (style: DiagramStyle) => {
    setEditingId(style.id);
    setEditingName(style.name);
  };

  const commitRename = () => {
    if (editingId && editingName.trim()) onRename(editingId, editingName.trim());
    setEditingId(null);
  };

  const handleSave = () => {
    if (!saveName.trim()) return;
    onSave({ ...activeStyle, id: `custom-${Date.now()}`, name: saveName.trim() });
    setSaveName('');
    setShowSaveForm(false);
  };


  const handleFontFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFontError(null);
    try {
      const font = await onLoadFont(file);
      onUpdate({ fontName: font.name });
    } catch {
      setFontError('Не удалось загрузить шрифт');
    }
    e.target.value = '';
  };

  const handleIconFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await onLoadActorIcon(file);
    } catch {
      // silently ignore
    }
    e.target.value = '';
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200">
      <div className="flex border-b border-gray-200 dark:border-gray-700 shrink-0">
        <button
          onClick={() => setTab('presets')}
          className={`flex-1 py-2 text-xs font-medium transition-colors ${tab === 'presets' ? 'text-gray-900 border-b-2 border-indigo-500 dark:text-white dark:border-indigo-400' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'}`}
        >
          Пресеты
        </button>
        <button
          onClick={() => setTab('edit')}
          className={`flex-1 py-2 text-xs font-medium transition-colors ${tab === 'edit' ? 'text-gray-900 border-b-2 border-indigo-500 dark:text-white dark:border-indigo-400' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'}`}
        >
          Редактор
        </button>
        <button
          onClick={() => setTab('snippets')}
          className={`flex-1 py-2 text-xs font-medium transition-colors ${tab === 'snippets' ? 'text-gray-900 border-b-2 border-indigo-500 dark:text-white dark:border-indigo-400' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'}`}
        >
          Сниппеты
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === 'presets' && (
          <div className="p-3 space-y-1.5">
            {allStyles.map((style) => (
              <div
                key={style.id}
                className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${activeStyle.id === style.id ? 'bg-indigo-600' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                onClick={() => { if (editingId !== style.id) onSelect(style); }}
                onDoubleClick={() => startRename(style)}
              >
                <div className="flex gap-0.5 shrink-0">
                  <div className="w-3 h-3 rounded-sm border border-gray-300 dark:border-gray-600" style={{ background: style.backgroundColor }} />
                  <div className="w-3 h-3 rounded-sm border border-gray-300 dark:border-gray-600" style={{ background: style.primaryColor }} />
                  <div className="w-3 h-3 rounded-sm border border-gray-300 dark:border-gray-600" style={{ background: style.lineColor }} />
                </div>
                {editingId === style.id ? (
                  <input
                    ref={renameInputRef}
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitRename();
                      if (e.key === 'Escape') setEditingId(null);
                      e.stopPropagation();
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs bg-transparent outline outline-1 outline-white/40 rounded px-0.5 flex-1 min-w-0 text-white"
                  />
                ) : (
                  <span className="text-xs flex-1 truncate">{style.name}</span>
                )}
                {!BUILT_IN_IDS.has(style.id) && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(style.id); }}
                    className="text-gray-500 hover:text-red-400 text-xs px-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Удалить"
                  >✕</button>
                )}
              </div>
            ))}
            <button
              onClick={onRestorePresets}
              className="w-full mt-2 py-1 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              Восстановить стандартные
            </button>
          </div>
        )}

        {tab === 'snippets' && (
          <div className="p-3 space-y-4">
            {SNIPPET_GROUPS.map((group) => (
              <div key={group.title}>
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">{group.title}</p>
                <div className="space-y-1">
                  {group.items.map((snippet) => (
                    <button
                      key={snippet.label}
                      onClick={() => onInsertSnippet(snippet.code)}
                      className="w-full text-left px-2.5 py-2 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors group"
                    >
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white">{snippet.label}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400 mt-0.5">{snippet.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'edit' && (
          <div className="p-3 space-y-4">
            {/* Colors */}
            <CollapsibleSection title="Цвета">
              <div className="space-y-2">
                <ColorField label="Фон диаграммы" value={activeStyle.backgroundColor} onChange={(v) => onUpdate({ backgroundColor: v })} />
                <ColorField label="Сущности (фон)" value={activeStyle.primaryColor} onChange={(v) => onUpdate({ primaryColor: v })} />
                <ColorField label="Примечания (фон)" value={activeStyle.noteColor} onChange={(v) => onUpdate({ noteColor: v })} />
                <ColorField label="Боксы (фон)" value={activeStyle.boxColor} onChange={(v) => onUpdate({ boxColor: v })} />
                <ColorField label="Боксы (текст)" value={activeStyle.boxTitleColor} onChange={(v) => onUpdate({ boxTitleColor: v })} />
                <ColorField label="Боксы (контур)" value={activeStyle.boxBorderColor} onChange={(v) => onUpdate({ boxBorderColor: v })} optional />
                <ColorField label="Разделитель (фон)" value={activeStyle.dividerColor} onChange={(v) => onUpdate({ dividerColor: v })} />
                <ColorField label="Группы alt/opt/loop" value={activeStyle.tertiaryColor} onChange={(v) => onUpdate({ tertiaryColor: v })} />
                <ColorField label="Стрелки и линии" value={activeStyle.lineColor} onChange={(v) => onUpdate({ lineColor: v })} />
                <ColorField label="Рамки сущностей" value={activeStyle.entityBorderColor} onChange={(v) => onUpdate({ entityBorderColor: v })} optional />
                <ColorField label="Текст" value={activeStyle.textColor} onChange={(v) => onUpdate({ textColor: v })} />
                <ColorField label="Текст сущностей" value={activeStyle.participantTextColor} onChange={(v) => onUpdate({ participantTextColor: v })} optional />
              </div>
            </CollapsibleSection>

            {/* Typography */}
            <CollapsibleSection title="Типографика">
              <div className="space-y-2">

                {/* Font name field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs text-gray-500 dark:text-gray-400 shrink-0">Шрифт</label>
                    <FontSelect
                      value={activeStyle.fontName}
                      customFont={customFont}
                      onChange={(v) => onUpdate({ fontName: v })}
                    />
                  </div>

                  {/* Custom font section */}
                  {customFont ? (
                    <div className="flex items-center gap-2 px-2 py-1.5 bg-indigo-50 border border-indigo-200 dark:bg-indigo-900/40 dark:border-indigo-700/50 rounded-md">
                      <svg className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-xs text-indigo-700 dark:text-indigo-300 flex-1 truncate" title={customFont.fileName}>
                        {customFont.fileName}
                      </span>
                      <button
                        onClick={onRemoveFont}
                        className="text-gray-500 hover:text-red-400 text-xs shrink-0 transition-colors"
                        title="Удалить шрифт"
                      >✕</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-1.5 text-xs rounded border border-dashed border-gray-300 dark:border-gray-600 hover:border-indigo-500 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Загрузить файл шрифта
                    </button>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".ttf,.otf,.woff,.woff2"
                    className="hidden"
                    onChange={handleFontFile}
                  />
                  {fontError && <p className="text-xs text-red-400">{fontError}</p>}
                </div>

                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs text-gray-500 dark:text-gray-400">Размер ({activeStyle.fontSize}px)</label>
                  <input
                    type="range" min={10} max={24} value={activeStyle.fontSize}
                    onChange={(e) => onUpdate({ fontSize: +e.target.value })}
                    className="w-32 accent-indigo-400"
                  />
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700/60 pt-2 space-y-3">
                  <FontRow
                    label="Сущности"
                    fontName={activeStyle.participantFontName}
                    customFont={customFont}
                    onFontName={(v) => onUpdate({ participantFontName: v })}
                  />
                  <FontRow
                    label="Сообщения"
                    fontName={activeStyle.messageFontName}
                    customFont={customFont}
                    onFontName={(v) => onUpdate({ messageFontName: v })}
                  />
                  <FontRow
                    label="Примечания"
                    fontName={activeStyle.noteFontName}
                    customFont={customFont}
                    onFontName={(v) => onUpdate({ noteFontName: v })}
                  />
                  <FontRow
                    label="Заголовок / боксы"
                    fontName={activeStyle.titleFontName}
                    customFont={customFont}
                    onFontName={(v) => onUpdate({ titleFontName: v })}
                  />
                </div>
              </div>
            </CollapsibleSection>

            {/* Icons */}
            <CollapsibleSection title="Иконки">
              <div className="space-y-1.5">
                {/* Actor */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400 w-16 shrink-0">Actor</span>
                  {actorIcon ? (
                    <div className="flex items-center gap-1.5 flex-1 min-w-0 px-1.5 py-1 bg-indigo-50 border border-indigo-200 dark:bg-indigo-900/40 dark:border-indigo-700/50 rounded">
                      <img src={actorIcon.dataUrl} alt="actor" className="w-5 h-5 object-contain shrink-0" />
                      <span className="text-xs text-indigo-700 dark:text-indigo-300 flex-1 truncate min-w-0" title={actorIcon.fileName}>
                        {actorIcon.fileName}
                      </span>
                      <button
                        onClick={onRemoveActorIcon}
                        className="text-gray-500 hover:text-red-400 text-xs shrink-0 transition-colors"
                        title="Удалить"
                      >✕</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => iconInputRef.current?.click()}
                      className="flex-1 py-1 text-xs rounded border border-dashed border-gray-300 dark:border-gray-600 hover:border-indigo-500 text-gray-500 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
                    >
                      + загрузить
                    </button>
                  )}
                  <input
                    ref={iconInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
                    className="hidden"
                    onChange={handleIconFile}
                  />
                </div>
                {/* future entity types go here */}
              </div>
            </CollapsibleSection>

            {/* Shape */}
            <CollapsibleSection title="Форма">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs text-gray-500 dark:text-gray-400">Скругление ({activeStyle.roundCorner})</label>
                  <input
                    type="range" min={0} max={25} value={activeStyle.roundCorner}
                    onChange={(e) => onUpdate({ roundCorner: +e.target.value })}
                    className="w-32 accent-indigo-400"
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs text-gray-500 dark:text-gray-400">Толщина рамки ({activeStyle.borderThickness})</label>
                  <input
                    type="range" min={0.5} max={5} step={0.5} value={activeStyle.borderThickness}
                    onChange={(e) => onUpdate({ borderThickness: +e.target.value })}
                    className="w-32 accent-indigo-400"
                  />
                </div>
              </div>
            </CollapsibleSection>

            {/* Lines & Arrows */}
            <CollapsibleSection title="Линии и стрелки">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs text-gray-500 dark:text-gray-400">Линия сущности ({activeStyle.lifelineThickness})</label>
                  <input
                    type="range" min={0.5} max={5} step={0.5} value={activeStyle.lifelineThickness}
                    onChange={(e) => onUpdate({ lifelineThickness: +e.target.value })}
                    className="w-32 accent-indigo-400"
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs text-gray-500 dark:text-gray-400">Сплошные стрелки ({activeStyle.arrowSolidThickness})</label>
                  <input
                    type="range" min={0.5} max={5} step={0.5} value={activeStyle.arrowSolidThickness}
                    onChange={(e) => onUpdate({ arrowSolidThickness: +e.target.value })}
                    className="w-32 accent-indigo-400"
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs text-gray-500 dark:text-gray-400">Пунктирные стрелки ({activeStyle.arrowDashedThickness})</label>
                  <input
                    type="range" min={0.5} max={5} step={0.5} value={activeStyle.arrowDashedThickness}
                    onChange={(e) => onUpdate({ arrowDashedThickness: +e.target.value })}
                    className="w-32 accent-indigo-400"
                  />
                </div>
              </div>
            </CollapsibleSection>


            {/* Save */}
            <section className="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-2">
              <button
                onClick={() => onSave(activeStyle)}
                className="w-full py-1.5 text-xs rounded bg-indigo-700 hover:bg-indigo-600 text-white font-medium transition-colors truncate"
                title={`Сохранить изменения в «${activeStyle.name}»`}
              >
                Обновить «{activeStyle.name}»
              </button>
              {!showSaveForm ? (
                <button
                  onClick={() => { setShowSaveForm(true); setSaveName(''); }}
                  className="w-full py-1.5 text-xs rounded bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium transition-colors"
                >
                  Сохранить как новый…
                </button>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    placeholder="Название пресета"
                    className="w-full text-xs bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-gray-700 dark:text-gray-200 outline-none focus:border-indigo-400"
                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button onClick={handleSave} disabled={!saveName.trim()} className="flex-1 py-1 text-xs rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-colors">
                      Создать
                    </button>
                    <button onClick={() => { setShowSaveForm(false); setSaveName(''); }} className="flex-1 py-1 text-xs rounded bg-gray-200 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors">
                      Отмена
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
