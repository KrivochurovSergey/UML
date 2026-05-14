import { useState, useCallback } from 'react';
import type { Tab } from '../types/tab';
import { MOCK_DIAGRAM } from '../utils/mockDiagram';

const TABS_KEY = 'plantuml-studio-tabs';
const ACTIVE_TAB_KEY = 'plantuml-studio-active-tab';
const LEGACY_SOURCE_KEY = 'plantuml-studio-source';

function createTab(name: string, source: string): Tab {
  return { id: `tab-${Date.now()}-${Math.random().toString(36).slice(2)}`, name, source };
}

function loadTabs(): Tab[] {
  try {
    const stored = localStorage.getItem(TABS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Tab[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* ignore */ }

  // Migrate legacy single source
  const legacySource = localStorage.getItem(LEGACY_SOURCE_KEY);
  return [createTab('Диаграмма 1', legacySource ?? MOCK_DIAGRAM)];
}

function loadActiveTabId(tabs: Tab[]): string {
  const stored = localStorage.getItem(ACTIVE_TAB_KEY);
  if (stored && tabs.some((t) => t.id === stored)) return stored;
  return tabs[0].id;
}

function saveTabs(tabs: Tab[]) {
  localStorage.setItem(TABS_KEY, JSON.stringify(tabs));
}

function saveActiveTabId(id: string) {
  localStorage.setItem(ACTIVE_TAB_KEY, id);
}

const initialTabs = loadTabs();
const initialActiveId = loadActiveTabId(initialTabs);

export function useTabs() {
  const [tabs, setTabsRaw] = useState<Tab[]>(initialTabs);
  const [activeTabId, setActiveTabIdRaw] = useState<string>(initialActiveId);

  const setTabs = useCallback((next: Tab[]) => {
    setTabsRaw(next);
    saveTabs(next);
  }, []);

  const setActiveTabId = useCallback((id: string) => {
    setActiveTabIdRaw(id);
    saveActiveTabId(id);
  }, []);

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0];

  const addTab = useCallback(() => {
    const tab = createTab(`Диаграмма ${tabs.length + 1}`, MOCK_DIAGRAM);
    const next = [...tabs, tab];
    setTabs(next);
    setActiveTabId(tab.id);
    return tab;
  }, [tabs, setTabs, setActiveTabId]);

  const closeTab = useCallback((id: string) => {
    if (tabs.length === 1) return;
    const next = tabs.filter((t) => t.id !== id);
    setTabs(next);
    if (activeTabId === id) {
      const idx = tabs.findIndex((t) => t.id === id);
      const fallback = next[Math.min(idx, next.length - 1)];
      setActiveTabId(fallback.id);
    }
  }, [tabs, activeTabId, setTabs, setActiveTabId]);

  const renameTab = useCallback((id: string, name: string) => {
    setTabs(tabs.map((t) => (t.id === id ? { ...t, name } : t)));
  }, [tabs, setTabs]);

  const updateTabSource = useCallback((id: string, source: string) => {
    setTabs(tabs.map((t) => (t.id === id ? { ...t, source } : t)));
  }, [tabs, setTabs]);

  return {
    tabs,
    activeTabId,
    activeTab,
    setActiveTabId,
    addTab,
    closeTab,
    renameTab,
    updateTabSource,
  };
}
