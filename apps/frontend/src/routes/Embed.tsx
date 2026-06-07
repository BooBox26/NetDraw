// Embed route — read-only viewer for an iframe. No toolbar, no editing.
// Uses the same loader/auto-save logic as Editor but disables mutations.

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Canvas } from '../canvas/Canvas';
import { useStore } from '../state/store';
import { useTheme } from '../hooks/useTheme';
import { api } from '../types/api';
import { createDefaultDiagram, type Diagram } from '../types/diagram';

export function Embed(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const setDiagram = useStore((s) => s.setDiagram);
  const fitToContent = useStore((s) => s.fitToContent);

  useTheme();

  useEffect(() => {
    if (!id) {
      setDiagram(createDefaultDiagram(), { record: false });
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const project = await api.getProject(id);
        if (cancelled) return;
        let diagramData: Diagram;
        try {
          diagramData =
            typeof project.data === 'string'
              ? JSON.parse(project.data)
              : (project.data as unknown as Diagram);
        } catch {
          diagramData = createDefaultDiagram();
        }
        setDiagram(diagramData, { record: false });
        setLoading(false);
        // Defer fit so the canvas has measured itself.
        setTimeout(() => fitToContent(), 50);
      } catch (err) {
        if (cancelled) return;
        setError((err as Error).message);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, setDiagram, fitToContent]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500 text-sm">Loading…</div>
    );
  }
  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-rose-500 text-sm">{error}</div>
    );
  }
  return (
    <div className="h-full w-full bg-white dark:bg-slate-900">
      <Canvas projectId={id ?? null} />
    </div>
  );
}
