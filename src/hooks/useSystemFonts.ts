import { useState, useEffect } from 'react';
import { getSystemFonts, injectSystemFontsCss, type SystemFont } from '../utils/systemFonts';

export function useSystemFonts(): SystemFont[] {
  const [fonts, setFonts] = useState<SystemFont[]>([]);

  useEffect(() => {
    // Inject URL-based @font-face immediately so browser can render SVGs right away
    const cleanup = injectSystemFontsCss();
    // Load as data URLs for self-contained SVG embedding (preview + download)
    getSystemFonts().then(setFonts);
    return cleanup;
  }, []);

  return fonts;
}
