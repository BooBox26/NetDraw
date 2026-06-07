// External icon library metadata. We don't bundle the entire SVG catalog
// (would blow up the bundle); instead, we expose the most common Lucide /
// Heroicons / Tabler icons as data URIs so the picker works offline and the
// library ships in a single chunk. The full catalog is available via the
// CDN link shown in the picker.

export interface IconEntry {
  id: string;
  label: string;
  source: 'lucide' | 'heroicons' | 'tabler' | 'custom';
  /** Inline SVG body (24x24 viewBox). */
  svg: string;
  tags?: string[];
}

const wrap = (inner: string): string => inner.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');

/** A small, curated Lucide-style stroke set. Add more as needed. */
const lucideSubset: IconEntry[] = [
  {
    id: 'lu-activity',
    label: 'Activity',
    source: 'lucide',
    tags: ['chart', 'pulse'],
    svg: wrap(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>'
    ),
  },
  {
    id: 'lu-airplay',
    label: 'Airplay',
    source: 'lucide',
    tags: ['screen', 'cast'],
    svg: wrap(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-1"/><polygon points="12 15 17 21 7 21 12 15"/></svg>'
    ),
  },
  {
    id: 'lu-alert-circle',
    label: 'Alert',
    source: 'lucide',
    tags: ['warn', 'error'],
    svg: wrap(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
    ),
  },
  {
    id: 'lu-archive',
    label: 'Archive',
    source: 'lucide',
    tags: ['box'],
    svg: wrap(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>'
    ),
  },
  {
    id: 'lu-bell',
    label: 'Bell',
    source: 'lucide',
    svg: wrap(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>'
    ),
  },
  {
    id: 'lu-book',
    label: 'Book',
    source: 'lucide',
    svg: wrap(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>'
    ),
  },
  {
    id: 'lu-briefcase',
    label: 'Briefcase',
    source: 'lucide',
    tags: ['work', 'business'],
    svg: wrap(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>'
    ),
  },
  {
    id: 'lu-calendar',
    label: 'Calendar',
    source: 'lucide',
    tags: ['date', 'event'],
    svg: wrap(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>'
    ),
  },
  {
    id: 'lu-camera',
    label: 'Camera',
    source: 'lucide',
    svg: wrap(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>'
    ),
  },
  {
    id: 'lu-cloud',
    label: 'Cloud',
    source: 'lucide',
    tags: ['weather'],
    svg: wrap(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>'
    ),
  },
  {
    id: 'lu-code',
    label: 'Code',
    source: 'lucide',
    tags: ['dev', 'programming'],
    svg: wrap(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>'
    ),
  },
  {
    id: 'lu-coffee',
    label: 'Coffee',
    source: 'lucide',
    svg: wrap(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>'
    ),
  },
  {
    id: 'lu-database',
    label: 'Database',
    source: 'lucide',
    tags: ['storage', 'db'],
    svg: wrap(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>'
    ),
  },
  {
    id: 'lu-download',
    label: 'Download',
    source: 'lucide',
    svg: wrap(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>'
    ),
  },
  {
    id: 'lu-folder',
    label: 'Folder',
    source: 'lucide',
    tags: ['directory'],
    svg: wrap(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>'
    ),
  },
  {
    id: 'lu-git-branch',
    label: 'Git branch',
    source: 'lucide',
    tags: ['vcs'],
    svg: wrap(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>'
    ),
  },
  {
    id: 'lu-globe',
    label: 'Globe',
    source: 'lucide',
    tags: ['world', 'web'],
    svg: wrap(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>'
    ),
  },
  {
    id: 'lu-hard-drive',
    label: 'Hard drive',
    source: 'lucide',
    tags: ['storage', 'disk'],
    svg: wrap(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="12" x2="2" y2="12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><line x1="6" y1="16" x2="6.01" y2="16"/><line x1="10" y1="16" x2="10.01" y2="16"/></svg>'
    ),
  },
  {
    id: 'lu-key',
    label: 'Key',
    source: 'lucide',
    tags: ['auth', 'security'],
    svg: wrap(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>'
    ),
  },
  {
    id: 'lu-lock',
    label: 'Lock',
    source: 'lucide',
    tags: ['security', 'private'],
    svg: wrap(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>'
    ),
  },
  {
    id: 'lu-mail',
    label: 'Mail',
    source: 'lucide',
    tags: ['email', 'message'],
    svg: wrap(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>'
    ),
  },
  {
    id: 'lu-map-pin',
    label: 'Map pin',
    source: 'lucide',
    tags: ['location'],
    svg: wrap(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>'
    ),
  },
  {
    id: 'lu-monitor',
    label: 'Monitor',
    source: 'lucide',
    tags: ['screen', 'display'],
    svg: wrap(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>'
    ),
  },
  {
    id: 'lu-package',
    label: 'Package',
    source: 'lucide',
    tags: ['box'],
    svg: wrap(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>'
    ),
  },
  {
    id: 'lu-phone',
    label: 'Phone',
    source: 'lucide',
    tags: ['call', 'mobile'],
    svg: wrap(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>'
    ),
  },
  {
    id: 'lu-search',
    label: 'Search',
    source: 'lucide',
    svg: wrap(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>'
    ),
  },
  {
    id: 'lu-server',
    label: 'Server',
    source: 'lucide',
    tags: ['rack', 'compute'],
    svg: wrap(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>'
    ),
  },
  {
    id: 'lu-settings',
    label: 'Settings',
    source: 'lucide',
    tags: ['gear', 'cog'],
    svg: wrap(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>'
    ),
  },
  {
    id: 'lu-shield',
    label: 'Shield',
    source: 'lucide',
    tags: ['security', 'protection'],
    svg: wrap(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>'
    ),
  },
  {
    id: 'lu-shopping-cart',
    label: 'Shopping cart',
    source: 'lucide',
    svg: wrap(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>'
    ),
  },
  {
    id: 'lu-terminal',
    label: 'Terminal',
    source: 'lucide',
    tags: ['cli', 'shell'],
    svg: wrap(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>'
    ),
  },
  {
    id: 'lu-truck',
    label: 'Truck',
    source: 'lucide',
    svg: wrap(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>'
    ),
  },
  {
    id: 'lu-user',
    label: 'User',
    source: 'lucide',
    tags: ['person'],
    svg: wrap(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'
    ),
  },
  {
    id: 'lu-users',
    label: 'Users',
    source: 'lucide',
    tags: ['team', 'people'],
    svg: wrap(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>'
    ),
  },
  {
    id: 'lu-zap',
    label: 'Zap',
    source: 'lucide',
    tags: ['lightning', 'power'],
    svg: wrap(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>'
    ),
  },
];

export const LUCIDE_ICONS = lucideSubset;

export const HEROICON_LINKS = [
  { label: 'Heroicons (CDN)', url: 'https://unpkg.com/heroicons@2.1.5/24/outline/' },
];
export const TABLER_LINKS = [
  { label: 'Tabler Icons (CDN)', url: 'https://unpkg.com/@tabler/icons@3.19.0/icons/outline/' },
];

/** Search the embedded icon catalog. */
export function searchIcons(query: string): IconEntry[] {
  if (!query.trim()) return LUCIDE_ICONS;
  const q = query.toLowerCase();
  return LUCIDE_ICONS.filter(
    (i) =>
      i.label.toLowerCase().includes(q) ||
      i.id.toLowerCase().includes(q) ||
      i.tags?.some((t) => t.toLowerCase().includes(q))
  );
}

/** Build a Shape from an inline SVG string. The SVG is stored as `data.svg`
 *  and used by the renderer. */
export function shapeFromSvg(
  svg: string,
  world: { x: number; y: number }
): import('../types/diagram').Shape {
  // Estimate dimensions from viewBox
  const m = /viewBox=["']([\d.\-\s]+)["']/.exec(svg);
  let w = 48;
  let h = 48;
  if (m && m[1]) {
    const parts = m[1].trim().split(/\s+/).map(Number);
    if (parts.length === 4 && parts.every(Number.isFinite)) {
      const viewBoxWidth = parts[2];
      const viewBoxHeight = parts[3];
      if (viewBoxWidth > 0 && viewBoxHeight > 0) {
        const maxDim = 48;
        const scale = maxDim / Math.max(viewBoxWidth, viewBoxHeight);
        w = Math.round(viewBoxWidth * scale);
        h = Math.round(viewBoxHeight * scale);
      }
    }
  }
  return {
    id: `svg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: 'image',
    x: world.x - w / 2,
    y: world.y - h / 2,
    width: w,
    height: h,
    rotation: 0,
    style: { fill: 'transparent', stroke: '#1f2937', strokeWidth: 1.5, opacity: 1 },
    data: { svg },
  };
}
