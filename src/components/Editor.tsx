import { useRef, forwardRef, useImperativeHandle } from 'react';
import CodeMirror, { type ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { oneDark } from '@codemirror/theme-one-dark';
import { plantumlLanguage } from '../utils/plantumlLanguage';

export interface EditorHandle {
  insertAtCursor: (code: string) => void;
}

interface Props {
  source: string;
  onChange: (value: string) => void;
  isDark: boolean;
}

export const Editor = forwardRef<EditorHandle, Props>(function Editor({ source, onChange, isDark }, ref) {
  const cmRef = useRef<ReactCodeMirrorRef>(null);

  useImperativeHandle(ref, () => ({
    insertAtCursor(code: string) {
      const view = cmRef.current?.view;
      if (!view) return;
      const { from } = view.state.selection.main;
      const insert = '\n' + code + '\n';
      view.dispatch({ changes: { from, insert }, selection: { anchor: from + insert.length } });
      view.focus();
    },
  }));

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-3 py-1.5 bg-gray-100 border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 font-medium shrink-0">
        PlantUML
      </div>
      <div className="flex-1 overflow-hidden">
        <CodeMirror
          ref={cmRef}
          value={source}
          onChange={onChange}
          theme={isDark ? oneDark : 'light'}
          extensions={[plantumlLanguage]}
          height="100%"
          style={{ height: '100%', fontSize: '13px' }}
          basicSetup={{
            lineNumbers: true,
            foldGutter: false,
            dropCursor: false,
            allowMultipleSelections: false,
            indentOnInput: false,
            bracketMatching: true,
            closeBrackets: false,
            autocompletion: false,
            rectangularSelection: false,
            crosshairCursor: false,
            highlightActiveLine: true,
            highlightSelectionMatches: true,
            closeBracketsKeymap: false,
            searchKeymap: true,
          }}
        />
      </div>
    </div>
  );
});
