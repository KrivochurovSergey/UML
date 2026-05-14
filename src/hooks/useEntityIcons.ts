import { useState, useCallback } from 'react';
import type { CustomIcon, EntityIcons, EntityType } from '../types/icon';

const STORAGE_KEY = 'plantuml-studio-entity-icons';

function loadPersisted(): EntityIcons {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as EntityIcons) : {};
  } catch {
    return {};
  }
}

function persist(icons: EntityIcons) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(icons));
  } catch {
    // quota exceeded — keep in-session only
  }
}

export function useEntityIcons() {
  const [entityIcons, setEntityIcons] = useState<EntityIcons>(loadPersisted);

  const loadEntityIcon = useCallback((type: EntityType, file: File): Promise<CustomIcon> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const icon: CustomIcon = { fileName: file.name, dataUrl };
        setEntityIcons((prev) => {
          const next = { ...prev, [type]: icon };
          persist(next);
          return next;
        });
        resolve(icon);
      };
      reader.onerror = () => reject(new Error('Не удалось прочитать файл иконки'));
      reader.readAsDataURL(file);
    });
  }, []);

  const removeEntityIcon = useCallback((type: EntityType) => {
    setEntityIcons((prev) => {
      const next = { ...prev };
      delete next[type];
      persist(next);
      return next;
    });
  }, []);

  return { entityIcons, loadEntityIcon, removeEntityIcon };
}
