// Lightweight markdown → inline-renderable HTML for shape labels.
// Supports: **bold**, *italic*, `code`, [text](url), and line breaks.
// Everything else is escaped. We deliberately avoid a heavy dependency.

export interface MarkdownToken {
  kind: 'text' | 'bold' | 'italic' | 'code' | 'link';
  text: string;
  href?: string;
  children?: MarkdownToken[];
}

export function tokenize(input: string): MarkdownToken[] {
  const out: MarkdownToken[] = [];
  let i = 0;
  let buf = '';
  const flush = (): void => {
    if (buf) {
      out.push({ kind: 'text', text: buf });
      buf = '';
    }
  };
  while (i < input.length) {
    // Line break
    if (input[i] === '\n') {
      flush();
      out.push({ kind: 'text', text: '\n' });
      i++;
      continue;
    }
    // Bold **...**
    if (input.startsWith('**', i)) {
      const end = input.indexOf('**', i + 2);
      if (end > i + 2) {
        flush();
        out.push({ kind: 'bold', text: input.slice(i + 2, end) });
        i = end + 2;
        continue;
      }
    }
    // Italic *...* (but not **)
    if (input[i] === '*' && input[i + 1] !== '*') {
      const end = input.indexOf('*', i + 1);
      if (end > i + 1) {
        flush();
        out.push({ kind: 'italic', text: input.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }
    // Code `...`
    if (input[i] === '`') {
      const end = input.indexOf('`', i + 1);
      if (end > i) {
        flush();
        out.push({ kind: 'code', text: input.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }
    // Link [text](url)
    if (input[i] === '[') {
      const close = input.indexOf(']', i + 1);
      if (close > i && input[close + 1] === '(') {
        const urlEnd = input.indexOf(')', close + 2);
        if (urlEnd > close + 2) {
          flush();
          out.push({
            kind: 'link',
            text: input.slice(i + 1, close),
            href: input.slice(close + 2, urlEnd),
          });
          i = urlEnd + 1;
          continue;
        }
      }
    }
    buf += input[i];
    i++;
  }
  flush();
  return out;
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function renderInline(input: string): string {
  return tokenize(input)
    .map((t) => {
      if (t.kind === 'text') {
        if (t.text === '\n') return '<br/>';
        return escapeHtml(t.text);
      }
      if (t.kind === 'bold') return `<strong>${escapeHtml(t.text)}</strong>`;
      if (t.kind === 'italic') return `<em>${escapeHtml(t.text)}</em>`;
      if (t.kind === 'code')
        return `<code style="font-family:ui-monospace,monospace;background:rgba(0,0,0,0.08);padding:0 4px;border-radius:3px">${escapeHtml(t.text)}</code>`;
      if (t.kind === 'link') {
        const safe = (t.href ?? '').replace(/"/g, '&quot;');
        return `<a href="${safe}" data-nd-link="1" target="_blank" rel="noopener" style="color:#2563eb;text-decoration:underline">${escapeHtml(t.text)}</a>`;
      }
      return '';
    })
    .join('');
}
