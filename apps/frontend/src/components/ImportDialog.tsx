// Multi-format import dialog. Supports Mermaid, draw.io XML, and raw SVG
// either pasted as text or uploaded as a file. The chosen diagram replaces
// or merges into the current content (default: merge).

import { useRef, useState } from 'react';
import { importMermaid, importDrawio, importVisioVdx } from '../lib/importers';
import { importSvgString } from '../lib/serializer';
import { useStore } from '../state/store';

type Format = 'mermaid' | 'drawio' | 'svg' | 'visio';

export function ImportDialog({
  initialFormat = 'mermaid',
  onClose,
}: {
  initialFormat?: Format;
  onClose: () => void;
}): JSX.Element {
  const [format, setFormat] = useState<Format>(initialFormat);
  const [text, setText] = useState('');
  const [mode, setMode] = useState<'merge' | 'replace'>('merge');
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const pushToast = useStore((s) => s.pushToast);

  const handleFile = async (file: File): Promise<void> => {
    const content = await file.text();
    setText(content);
  };

  const doImport = (): void => {
    setError(null);
    try {
      let result: { nodes: number; edges: number } | { added: number };
      if (format === 'mermaid') {
        result = importMermaid(text, { replace: mode === 'replace' });
        pushToast({
          kind: 'success',
          message: `Imported ${result.nodes} nodes / ${result.edges} edges`,
        });
      } else if (format === 'drawio') {
        result = importDrawio(text, { replace: mode === 'replace' });
        pushToast({
          kind: 'success',
          message: `Imported ${result.nodes} nodes / ${result.edges} edges`,
        });
      } else if (format === 'visio') {
        result = importVisioVdx(text, { replace: mode === 'replace' });
        pushToast({
          kind: 'success',
          message: `Imported ${result.nodes} nodes / ${result.edges} edges from Visio VDX`,
        });
      } else {
        result = importSvgString(text);
        pushToast({ kind: 'success', message: `Imported ${result.added} shapes` });
      }
      onClose();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-[760px] max-w-full max-h-[80vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xl flex flex-col overflow-hidden">
        <div className="px-4 h-12 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-base font-medium">Import</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
          >
            ✕
          </button>
        </div>
        <div className="px-4 py-3 flex items-center gap-2 border-b border-slate-200 dark:border-slate-700">
          <span className="text-xs text-slate-500">Format:</span>
          {(['mermaid', 'drawio', 'svg', 'visio'] as Format[]).map((f) => (
            <button
              type="button"
              key={f}
              onClick={() => setFormat(f)}
              className={`h-7 px-3 rounded text-xs ${
                format === f
                  ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                  : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {f === 'drawio' ? 'draw.io' : f.toUpperCase()}
            </button>
          ))}
          <span className="text-xs text-slate-500 ml-4">Mode:</span>
          {(['merge', 'replace'] as const).map((m) => (
            <button
              type="button"
              key={m}
              onClick={() => setMode(m)}
              className={`h-7 px-3 rounded text-xs ${
                mode === m
                  ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                  : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {m}
            </button>
          ))}
          <span className="flex-1" />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="h-7 px-3 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs"
          >
            Load file…
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".mmd,.txt,.drawio,.xml,.svg"
            className="hidden"
            onChange={(e) => {
              const f = e.currentTarget.files?.[0];
              if (f) void handleFile(f);
            }}
          />
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.currentTarget.value)}
          placeholder={placeholderFor(format)}
          className="flex-1 min-h-[280px] p-3 font-mono text-xs bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-700 outline-none resize-none"
        />
        {error ? (
          <div className="px-4 py-2 text-xs text-rose-600 dark:text-rose-400 border-b border-slate-200 dark:border-slate-700 bg-rose-50 dark:bg-rose-900/20">
            {error}
          </div>
        ) : null}
        <div className="px-4 py-2 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-8 px-3 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={doImport}
            disabled={!text.trim()}
            className="h-8 px-3 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Import
          </button>
        </div>
      </div>
    </div>
  );
}

function placeholderFor(f: Format): string {
  if (f === 'mermaid')
    return 'graph TD\n  A[Start] --> B{Decision}\n  B -->|Yes| C[OK]\n  B -->|No| D[Cancel]';
  if (f === 'drawio')
    return '<mxfile>\n  <diagram name="Page-1">\n    <mxGraphModel>...</mxGraphModel>\n  </diagram>\n</mxfile>';
  if (f === 'visio')
    return '<VisioDocument xmlns="http://schemas.microsoft.com/visio/2003/core">\n  <Pages>\n    <Page ID="0">\n      <Shapes>\n        <Shape ID="1" NameU="router" Master="5">\n          <XForm>\n            <PinX>2.5</PinX>\n            <PinY>4.0</PinY>\n            <Width>1.2</Width>\n            <Height>0.8</Height>\n          </XForm>\n          <Text>Core-Router-01</Text>\n          <Prop NameU="IP"><Value>10.0.0.1</Value></Prop>\n        </Shape>\n      </Shapes>\n    </Page>\n  </Pages>\n</VisioDocument>';
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">\n  <rect x="10" y="10" width="80" height="80" fill="#ddd" />\n</svg>';
}
