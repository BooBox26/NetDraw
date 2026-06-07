// Dashboard route — list of projects, create / open / delete.

import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, ApiError } from '../types/api';
import type { ProjectSummary } from '../types/diagram';
import { useStore } from '../state/store';
import { createDefaultDiagram } from '../types/diagram';
import { useTheme } from '../hooks/useTheme';
import { ToolToast } from '../components/Toasts';

export function Dashboard(): JSX.Element {
  useTheme();
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const pushToast = useStore((s) => s.pushToast);
  const setDiagram = useStore((s) => s.setDiagram);
  const history = useStore((s) => s.history);

  useEffect(() => {
    void load();
  }, []);

  const load = async (): Promise<void> => {
    try {
      const list = await api.listProjects();
      setProjects(list);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : (err as Error).message);
      setProjects([]);
    }
  };

  const importFileRef = useRef<HTMLInputElement | null>(null);

  const onImportProject = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { decompressBlob, repairDiagram } = await import('../lib/compression');
      const decompressed = await decompressBlob(file);
      const rawData = JSON.parse(decompressed);
      const { diagram: repaired, warnings } = repairDiagram(rawData);

      const newProj = await api.createProject({
        name: file.name.replace(/\.ndj$/, '') || 'Imported Diagram',
        data: repaired,
      });

      setProjects((prev) => (prev ? [newProj, ...prev] : null));
      if (warnings.length > 0) {
        pushToast({ kind: 'info', message: `Imported with repairs: ${warnings[0]}` });
      } else {
        pushToast({ kind: 'success', message: 'Project imported successfully' });
      }
    } catch (err) {
      pushToast({ kind: 'error', message: `Import failed: ${(err as Error).message}` });
    } finally {
      if (importFileRef.current) importFileRef.current.value = '';
    }
  };

  const createBlank = async (): Promise<void> => {
    try {
      const created = await api.createProject({
        name: 'Untitled diagram',
        data: createDefaultDiagram(),
      });
      navigate(`/editor/${created.id}`);
    } catch (err) {
      pushToast({ kind: 'error', message: `Create failed: ${(err as Error).message}` });
    }
  };

  const onDelete = async (id: string): Promise<void> => {
    if (!confirm('Delete this project?')) return;
    try {
      await api.deleteProject(id);
      setProjects((prev) => (prev ? prev.filter((p) => p.id !== id) : prev));
      pushToast({ kind: 'success', message: 'Project deleted' });
    } catch (err) {
      pushToast({ kind: 'error', message: `Delete failed: ${(err as Error).message}` });
    }
  };

  const onDuplicate = async (id: string): Promise<void> => {
    try {
      const dup = await api.duplicateProject(id);
      setProjects((prev) => (prev ? [dup, ...prev] : prev));
      pushToast({ kind: 'success', message: 'Duplicated' });
    } catch (err) {
      pushToast({ kind: 'error', message: `Duplicate failed: ${(err as Error).message}` });
    }
  };

  const startBlank = (): void => {
    // Open editor without an id (in-memory only) and reset state
    setDiagram(createDefaultDiagram(), { record: false });
    history.clear();
    navigate('/editor');
  };

  return (
    <div className="h-full overflow-y-auto nd-scroll bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      <header className="flex items-center justify-between px-6 h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">NETDRAW</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => importFileRef.current?.click()}
            className="h-9 px-3 rounded border border-slate-200 dark:border-slate-750 hover:bg-slate-100 dark:hover:bg-slate-850 text-sm font-medium transition-colors cursor-pointer"
          >
            📤 Import project (.ndj)
          </button>
          <input
            ref={importFileRef}
            type="file"
            accept=".ndj"
            onChange={onImportProject}
            className="hidden"
          />
          <button
            type="button"
            onClick={startBlank}
            className="h-9 px-3 rounded border border-slate-200 dark:border-slate-750 hover:bg-slate-100 dark:hover:bg-slate-850 text-sm font-medium transition-colors cursor-pointer"
          >
            Open blank editor
          </button>
          <button
            type="button"
            onClick={() => void createBlank()}
            className="h-9 px-3 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-colors cursor-pointer"
          >
            + New project
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-2">Welcome</h2>
          <p className="text-slate-600 dark:text-slate-300 max-w-2xl">
            NETDRAW is a free, open-source network &amp; infrastructure diagram editor. Drag shapes
            from the left panel, connect them with smart routing, organize with layers, and export
            to SVG / PNG / PDF.
          </p>
        </section>

        {error && (
          <div className="mb-6 p-4 rounded border border-rose-300 bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
            <strong>Could not reach the backend:</strong> {error}. You can still{' '}
            <button type="button" className="underline" onClick={startBlank}>
              open a blank editor
            </button>{' '}
            in offline mode.
          </div>
        )}

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Your projects</h2>
            <button
              type="button"
              onClick={() => void load()}
              className="text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            >
              Refresh
            </button>
          </div>
          {projects === null ? (
            <p className="text-slate-500">Loading…</p>
          ) : projects.length === 0 ? (
            <div className="p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded text-center">
              <p className="text-slate-500 mb-3">No projects yet.</p>
              <button
                type="button"
                onClick={() => void createBlank()}
                className="h-9 px-4 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm"
              >
                Create your first diagram
              </button>
            </div>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {projects.map((p) => (
                <li
                  key={p.id}
                  className="group border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-950 overflow-hidden hover:shadow"
                >
                  <Link to={`/editor/${p.id}`} className="block">
                    <div className="aspect-video bg-slate-100 dark:bg-slate-900 flex items-center justify-center overflow-hidden">
                      {p.thumbnail ? (
                        <img
                          src={p.thumbnail}
                          alt={p.name}
                          className="object-contain w-full h-full"
                        />
                      ) : (
                        <span className="text-slate-400 text-sm">No preview</span>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-sm truncate">{p.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Updated {new Date(p.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  </Link>
                  <div className="px-3 pb-3 flex items-center justify-end gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => void onDuplicate(p.id)}
                      className="px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Duplicate
                    </button>
                    <button
                      type="button"
                      onClick={() => void onDelete(p.id)}
                      className="px-2 py-1 rounded text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-slate-600 dark:text-slate-300">
          <FeatureCard
            title="Vector-first canvas"
            body="Every shape, connector, and grid line is rendered as real SVG. Crisp at any zoom, ready for print."
          />
          <FeatureCard
            title="Network primitives"
            body="Routers, switches, firewalls, racks, OLTs, ONTs and more — all vector, all searchable."
          />
          <FeatureCard
            title="Self-hosted"
            body="Single docker compose file. SQLite by default, PostgreSQL if you outgrow it. No third-party telemetry."
          />
        </section>
      </main>
      <ToolToast />
    </div>
  );
}

function FeatureCard({ title, body }: { title: string; body: string }): JSX.Element {
  return (
    <div className="p-4 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-950">
      <h3 className="font-medium text-slate-800 dark:text-slate-100 mb-1">{title}</h3>
      <p>{body}</p>
    </div>
  );
}
