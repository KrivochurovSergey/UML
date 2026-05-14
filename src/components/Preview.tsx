import { useRef, useState, useEffect } from 'react';

interface Props {
  svgContent: string;
  svgParts: string[];
  loading: boolean;
  error: string | null;
}

export function Preview({ svgContent, svgParts, loading, error }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const isMulti = svgParts.length > 1;
  const hasContent = isMulti || !!svgContent;

  return (
    <div ref={containerRef} className="flex flex-col h-full bg-gray-100 dark:bg-gray-950">
      <div className="px-3 py-1.5 bg-gray-200 border-b border-gray-300 dark:bg-gray-900 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 font-medium shrink-0 flex items-center justify-between">
        <span>Предпросмотр{isMulti ? ` — ${svgParts.length} части` : ''}</span>
        {hasContent && (
          <button
            onClick={toggleFullscreen}
            className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            title={isFullscreen ? 'Выйти из полноэкранного режима' : 'На весь экран'}
          >
            {isFullscreen ? (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
              </svg>
            )}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-auto flex flex-col items-center p-4 gap-6">
        {loading && (
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mt-16">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm">Рендеринг...</span>
          </div>
        )}

        {error && !loading && (
          <div className="mt-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg max-w-md">
            <p className="text-red-700 dark:text-red-400 text-sm font-medium">Ошибка рендеринга</p>
            <p className="text-red-600 dark:text-red-500 text-xs mt-1">{error}</p>
          </div>
        )}

        {!loading && !error && isMulti && svgParts.map((svg, i) => (
          <div key={i} className="w-full max-w-full flex flex-col items-center gap-1">
            <span className="text-xs font-medium text-gray-400 dark:text-gray-500 self-start">Часть {i + 1}</span>
            <div
              className="diagram-preview bg-white rounded-lg shadow-sm p-4 max-w-full w-full"
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          </div>
        ))}

        {!loading && !error && !isMulti && svgContent && (
          <div
            className="diagram-preview bg-white rounded-lg shadow-sm p-4 max-w-full"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        )}

        {!loading && !error && !hasContent && (
          <div className="text-gray-400 dark:text-gray-500 text-sm mt-16">
            Начните вводить код диаграммы
          </div>
        )}
      </div>
    </div>
  );
}
