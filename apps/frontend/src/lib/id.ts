// Tiny ID generator that doesn't depend on any library.
// Format: nd-<base36 timestamp>-<random>
export function makeId(prefix = 'nd'): string {
  const t = Date.now().toString(36);
  const r = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${t}-${r}`;
}

export function shortId(): string {
  return Math.random().toString(36).slice(2, 8);
}
