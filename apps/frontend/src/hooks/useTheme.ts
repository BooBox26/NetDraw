// Theme management — respects `prefers-color-scheme` and persists preference.

import { useEffect } from 'react';
import { useStore } from '../state/store';

export function useTheme(): void {
  const theme = useStore((s) => s.ui.theme);
  useEffect(() => {
    const root = document.documentElement;
    const apply = (): void => {
      const isDark =
        theme === 'dark' ||
        (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      root.classList.toggle('dark', isDark);
    };
    apply();
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener('change', apply);
      return () => mq.removeEventListener('change', apply);
    }
    return undefined;
  }, [theme]);
}
