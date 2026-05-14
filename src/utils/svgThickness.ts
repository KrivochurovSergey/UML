export function applyThicknessToSvg(
  svgContent: string,
  lifelineThickness: number,
  arrowSolidThickness: number,
  arrowDashedThickness: number,
  borderThickness: number,
): string {
  const isDefault =
    lifelineThickness === 0.5 &&
    arrowSolidThickness === 1 &&
    arrowDashedThickness === 1 &&
    borderThickness === 0.5;
  if (isDefault) return svgContent;

  const css: string[] = [];

  // ── Participant shape borders ──────────────────────────────
  const shapes = ['rect', 'ellipse', 'path', 'polygon', 'circle'];
  const borderSelectors = ['participant-head', 'participant-tail']
    .flatMap((cls) => shapes.map((s) => `.${cls} > ${s}`))
    .join(',');
  css.push(`${borderSelectors}{stroke-width:${borderThickness} !important}`);

  // ── Lifelines ─────────────────────────────────────────────
  css.push(`.participant-lifeline > line{stroke-width:${lifelineThickness} !important}`);

  // ── Message arrows ────────────────────────────────────────
  // Use DOMParser only for classification (read-only) — no XMLSerializer needed
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgContent, 'image/svg+xml');

  const dashedIds: string[] = [];
  const solidIds: string[] = [];

  doc.querySelectorAll('.message').forEach((group) => {
    if (!group.id) return;
    const hasDashed = group.querySelector('[style*="dasharray"]') !== null;
    if (hasDashed) dashedIds.push(group.id);
    else solidIds.push(group.id);
  });

  const arrowEls = ['line', 'polygon', 'polyline', 'path'];

  if (dashedIds.length > 0) {
    const sel = dashedIds
      .flatMap((id) => arrowEls.map((el) => `#${id} > ${el}`))
      .join(',');
    css.push(`${sel}{stroke-width:${arrowDashedThickness} !important}`);
  }
  if (solidIds.length > 0) {
    const sel = solidIds
      .flatMap((id) => arrowEls.map((el) => `#${id} > ${el}`))
      .join(',');
    css.push(`${sel}{stroke-width:${arrowSolidThickness} !important}`);
  }

  // Inject <style> right after opening <svg ...> tag — no serialization round-trip
  const styleTag = `<style>${css.join('')}</style>`;
  return svgContent.replace(/(<svg[^>]*>)/, `$1${styleTag}`);
}
