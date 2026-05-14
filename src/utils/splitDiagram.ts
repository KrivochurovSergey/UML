const CUT_RE = /^\s*'?\s*-{3,}\s*cut\s*-{3,}\s*$/im;

export function hasCuts(source: string): boolean {
  return CUT_RE.test(source);
}

// Extract participant/actor/etc. declaration lines from the full inner source
function extractDeclarations(inner: string): string {
  const lines = inner.split('\n');
  const result: string[] = [];

  for (const line of lines) {
    const t = line.trim();
    if (!t || CUT_RE.test(t)) continue;
    if (
      /^(actor|boundary|control|entity|database|collections|queue|participant)\b/i.test(t) ||
      /^(box|end\s+box)\b/i.test(t) ||
      /^(hide|show|autonumber)\b/i.test(t)
    ) {
      result.push(line);
    }
  }

  return result.join('\n');
}

// Split a PlantUML source into N renderable parts.
// Part 0 keeps its original content.
// Parts 1+ get all entity declarations prepended so actors/participants stay visible.
export function splitDiagramSource(source: string): string[] {
  const inner = source
    .replace(/^\s*@startuml[^\n]*\n?/im, '')
    .replace(/\n?\s*@enduml\s*$/im, '');

  const chunks = inner.split(CUT_RE);
  if (chunks.length <= 1) return [source];

  const decls = extractDeclarations(inner);

  return chunks.map((chunk, i) => {
    const body = chunk.trim();
    if (i === 0) {
      return `@startuml\n${body}\n@enduml`;
    }
    return `@startuml\n${decls}\n\n${body}\n@enduml`;
  });
}
