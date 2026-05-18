import { useState, useRef, useCallback } from 'react';
import type { DiagramStyle } from '../types/style';
import { injectStyle, encodeUml, fetchSvg } from '../utils/plantuml';

export function useDiagram() {
  const [svgContent, setSvgContent] = useState<string>('');
  const [svgParts, setSvgParts] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const renderDiagram = useCallback(async (umlSource: string, style: DiagramStyle) => {
    setLoading(true);
    setError(null);
    setSvgParts([]);
    try {
      const styled = injectStyle(umlSource, style);
      const encoded = encodeUml(styled);
      let svg: string | null = null;
      let lastErr: unknown;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          svg = await fetchSvg(encoded);
          break;
        } catch (err) {
          lastErr = err;
          if (attempt < 2) await new Promise((r) => setTimeout(r, 800));
        }
      }
      if (svg != null) setSvgContent(svg);
      else throw lastErr;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка рендеринга');
    } finally {
      setLoading(false);
    }
  }, []);

  const renderMany = useCallback(async (sources: string[], style: DiagramStyle) => {
    setLoading(true);
    setError(null);
    setSvgContent('');
    try {
      const results = await Promise.all(
        sources.map(async (src) => {
          const styled = injectStyle(src, style);
          const encoded = encodeUml(styled);
          return fetchSvg(encoded);
        }),
      );
      setSvgParts(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка рендеринга');
    } finally {
      setLoading(false);
    }
  }, []);

  return { svgContent, setSvgContent, svgParts, setSvgParts, loading, error, renderDiagram, renderMany, debounceRef };
}
