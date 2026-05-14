import { useState, useCallback } from 'react';
import type { CustomIcon } from '../types/icon';

const STORAGE_KEY = 'plantuml-studio-actor-icon';

function loadPersistedIcon(): CustomIcon | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CustomIcon) : null;
  } catch {
    return null;
  }
}

export function useActorIcon() {
  const [actorIcon, setActorIcon] = useState<CustomIcon | null>(loadPersistedIcon);

  const loadIconFile = useCallback((file: File): Promise<CustomIcon> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const icon: CustomIcon = { fileName: file.name, dataUrl };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(icon));
        } catch {
          // quota exceeded — keep in-session only
        }
        setActorIcon(icon);
        resolve(icon);
      };
      reader.onerror = () => reject(new Error('Не удалось прочитать файл иконки'));
      reader.readAsDataURL(file);
    });
  }, []);

  const removeActorIcon = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setActorIcon(null);
  }, []);

  return { actorIcon, loadIconFile, removeActorIcon };
}
