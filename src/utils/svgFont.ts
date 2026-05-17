import type { CustomFont } from '../types/font';
import type { SystemFont } from './systemFonts';

/** Inject system fonts into SVG — declared for all known name aliases */
export function injectSystemFontsIntoSvg(svgContent: string, systemFonts: SystemFont[]): string {
  if (systemFonts.length === 0) return svgContent;

  const faces = systemFonts
    .flatMap((font) => font.names.map(
      (name) => `@font-face{font-family:"${name}";src:url("${font.dataUrl}") format("opentype");}`,
    ))
    .join('');

  return svgContent.replace(/(<svg[^>]*>)/, `$1<style>${faces}</style>`);
}

/** Inject a user-loaded custom font — also aliases every font-family found in the SVG */
export function injectFontIntoSvg(svgContent: string, font: CustomFont): string {
  // Collect all unique font-family values actually referenced in the SVG,
  // plus the extracted font name. This handles mismatches between the name
  // PlantUML puts in the SVG (from skinparam fontName) and the name
  // extracted from the font binary (e.g. "CoFo Redmadrobot" vs "CoFo Redmadrobot Regular").
  const fontFamilyRe = /font-family="([^"]+)"/g;
  const families = new Set<string>([font.name]);
  let m: RegExpExecArray | null;
  while ((m = fontFamilyRe.exec(svgContent)) !== null) {
    const val = m[1].trim();
    if (val) families.add(val);
  }

  const faces = [...families]
    .map((name) => `@font-face{font-family:"${name}";src:url("${font.dataUrl}");}`)
    .join('');

  return svgContent.replace(/(<svg[^>]*>)/, `$1<style>${faces}</style>`);
}
