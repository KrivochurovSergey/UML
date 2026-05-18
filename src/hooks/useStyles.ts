import { useState, useCallback } from 'react';
import type { DiagramStyle } from '../types/style';
import { DEFAULT_STYLE, STYLE_PRESETS } from '../types/style';

const STORAGE_KEY = 'plantuml-studio-styles';
const ACTIVE_STYLE_KEY = 'plantuml-studio-active-style';
const HIDDEN_KEY = 'plantuml-studio-hidden-presets';

function loadSavedStyles(): DiagramStyle[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DiagramStyle[];
    return parsed.map((s) => ({ ...DEFAULT_STYLE, ...s }));
  } catch {
    return [];
  }
}

function loadHiddenIds(): Set<string> {
  try {
    const raw = localStorage.getItem(HIDDEN_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function persistStyles(styles: DiagramStyle[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(styles));
}

function persistHidden(ids: Set<string>) {
  localStorage.setItem(HIDDEN_KEY, JSON.stringify([...ids]));
}

const FALLBACK_STYLE = STYLE_PRESETS[0] ?? DEFAULT_STYLE;

function loadActiveStyle(): DiagramStyle {
  try {
    const raw = localStorage.getItem(ACTIVE_STYLE_KEY);
    if (!raw) return FALLBACK_STYLE;
    return { ...DEFAULT_STYLE, ...JSON.parse(raw) };
  } catch {
    return FALLBACK_STYLE;
  }
}

const isBuiltIn = (id: string) => STYLE_PRESETS.some((p) => p.id === id);

export function useStyles() {
  const [customStyles, setCustomStyles] = useState<DiagramStyle[]>(loadSavedStyles);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(loadHiddenIds);
  const [activeStyle, setActiveStyleState] = useState<DiagramStyle>(loadActiveStyle);

  // Built-ins merged with custom overrides (same id = override), hidden ones excluded
  const customById = new Map(customStyles.map((s) => [s.id, s]));
  const allStyles: DiagramStyle[] = [
    ...STYLE_PRESETS
      .filter((p) => !hiddenIds.has(p.id))
      .map((p) => customById.get(p.id) ?? p),
    ...customStyles.filter((s) => !isBuiltIn(s.id)),
  ];

  const setActiveStyle = useCallback((style: DiagramStyle) => {
    setActiveStyleState(style);
    localStorage.setItem(ACTIVE_STYLE_KEY, JSON.stringify(style));
  }, []);

  const saveStyle = useCallback((style: DiagramStyle) => {
    const newStyle = { ...style, id: style.id || `custom-${Date.now()}` };
    setCustomStyles((prev) => {
      const existing = prev.findIndex((s) => s.id === newStyle.id);
      const next = existing >= 0
        ? prev.map((s) => s.id === newStyle.id ? newStyle : s)
        : [...prev, newStyle];
      persistStyles(next);
      return next;
    });
    setActiveStyle(newStyle);
  }, [setActiveStyle]);

  const deleteStyle = useCallback((id: string) => {
    if (isBuiltIn(id)) {
      // Hide built-in preset
      setHiddenIds((prev) => {
        const next = new Set(prev);
        next.add(id);
        persistHidden(next);
        return next;
      });
      // Also remove any custom override for it
      setCustomStyles((prev) => {
        const next = prev.filter((s) => s.id !== id);
        persistStyles(next);
        return next;
      });
    } else {
      setCustomStyles((prev) => {
        const next = prev.filter((s) => s.id !== id);
        persistStyles(next);
        return next;
      });
    }
    if (activeStyle.id === id) {
      setActiveStyle(DEFAULT_STYLE);
    }
  }, [activeStyle.id, setActiveStyle]);

  const renameStyle = useCallback((id: string, name: string) => {
    if (isBuiltIn(id)) {
      // Promote built-in to a custom override with new name
      const base = STYLE_PRESETS.find((p) => p.id === id)!;
      const promoted = { ...base, name };
      setCustomStyles((prev) => {
        const existing = prev.findIndex((s) => s.id === id);
        const next = existing >= 0
          ? prev.map((s) => s.id === id ? promoted : s)
          : [...prev, promoted];
        persistStyles(next);
        return next;
      });
      if (activeStyle.id === id) {
        setActiveStyleState((prev) => {
          const next = { ...prev, name };
          localStorage.setItem(ACTIVE_STYLE_KEY, JSON.stringify(next));
          return next;
        });
      }
    } else {
      setCustomStyles((prev) => {
        const next = prev.map((s) => s.id === id ? { ...s, name } : s);
        persistStyles(next);
        return next;
      });
      if (activeStyle.id === id) {
        setActiveStyleState((prev) => {
          const next = { ...prev, name };
          localStorage.setItem(ACTIVE_STYLE_KEY, JSON.stringify(next));
          return next;
        });
      }
    }
  }, [activeStyle.id]);

  const updateActiveStyle = useCallback((patch: Partial<DiagramStyle>) => {
    setActiveStyleState((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem(ACTIVE_STYLE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const restorePresets = useCallback(() => {
    setHiddenIds(new Set());
    persistHidden(new Set());
  }, []);

  return {
    allStyles,
    customStyles,
    activeStyle,
    setActiveStyle,
    saveStyle,
    deleteStyle,
    renameStyle,
    updateActiveStyle,
    restorePresets,
  };
}
