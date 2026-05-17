import cofoRedmadrobotUrl from '../assets/fonts/CoFoRedmadrobot-Regular.otf?url';
import cofoSansUrl from '../assets/fonts/CoFoSans-Regular.otf?url';

export interface SystemFont {
  /** All known family-name aliases — declared in @font-face for each */
  names: string[];
  dataUrl: string;
}

async function toDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  const buf = await res.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let bin = '';
  // chunk to avoid stack overflow on large files
  for (let i = 0; i < bytes.byteLength; i += 8192) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 8192));
  }
  return `data:font/otf;base64,${btoa(bin)}`;
}

let _promise: Promise<SystemFont[]> | null = null;

export function getSystemFonts(): Promise<SystemFont[]> {
  if (!_promise) {
    _promise = Promise.all([
      toDataUrl(cofoRedmadrobotUrl),
      toDataUrl(cofoSansUrl),
    ]).then(([rmrData, sansData]): SystemFont[] => [
      {
        names: ['CoFo Redmadrobot Regular', 'CoFo Redmadrobot'],
        dataUrl: rmrData,
      },
      {
        names: ['CoFo Sans Regular', 'CoFo Sans'],
        dataUrl: sansData,
      },
    ]);
  }
  return _promise;
}

/** For immediate browser-level font availability (before SVG post-process runs) */
export function injectSystemFontsCss(): () => void {
  const el = document.createElement('style');
  el.textContent = [
    `@font-face{font-family:"CoFo Redmadrobot Regular";src:url("${cofoRedmadrobotUrl}") format("opentype");}`,
    `@font-face{font-family:"CoFo Redmadrobot";src:url("${cofoRedmadrobotUrl}") format("opentype");}`,
    `@font-face{font-family:"CoFo Sans Regular";src:url("${cofoSansUrl}") format("opentype");}`,
    `@font-face{font-family:"CoFo Sans";src:url("${cofoSansUrl}") format("opentype");}`,
  ].join('');
  document.head.appendChild(el);
  return () => document.head.removeChild(el);
}
