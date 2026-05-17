/**
 * Extracts the human-readable font family name from a TTF / OTF binary.
 * Falls back to null for WOFF2 (Brotli-compressed, can't parse without a lib)
 * and for any unrecognised format.
 *
 * The OpenType 'name' table stores strings in multiple platforms/encodings.
 * We prefer: Full name (nameID 4) › Family name (nameID 1),
 * and within each: Windows UTF-16 English › Windows UTF-16 any › Mac Roman.
 */
export function extractFontName(buffer: ArrayBuffer): string | null {
  try {
    const view = new DataView(buffer);

    // ── Detect format ────────────────────────────────────────────────────────
    const magic = view.getUint32(0);
    const MAGIC_TTF  = 0x00010000;
    const MAGIC_OTF  = 0x4F54544F; // 'OTTO'
    const MAGIC_TRUE = 0x74727565; // 'true' (old Apple TTF)
    const MAGIC_WOFF = 0x774F4646; // 'wOFF'

    let nameTableOffset = -1;
    let __nameTableLength = -1;
    let isUncompressed = true;

    if (magic === MAGIC_TTF || magic === MAGIC_OTF || magic === MAGIC_TRUE) {
      // Standard sfnt (TTF / OTF)
      const numTables = view.getUint16(4);
      for (let i = 0; i < numTables; i++) {
        const dir = 12 + i * 16;
        const tag = readTag(view, dir);
        if (tag === 'name') {
          nameTableOffset = view.getUint32(dir + 8);
          _nameTableLength = view.getUint32(dir + 12);
          break;
        }
      }
    } else if (magic === MAGIC_WOFF) {
      // WOFF — same table structure, optionally zlib-compressed per table
      const numTables = view.getUint16(12);
      for (let i = 0; i < numTables; i++) {
        const dir = 48 + i * 20;
        const tag = readTag(view, dir);
        if (tag === 'name') {
          nameTableOffset = view.getUint32(dir + 4);
          const compLength = view.getUint32(dir + 8);
          const origLength = view.getUint32(dir + 12);
          _nameTableLength = compLength;
          isUncompressed = compLength === origLength;
          break;
        }
      }
    } else {
      // WOFF2 (Brotli) or unknown — give up
      return null;
    }

    if (nameTableOffset === -1 || !isUncompressed) return null;

    // ── Parse 'name' table ───────────────────────────────────────────────────
    const base = nameTableOffset;
    const count = view.getUint16(base + 2);
    const stringOffset = view.getUint16(base + 4);
    const strBase = base + stringOffset;

    type Record = { nameID: number; platformID: number; langID: number; offset: number; length: number };
    const records: Record[] = [];

    for (let i = 0; i < count; i++) {
      const r = base + 6 + i * 12;
      const nameID = view.getUint16(r + 6);
      if (nameID !== 1 && nameID !== 4) continue; // only Family / Full name
      records.push({
        nameID,
        platformID: view.getUint16(r),
        langID:     view.getUint16(r + 4),
        offset:     view.getUint16(r + 10),
        length:     view.getUint16(r + 8),
      });
    }

    const readString = (rec: Record): string => {
      const bytes = new Uint8Array(buffer, strBase + rec.offset, rec.length);
      if (rec.platformID === 3) {
        // Windows — UTF-16 BE
        let s = '';
        for (let i = 0; i < bytes.length - 1; i += 2)
          s += String.fromCodePoint((bytes[i] << 8) | bytes[i + 1]);
        return s.trim();
      }
      // Mac Roman — treat as Latin-1
      return Array.from(bytes, (b) => String.fromCharCode(b)).join('').trim();
    };

    // Priority: nameID=4 Windows English › nameID=4 Windows › nameID=1 Windows English
    //         › nameID=1 Windows › nameID=4 Mac › nameID=1 Mac
    const EN_US = 0x0409;
    const priorities: Array<(r: Record) => boolean> = [
      (r) => r.nameID === 4 && r.platformID === 3 && r.langID === EN_US,
      (r) => r.nameID === 4 && r.platformID === 3,
      (r) => r.nameID === 1 && r.platformID === 3 && r.langID === EN_US,
      (r) => r.nameID === 1 && r.platformID === 3,
      (r) => r.nameID === 4 && r.platformID === 1,
      (r) => r.nameID === 1 && r.platformID === 1,
    ];

    for (const check of priorities) {
      const rec = records.find(check);
      if (rec) {
        const name = readString(rec);
        if (name) return name;
      }
    }

    return null;
  } catch {
    return null;
  }
}

function readTag(view: DataView, offset: number): string {
  return String.fromCharCode(
    view.getUint8(offset),
    view.getUint8(offset + 1),
    view.getUint8(offset + 2),
    view.getUint8(offset + 3),
  );
}

/** Derive MIME type from file extension */
export function getFontMimeType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'otf':   return 'font/otf';
    case 'woff':  return 'font/woff';
    case 'woff2': return 'font/woff2';
    default:      return 'font/ttf';
  }
}

/** Convert ArrayBuffer → base64 data URL (avoids stack overflow on large files) */
export function bufferToDataUrl(buffer: ArrayBuffer, mimeType: string): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk)
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  return `data:${mimeType};base64,${btoa(binary)}`;
}
