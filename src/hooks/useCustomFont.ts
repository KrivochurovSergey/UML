import { useState, useCallback } from 'react';
import type { CustomFont } from '../types/font';

const STORAGE_KEY = 'plantuml-studio-custom-font';

function loadPersistedFont(): CustomFont | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CustomFont) : null;
  } catch {
    return null;
  }
}

export function useCustomFont() {
  const [customFont, setCustomFont] = useState<CustomFont | null>(loadPersistedFont);

  const loadFontFile = useCallback((file: File): Promise<CustomFont> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        // Derive a CSS font-family name from the filename
        const name = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
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
      reader.readAsDataURL(file);
    });
  }, []);

  const removeCustomFont = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setCustomFont(null);
  }, []);

  return { customFont, loadFontFile, removeCustomFont };
}
