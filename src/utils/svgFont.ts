import type { CustomFont } from '../types/font';

export function injectFontIntoSvg(svgContent: string, font: CustomFont): string {
  const style = `<style>@font-face{font-family:"${font.name}";src:url("${font.dataUrl}");}text,tspan{font-family:"${font.name}" !important;}</style>`;
  // Insert right after the opening <svg ... > tag
  return svgContent.replace(/(<svg[^>]*>)/, `$1${style}`);
}
