import { useState, useCallback } from 'react';
import type { CustomFont } from '../types/font';
import { extractFontName, getFontMimeType, bufferToDataUrl } from '../utils/fontName';

const STORAGE_KEY = 'plantuml-studio-custom-font';

function loadPersistedFont(): CustomFont | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CustomFont) : null;
  } catch {
    return null;
  }
}

/** Fallback: derive a readable name from the filename */
function nameFromFile(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
}

export function useCustomFont() {
  const [customFont, setCustomFont] = useState<CustomFont | null>(loadPersistedFont);

  const loadFontFile = useCallback((file: File): Promise<CustomFont> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const buffer = e.target?.result as ArrayBuffer;

        // Extract the real font family name from the binary name table
        const embeddedName = extractFontName(buffer);
        const name = embeddedName ?? nameFromFile(file.name);

        const mimeType = getFontMimeType(file.name);
        const dataUrl = bufferToDataUrl(buffer, mimeType);

        const font: CustomFont = { name, fileName: file.name, dataUrl };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(font));
        } catch {
          // localStorage quota exceeded — still use the font in-session
        }
        setCustomFont(font);
        resolve(font);
      };
      reader.onerror = () => reject(new Error('Не удалось прочитать файл шрифта'));
      reader.readAsArrayBuffer(file);
    });
  }, []);

  const removeCustomFont = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setCustomFont(null);
  }, []);

  return { customFont, loadFontFile, removeCustomFont };
}
