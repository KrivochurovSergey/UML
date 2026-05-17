import { useEffect, useCallback, useState, useMemo, useRef } from 'react';
import { Toolbar } from './components/Toolbar';
import { Editor, type EditorHandle } from './components/Editor';
import { Preview } from './components/Preview';
import { StylePanel } from './components/StylePanel';
import { TabBar } from './components/TabBar';
import { useDiagram } from './hooks/useDiagram';
import { useTabs } from './hooks/useTabs';
import { useStyles } from './hooks/useStyles';
import { useCustomFont } from './hooks/useCustomFont';
import { useActorIcon } from './hooks/useActorIcon';
import { useTheme } from './hooks/useTheme';
import { injectFontIntoSvg, injectSystemFontsIntoSvg } from './utils/svgFont';
import { injectActorIconIntoSvg } from './utils/svgActorIcon';
import { applyThicknessToSvg } from './utils/svgThickness';
import { useSystemFonts } from './hooks/useSystemFonts';
import { buildShareUrl, parseShareUrl } from './utils/shareUrl';
import { hasCuts, splitDiagramSource } from './utils/splitDiagram';

const DEBOUNCE_MS = 800;

// Read shared state from URL hash once at startup (before any hooks run)
const sharedState = parseShareUrl();

export default function App() {
  const { svgContent, setSvgContent, svgParts, setSvgParts, loading, error, renderDiagram, renderMany, debounceRef } = useDiagram();
  const { tabs, activeTabId, activeTab, setActiveTabId, addTab, closeTab, renameTab, updateTabSource } = useTabs();
  const { activeStyle, allStyles, setActiveStyle, saveStyle, deleteStyle, renameStyle, updateActiveStyle, restorePresets } = useStyles();
  const { customFont, loadFontFile, removeCustomFont } = useCustomFont();
  const { actorIcon, loadIconFile, removeActorIcon } = useActorIcon();
  const systemFonts = useSystemFonts();
  const { isDark, toggleTheme } = useTheme();
  const [editorWidth, setEditorWidth] = useState(320);
  const [showEditor, setShowEditor] = useState(true);
  const [showStylePanel, setShowStylePanel] = useState(true);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);
  const editorRef = useRef<EditorHandle>(null);

  // Per-tab SVG cache so switching tabs restores the last rendered SVG immediately
  const svgCacheRef = useRef<Record<string, string>>({});

  // Apply shared URL state once on first render
  const sharedApplied = useRef(false);
  useEffect(() => {
    if (sharedState && !sharedApplied.current) {
      sharedApplied.current = true;
      updateTabSource(activeTabId, sharedState.source);
      setActiveStyle(sharedState.style);
      // Clear hash so refreshing doesn't re-apply
      history.replaceState(null, '', window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const render = useCallback(() => {
    if (hasCuts(activeTab.source)) {
      renderMany(splitDiagramSource(activeTab.source), activeStyle);
    } else {
      renderDiagram(activeTab.source, activeStyle);
    }
  }, [activeTab.source, activeStyle, renderDiagram, renderMany]);

  // Initial render
  useEffect(() => {
    render();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist rendered SVG into cache whenever it changes
  useEffect(() => {
    if (svgContent) svgCacheRef.current[activeTabId] = svgContent;
  }, [svgContent, activeTabId]);

  // Auto-render on source change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(render, DEBOUNCE_MS);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [activeTab.source, render, debounceRef]);

  // Re-render on style change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(render, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStyle]);

  // On tab switch: restore cached SVG or trigger a render
  const handleSelectTab = useCallback((id: string) => {
    setActiveTabId(id);
    const tab = tabs.find((t) => t.id === id);
    if (!tab) return;
    if (hasCuts(tab.source)) {
      renderMany(splitDiagramSource(tab.source), activeStyle);
      return;
    }
    const cached = svgCacheRef.current[id];
    if (cached) {
      setSvgParts([]);
      setSvgContent(cached);
    } else {
      renderDiagram(tab.source, activeStyle);
    }
  }, [setActiveTabId, tabs, activeStyle, renderDiagram, renderMany, setSvgContent, setSvgParts]);

  const handleAddTab = useCallback(() => { addTab(); }, [addTab]);

  const handleRemoveFont = useCallback(() => {
    const name = customFont?.name ?? '';
    removeCustomFont();
    const patch: Parameters<typeof updateActiveStyle>[0] = { fontName: 'Arial' };
    if (name) {
      if (activeStyle.participantFontName === name) patch.participantFontName = '';
      if (activeStyle.messageFontName === name) patch.messageFontName = '';
      if (activeStyle.noteFontName === name) patch.noteFontName = '';
      if (activeStyle.titleFontName === name) patch.titleFontName = '';
    }
    updateActiveStyle(patch);
  }, [removeCustomFont, updateActiveStyle, customFont, activeStyle]);

  const handleShareUrl = useCallback(() => {
    return buildShareUrl(activeTab.source, activeStyle);
  }, [activeTab.source, activeStyle]);

  const postProcess = useCallback((svg: string) => {
    let s = svg;
    s = injectSystemFontsIntoSvg(s, systemFonts);
    if (customFont) s = injectFontIntoSvg(s, customFont);
    if (actorIcon) s = injectActorIconIntoSvg(s, actorIcon);
    s = applyThicknessToSvg(
      s,
      activeStyle.lifelineThickness,
      activeStyle.arrowSolidThickness,
      activeStyle.arrowDashedThickness,
      activeStyle.borderThickness,
    );
    return s;
  }, [systemFonts, customFont, actorIcon, activeStyle.lifelineThickness, activeStyle.arrowSolidThickness, activeStyle.arrowDashedThickness, activeStyle.borderThickness]);

  const displaySvg = useMemo(
    () => (svgContent ? postProcess(svgContent) : ''),
    [svgContent, postProcess],
  );

  const displaySvgParts = useMemo(
    () => svgParts.map(postProcess),
    [svgParts, postProcess],
  );

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950">
      <Toolbar
        svgContent={displaySvg}
        svgParts={displaySvgParts}
        loading={loading}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onGetShareUrl={handleShareUrl}
      />

      <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onSelect={handleSelectTab}
        onAdd={handleAddTab}
        onClose={closeTab}
        onRename={renameTab}
      />

      <div
        className="flex flex-1 overflow-hidden"
        onMouseMove={(e) => {
          if (!isDragging.current) return;
          const delta = e.clientX - dragStartX.current;
          const next = Math.min(800, Math.max(160, dragStartWidth.current + delta));
          setEditorWidth(next);
        }}
        onMouseUp={() => { isDragging.current = false; }}
        onMouseLeave={() => { isDragging.current = false; }}
      >
        {/* Editor panel — or collapsed strip */}
        {showEditor ? (
          <div className="shrink-0 flex flex-col overflow-hidden relative group/editor" style={{ width: editorWidth }}>
            <Editor ref={editorRef} source={activeTab.source} onChange={(v) => updateTabSource(activeTabId, v)} isDark={isDark} />
            {/* Collapse button — appears on hover at right edge */}
            <button
              onClick={() => setShowEditor(false)}
              className="absolute top-1/2 right-0 -translate-y-1/2 w-4 h-10 bg-gray-200 hover:bg-indigo-500 text-gray-500 hover:text-white dark:bg-gray-700 dark:hover:bg-indigo-600 dark:text-gray-400 flex items-center justify-center rounded-l z-10 opacity-0 group-hover/editor:opacity-100 transition-opacity"
              title="Скрыть редактор"
            >
              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowEditor(true)}
            className="w-7 shrink-0 flex items-center justify-center bg-gray-50 hover:bg-gray-100 border-r border-gray-200 dark:bg-gray-900 dark:hover:bg-gray-800 dark:border-gray-700 transition-colors group"
            title="Показать редактор"
          >
            <span
              className="text-xs font-medium text-gray-400 group-hover:text-gray-700 dark:text-gray-500 dark:group-hover:text-gray-200 select-none tracking-wider transition-colors"
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
            >
              PlantUML
            </span>
          </button>
        )}

        {/* Resize handle — only when editor is visible */}
        {showEditor && (
          <div
            className="w-1 shrink-0 cursor-col-resize bg-gray-200 hover:bg-indigo-400 dark:bg-gray-700 dark:hover:bg-indigo-500 active:bg-indigo-400 transition-colors"
            onMouseDown={(e) => {
              isDragging.current = true;
              dragStartX.current = e.clientX;
              dragStartWidth.current = editorWidth;
              e.preventDefault();
            }}
          />
        )}

        {/* Preview */}
        <div className="flex-1 overflow-hidden">
          <Preview svgContent={displaySvg} svgParts={displaySvgParts} loading={loading} error={error} />
        </div>

        {/* Style panel — or collapsed strip */}
        {showStylePanel ? (
          <div className="w-64 shrink-0 border-l border-gray-200 dark:border-gray-700 relative group/styles">
            {/* Collapse button — appears on hover at left edge */}
            <button
              onClick={() => setShowStylePanel(false)}
              className="absolute top-1/2 left-0 -translate-y-1/2 w-4 h-10 bg-gray-200 hover:bg-indigo-500 text-gray-500 hover:text-white dark:bg-gray-700 dark:hover:bg-indigo-600 dark:text-gray-400 flex items-center justify-center rounded-r z-10 opacity-0 group-hover/styles:opacity-100 transition-opacity"
              title="Скрыть панель стилей"
            >
              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <StylePanel
              activeStyle={activeStyle}
              allStyles={allStyles}
              customFont={customFont}
              actorIcon={actorIcon}
              onSelect={setActiveStyle}
              onUpdate={updateActiveStyle}
              onSave={saveStyle}
              onDelete={deleteStyle}
              onRename={renameStyle}
              onLoadFont={loadFontFile}
              onRemoveFont={handleRemoveFont}
              onLoadActorIcon={loadIconFile}
              onRemoveActorIcon={removeActorIcon}
              onInsertSnippet={(code) => editorRef.current?.insertAtCursor(code)}
              onRestorePresets={restorePresets}
            />
          </div>
        ) : (
          <button
            onClick={() => setShowStylePanel(true)}
            className="w-7 shrink-0 flex items-center justify-center bg-gray-50 hover:bg-gray-100 border-l border-gray-200 dark:bg-gray-900 dark:hover:bg-gray-800 dark:border-gray-700 transition-colors group"
            title="Показать панель стилей"
          >
            <span
              className="text-xs font-medium text-gray-400 group-hover:text-gray-700 dark:text-gray-500 dark:group-hover:text-gray-200 select-none tracking-wider transition-colors"
              style={{ writingMode: 'vertical-rl' }}
            >
              Стили
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
