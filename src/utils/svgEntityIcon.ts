import type { EntityIcons, EntityType } from '../types/icon';

// Extract y-coordinates from a path/line element
function getYCoords(el: Element): number[] {
  if (el.tagName === 'line') {
    return [
      parseFloat(el.getAttribute('y1') || '0'),
      parseFloat(el.getAttribute('y2') || '0'),
    ];
  }
  const d = el.getAttribute('d') || '';
  const nums = (d.match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
  // Odd-indexed numbers are y coordinates in absolute SVG path commands
  return nums.filter((_, i) => i % 2 === 1);
}

function countMCommands(el: Element): number {
  const d = el.getAttribute('d') || '';
  return (d.match(/[Mm]/g) || []).length;
}

// Classify a group containing a small ellipse into an entity type
function classifyCircleGroup(
  group: Element,
  cy: number,
  ry: number,
): EntityType | null {
  const shapeEls = Array.from(group.children).filter((el) =>
    ['path', 'line', 'polyline'].includes(el.tagName),
  );
  if (shapeEls.length === 0) return null;

  let totalM = 0;
  let hasAbove = false;
  let hasFarBelow = false;

  shapeEls.forEach((el) => {
    totalM += countMCommands(el);
    const ys = getYCoords(el);
    if (ys.some((y) => y < cy - ry * 0.5)) hasAbove = true;
    if (ys.some((y) => y > cy + ry * 3)) hasFarBelow = true;
  });

  // Actor: stick figure — body + 2 arms + 2 legs = 4+ path segments
  if (totalM >= 4) return 'actor';

  // Control: small arrow/arc sits above the circle
  if (hasAbove) return 'control';

  // Boundary: vertical + horizontal lines form a ⊥ that extends far below
  if (hasFarBelow) return 'boundary';

  // Entity: single short horizontal line at the bottom of the circle
  return 'entity';
}

function addImage(
  doc: Document,
  group: Element,
  dataUrl: string,
  x: number,
  y: number,
  size: number,
) {
  const img = doc.createElementNS('http://www.w3.org/2000/svg', 'image');
  img.setAttribute('href', dataUrl);
  img.setAttribute('x', String(x));
  img.setAttribute('y', String(y));
  img.setAttribute('width', String(size));
  img.setAttribute('height', String(size));
  img.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  group.insertBefore(img, group.firstChild);
}

function hideShapeChildren(group: Element) {
  Array.from(group.children).forEach((el) => {
    if (el.tagName !== 'text' && el.tagName !== 'image') {
      (el as SVGElement).style.display = 'none';
    }
  });
}

// Handle Actor / Boundary / Control / Entity (all have a small head ellipse)
function replaceCircleEntities(doc: Document, icons: EntityIcons) {
  const circleTypes = new Set<EntityType>(['actor', 'boundary', 'control', 'entity']);
  const needed = (Object.keys(icons) as EntityType[]).filter((t) => circleTypes.has(t));
  if (needed.length === 0) return;

  Array.from(doc.querySelectorAll('ellipse')).forEach((ellipse) => {
    const rx = parseFloat(ellipse.getAttribute('rx') || '0');
    const ry = parseFloat(ellipse.getAttribute('ry') || '0');
    if (rx < 5 || rx > 14 || ry < 5 || ry > 14) return;

    const cx = parseFloat(ellipse.getAttribute('cx') || '0');
    const cy = parseFloat(ellipse.getAttribute('cy') || '0');
    const group = ellipse.parentElement;
    if (!group) return;

    const type = classifyCircleGroup(group, cy, ry);
    if (!type || !icons[type]) return;

    // Size icon to roughly cover the full entity symbol
    const sizes: Record<EntityType, number> = {
      actor: ry * 9,
      boundary: ry * 5,
      control: ry * 4,
      entity: ry * 3,
      participant: ry * 3,
      database: ry * 3,
      collections: ry * 3,
      queue: ry * 3,
    };
    const size = sizes[type];

    hideShapeChildren(group);
    addImage(doc, group, icons[type]!.dataUrl, cx - size / 2, cy - ry, size);
  });
}

// Handle Participant (rectangular box)
function replaceParticipants(doc: Document, icon: CustomIcon) {
  // Participant boxes: <rect> inside a <g> that also has a <text> child
  // They are usually wider than tall and located at the top of the lifeline
  Array.from(doc.querySelectorAll('g')).forEach((group) => {
    const rects = Array.from(group.children).filter((el) => el.tagName === 'rect');
    const texts = Array.from(group.children).filter((el) => el.tagName === 'text');
    if (rects.length !== 1 || texts.length === 0) return;

    const rect = rects[0] as SVGRectElement;
    const w = parseFloat(rect.getAttribute('width') || '0');
    const h = parseFloat(rect.getAttribute('height') || '0');
    // Participant boxes are wider than tall
    if (w < h || w < 30) return;

    const x = parseFloat(rect.getAttribute('x') || '0');
    const y = parseFloat(rect.getAttribute('y') || '0');
    const size = Math.min(w, h) * 0.8;
    const imgX = x + (w - size) / 2;
    const imgY = y + (h - size) / 2;

    hideShapeChildren(group);
    addImage(doc, group, icon.dataUrl, imgX, imgY, size);
  });
}

// Handle Database (cylinder = 2 ellipses + body path)
function replaceDatabases(doc: Document, icon: CustomIcon) {
  Array.from(doc.querySelectorAll('g')).forEach((group) => {
    const ellipses = Array.from(group.children).filter((el) => el.tagName === 'ellipse');
    if (ellipses.length < 2) return;

    // Pick the topmost ellipse to anchor the icon
    const topEllipse = ellipses.reduce((a, b) => {
      const ay = parseFloat(a.getAttribute('cy') || '0');
      const by = parseFloat(b.getAttribute('cy') || '0');
      return ay < by ? a : b;
    }) as SVGEllipseElement;

    const cx = parseFloat(topEllipse.getAttribute('cx') || '0');
    const cy = parseFloat(topEllipse.getAttribute('cy') || '0');
    const rx = parseFloat(topEllipse.getAttribute('rx') || '0');

    const bottomEllipse = ellipses.find((e) => e !== topEllipse) as SVGEllipseElement;
    const bottomCy = parseFloat(bottomEllipse.getAttribute('cy') || '0');
    const height = bottomCy - cy + parseFloat(bottomEllipse.getAttribute('ry') || '0');
    const size = Math.max(rx * 2, height);

    hideShapeChildren(group);
    addImage(doc, group, icon.dataUrl, cx - size / 2, cy - parseFloat(topEllipse.getAttribute('ry') || '0'), size);
  });
}

// Handle Collections / Queue (stacked rects or rounded rects)
function replaceStackedRects(doc: Document, icon: CustomIcon) {
  Array.from(doc.querySelectorAll('g')).forEach((group) => {
    const rects = Array.from(group.children).filter((el) => el.tagName === 'rect');
    if (rects.length < 2) return;

    // Must also have a text child (participant label)
    const hasText = Array.from(group.children).some((el) => el.tagName === 'text');
    if (!hasText) return;

    const xs = rects.map((r) => parseFloat(r.getAttribute('x') || '0'));
    const ys = rects.map((r) => parseFloat(r.getAttribute('y') || '0'));
    const x = Math.min(...xs);
    const y = Math.min(...ys);
    const maxX = Math.max(...rects.map((r) => parseFloat(r.getAttribute('x') || '0') + parseFloat(r.getAttribute('width') || '0')));
    const maxY = Math.max(...rects.map((r) => parseFloat(r.getAttribute('y') || '0') + parseFloat(r.getAttribute('height') || '0')));
    const size = Math.min(maxX - x, maxY - y);

    hideShapeChildren(group);
    addImage(doc, group, icon.dataUrl, x, y, size);
  });
}

// Re-export CustomIcon so callers don't need to import from two places
import type { CustomIcon } from '../types/icon';

export function injectEntityIconsIntoSvg(svgContent: string, icons: EntityIcons): string {
  if (Object.keys(icons).length === 0) return svgContent;

  const parser = new DOMParser();
  const doc = parser.parseFromString(svgContent, 'image/svg+xml');

  replaceCircleEntities(doc, icons);
  if (icons.participant) replaceParticipants(doc, icons.participant);
  if (icons.database)    replaceDatabases(doc, icons.database);
  if (icons.collections) replaceStackedRects(doc, icons.collections);
  if (icons.queue)       replaceStackedRects(doc, icons.queue);

  return new XMLSerializer().serializeToString(doc.documentElement);
}
