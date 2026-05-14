import type { CustomIcon } from '../types/icon';

function getSegmentInfo(el: Element): { segments: number; xs: number[]; ys: number[] } {
  const xs: number[] = [];
  const ys: number[] = [];

  if (el.tagName === 'line') {
    const x1 = parseFloat(el.getAttribute('x1') || '0');
    const y1 = parseFloat(el.getAttribute('y1') || '0');
    const x2 = parseFloat(el.getAttribute('x2') || '0');
    const y2 = parseFloat(el.getAttribute('y2') || '0');
    xs.push(x1, x2);
    ys.push(y1, y2);
    return { segments: 1, xs, ys };
  }

  const d = el.getAttribute('d') || '';
  const mCount = (d.match(/[Mm]/g) || []).length;
  const nums = (d.match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
  for (let i = 0; i + 1 < nums.length; i += 2) {
    xs.push(nums[i]);
    ys.push(nums[i + 1]);
  }
  return { segments: mCount, xs, ys };
}

// Reliable actor detection:
// A stick-figure actor has 4+ line segments (body + 2 arms + 2 legs)
// that extend both left AND right of the head center AND below the head.
// No other PlantUML entity type satisfies all three conditions.
function isActorGroup(group: Element, cx: number, cy: number, ry: number): boolean {
  const shapeEls = Array.from(group.children).filter((el) =>
    ['path', 'line', 'polyline'].includes(el.tagName),
  );
  if (shapeEls.length === 0) return false;

  let totalSegments = 0;
  let hasLeft = false;
  let hasRight = false;
  let hasBelow = false;

  for (const el of shapeEls) {
    const { segments, xs, ys } = getSegmentInfo(el);
    totalSegments += segments;

    for (const x of xs) {
      if (x < cx - 2) hasLeft = true;
      if (x > cx + 2) hasRight = true;
    }
    for (const y of ys) {
      if (y > cy + ry) hasBelow = true;
    }
  }

  return totalSegments >= 4 && hasLeft && hasRight && hasBelow;
}

// Compute the bounding box of all shape elements (excluding text) in a group
function getShapesBBox(group: Element): { minX: number; minY: number; maxX: number; maxY: number } | null {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  let found = false;

  Array.from(group.children).forEach((el) => {
    if (el.tagName === 'text' || el.tagName === 'image') return;

    const coords: Array<[number, number]> = [];

    if (el.tagName === 'ellipse') {
      const cx = parseFloat(el.getAttribute('cx') || '0');
      const cy = parseFloat(el.getAttribute('cy') || '0');
      const rx = parseFloat(el.getAttribute('rx') || '0');
      const ry = parseFloat(el.getAttribute('ry') || '0');
      coords.push([cx - rx, cy - ry], [cx + rx, cy + ry]);
    } else if (el.tagName === 'line') {
      coords.push(
        [parseFloat(el.getAttribute('x1') || '0'), parseFloat(el.getAttribute('y1') || '0')],
        [parseFloat(el.getAttribute('x2') || '0'), parseFloat(el.getAttribute('y2') || '0')],
      );
    } else if (el.tagName === 'path' || el.tagName === 'polyline') {
      const d = el.getAttribute('d') || el.getAttribute('points') || '';
      const nums = (d.match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
      for (let i = 0; i + 1 < nums.length; i += 2) {
        coords.push([nums[i], nums[i + 1]]);
      }
    }

    for (const [x, y] of coords) {
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      found = true;
    }
  });

  return found ? { minX, minY, maxX, maxY } : null;
}

export function injectActorIconIntoSvg(svgContent: string, icon: CustomIcon): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgContent, 'image/svg+xml');

  Array.from(doc.querySelectorAll('ellipse')).forEach((ellipse) => {
    const rx = parseFloat(ellipse.getAttribute('rx') || '0');
    const ry = parseFloat(ellipse.getAttribute('ry') || '0');
    if (rx < 5 || rx > 14 || ry < 5 || ry > 14) return;

    const cx = parseFloat(ellipse.getAttribute('cx') || '0');
    const cy = parseFloat(ellipse.getAttribute('cy') || '0');
    const group = ellipse.parentElement;
    if (!group) return;

    if (!isActorGroup(group, cx, cy, ry)) return;

    // Measure the actual stick-figure bounding box before hiding anything
    const bbox = getShapesBBox(group);
    if (!bbox) return;

    // Hide stick-figure elements, keep text label
    Array.from(group.children).forEach((el) => {
      if (el.tagName !== 'text' && el.tagName !== 'image') {
        (el as SVGElement).style.display = 'none';
      }
    });

    // Place icon to fill exactly the stick-figure area
    const w = bbox.maxX - bbox.minX;
    const h = bbox.maxY - bbox.minY;
    const size = Math.max(w, h); // keep it square

    const img = doc.createElementNS('http://www.w3.org/2000/svg', 'image');
    img.setAttribute('href', icon.dataUrl);
    img.setAttribute('x', String(cx - size / 2));
    img.setAttribute('y', String(bbox.minY));
    img.setAttribute('width', String(size));
    img.setAttribute('height', String(h));
    img.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    group.insertBefore(img, group.firstChild);
  });

  return new XMLSerializer().serializeToString(doc.documentElement);
}
