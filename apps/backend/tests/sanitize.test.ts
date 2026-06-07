import { describe, it, expect } from 'vitest';
import { sanitizeSvg } from '../src/lib/sanitize.js';

describe('sanitizeSvg', () => {
  it('removes script tags and event handlers', () => {
    const dirty = `<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><script>alert(1)</script><rect width="10" height="10" fill="red"/></svg>`;
    const clean = sanitizeSvg(dirty);
    expect(clean).not.toContain('<script');
    expect(clean).not.toContain('onload');
    expect(clean).toContain('<rect');
  });

  it('strips DOCTYPE and xml processing instructions', () => {
    const dirty = `<?xml version="1.0"?><!DOCTYPE svg [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>`;
    const clean = sanitizeSvg(dirty);
    expect(clean).not.toMatch(/<!DOCTYPE/i);
    expect(clean).not.toMatch(/<\?xml/);
  });

  it('keeps safe SVG primitives intact', () => {
    const safe = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" fill="blue"/><path d="M0 0 L10 10" stroke="black"/></svg>`;
    const clean = sanitizeSvg(safe);
    expect(clean).toContain('<circle');
    expect(clean).toContain('<path');
  });

  it('strips foreignObject', () => {
    const dirty = `<svg xmlns="http://www.w3.org/2000/svg"><foreignObject><iframe src="javascript:alert(1)"/></foreignObject><rect width="1" height="1"/></svg>`;
    const clean = sanitizeSvg(dirty);
    expect(clean).not.toContain('<foreignObject');
    expect(clean).not.toContain('<iframe');
  });

  it('returns empty string for empty input', () => {
    expect(sanitizeSvg('')).toBe('');
  });
});
