import type { DiagramStyle } from '../types/style';

function encode(str: string): string {
  return btoa(encodeURIComponent(str));
}

function decode(str: string): string {
  return decodeURIComponent(atob(str));
}

export function buildShareUrl(source: string, style: DiagramStyle): string {
  const s = encode(source);
  const t = encode(JSON.stringify(style));
  const hash = `#s=${s}&t=${t}`;
  return `${window.location.origin}${window.location.pathname}${hash}`;
}

export interface SharedState {
  source: string;
  style: DiagramStyle;
}

export function parseShareUrl(): SharedState | null {
  const hash = window.location.hash.slice(1);
  if (!hash) return null;
  try {
    const params = new URLSearchParams(hash);
    const s = params.get('s');
    const t = params.get('t');
    if (!s || !t) return null;
    return {
      source: decode(s),
      style: JSON.parse(decode(t)) as DiagramStyle,
    };
  } catch {
    return null;
  }
}
