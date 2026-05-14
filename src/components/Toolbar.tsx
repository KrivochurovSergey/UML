import { useState, useCallback } from 'react';
import { downloadSvg, downloadPng, downloadSvgParts, downloadPngParts } from '../utils/export';

interface Props {
  svgContent: string;
  svgParts: string[];
  loading: boolean;
  isDark: boolean;
  onToggleTheme: () => void;
  onGetShareUrl: () => string;
}

export function Toolbar({ svgContent, svgParts, loading, isDark, onToggleTheme, onGetShareUrl }: Props) {
  const isMulti = svgParts.length > 1;
  const canExport = (isMulti ? svgParts.length > 0 : !!svgContent) && !loading;
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(() => {
    const url = onGetShareUrl();
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [onGetShareUrl]);

  const handleSvg = () => {
    if (!canExport) return;
    if (isMulti) downloadSvgParts(svgParts);
    else downloadSvg(svgContent);
  };

  const handlePng = () => {
    if (!canExport) return;
    if (isMulti) downloadPngParts(svgParts);
    else downloadPng(svgContent);
  };

  return (
    <header className="flex items-center gap-3 px-4 py-2 bg-white border-b border-gray-200 dark:bg-gray-900 dark:border-gray-700 shrink-0">
      <span className="text-gray-900 dark:text-white font-semibold text-sm tracking-wide mr-auto">
        PlantUML Studio
      </span>

      {isMulti && (
        <span className="text-xs text-indigo-400 font-medium">
          {svgParts.length} части
        </span>
      )}

      <button
        onClick={onToggleTheme}
        className="p-1.5 rounded text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        title={isDark ? 'Светлая тема' : 'Тёмная тема'}
      >
        {isDark ? (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        )}
      </button>

      <button
        onClick={handleShare}
        className="px-3 py-1.5 text-xs font-medium rounded bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100 transition-colors min-w-[90px]"
        title="Скопировать ссылку на диаграмму"
      >
        {copied ? '✓ Скопировано' : '⤴ Поделиться'}
      </button>

      <button
        onClick={handleSvg}
        disabled={!canExport}
        className="px-3 py-1.5 text-xs font-medium rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100 transition-colors"
      >
        ↓ SVG{isMulti ? ` (${svgParts.length})` : ''}
      </button>

      <button
        onClick={handlePng}
        disabled={!canExport}
        className="px-3 py-1.5 text-xs font-medium rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100 transition-colors"
      >
        ↓ PNG{isMulti ? ` (${svgParts.length})` : ''}
      </button>
    </header>
  );
}
