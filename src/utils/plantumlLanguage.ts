import { StreamLanguage, LanguageSupport } from '@codemirror/language';

const KEYWORDS = new Set([
  'actor', 'participant', 'boundary', 'control', 'entity', 'database',
  'collections', 'queue', 'box', 'end', 'note', 'rnote', 'hnote',
  'activate', 'deactivate', 'destroy', 'create',
  'loop', 'alt', 'else', 'opt', 'par', 'break', 'critical', 'group', 'ref',
  'over', 'left', 'right', 'of',
  'title', 'header', 'footer', 'legend', 'newpage',
  'autonumber', 'hide', 'show', 'skinparam', 'as',
  'return', 'delay', 'space',
]);

const plantumlStream = StreamLanguage.define<{ inBlockComment: boolean }>({
  name: 'plantuml',

  startState: () => ({ inBlockComment: false }),

  token(stream, state) {
    // Block comment /' ... '/
    if (state.inBlockComment) {
      if (stream.match("'/")) state.inBlockComment = false;
      else stream.next();
      return 'comment';
    }
    if (stream.match("/'")) { state.inBlockComment = true; return 'comment'; }

    // Line comment ' …
    if (stream.peek() === "'" ) { stream.skipToEnd(); return 'comment'; }

    // @startuml / @enduml
    if (stream.match(/^@(start|end)\w+/i)) return 'meta';

    // Separator == text ==
    if (stream.sol() && stream.match(/^==\s*.+\s*==/)) return 'hr';

    // Hex / named color  #FF0000 or #Red
    if (stream.match(/^#([0-9A-Fa-f]{3,8}|[A-Za-z]\w*)/)) return 'number';

    // String literal "…"
    if (stream.match('"')) {
      while (!stream.eol()) { if (stream.next() === '"') break; }
      return 'string';
    }

    // Arrows — longest match first
    if (stream.match(/^(<->|<<--|-->>|-+>>|<<-+|->o|->x|-\/\/->|-\/->|\/\/-->|\/-->|\/->|--+>|<--+|-+>|<-+)/)) {
      return 'operator';
    }

    // Identifier / keyword
    if (stream.match(/^[a-zA-Z_]\w*/)) {
      return KEYWORDS.has(stream.current().toLowerCase()) ? 'keyword' : null;
    }

    stream.next();
    return null;
  },
});

export const plantumlLanguage = new LanguageSupport(plantumlStream);
