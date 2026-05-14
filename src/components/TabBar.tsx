import { useState, useRef, useEffect } from 'react';
import type { Tab } from '../types/tab';

interface Props {
  tabs: Tab[];
  activeTabId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onClose: (id: string) => void;
  onRename: (id: string, name: string) => void;
}

function TabItem({ tab, isActive, onSelect, onClose, onRename, canClose }: {
  tab: Tab;
  isActive: boolean;
  onSelect: () => void;
  onClose: () => void;
  onRename: (name: string) => void;
  canClose: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(tab.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commit = () => {
    const name = draft.trim() || tab.name;
    onRename(name);
    setDraft(name);
    setEditing(false);
  };

  return (
    <div
      className={`group flex items-center gap-1 px-3 py-1.5 border-r border-gray-200 dark:border-gray-700 cursor-pointer select-none shrink-0 max-w-40 ${
        isActive
          ? 'bg-gray-100 text-gray-900 dark:bg-gray-950 dark:text-white'
          : 'bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200'
      }`}
      onClick={onSelect}
      onDoubleClick={() => { setEditing(true); setDraft(tab.name); }}
    >
      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') { setDraft(tab.name); setEditing(false); }
            e.stopPropagation();
          }}
          onClick={(e) => e.stopPropagation()}
          className="text-xs bg-transparent outline outline-1 outline-indigo-400 rounded px-0.5 w-full min-w-0"
        />
      ) : (
        <span className="text-xs truncate flex-1 min-w-0">{tab.name}</span>
      )}
      {canClose && (
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 leading-none"
          title="Закрыть"
        >
          ✕
        </button>
      )}
    </div>
  );
}

export function TabBar({ tabs, activeTabId, onSelect, onAdd, onClose, onRename }: Props) {
  return (
    <div className="flex items-stretch bg-white border-b border-gray-200 dark:bg-gray-900 dark:border-gray-700 overflow-x-auto shrink-0">
      {tabs.map((tab) => (
        <TabItem
          key={tab.id}
          tab={tab}
          isActive={tab.id === activeTabId}
          onSelect={() => onSelect(tab.id)}
          onClose={() => onClose(tab.id)}
          onRename={(name) => onRename(tab.id, name)}
          canClose={tabs.length > 1}
        />
      ))}
      <button
        onClick={onAdd}
        className="px-3 py-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors shrink-0 text-sm leading-none"
        title="Новая вкладка"
      >
        +
      </button>
    </div>
  );
}
